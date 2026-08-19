import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptOCR } from '@/lib/ai/provider';
import { formatIDR } from '@/lib/utils/currency';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnwqifnkgrlvpklapfkx.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const token = (formData.get('token') as string) || (formData.get('telegram_id') as string);

    if (!photo) {
      return NextResponse.json({ error: 'Field "photo" is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Authenticate user via token or fallback to latest user
    let userProfile = null;
    if (token) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`api_token.eq.${token},telegram_id.eq.${token}`)
        .single();
      userProfile = data;
    }

    if (!userProfile) {
      const { data } = await supabase.from('profiles').select('*').limit(1).single();
      userProfile = data;
    }

    if (!userProfile) {
      return NextResponse.json({ error: 'No user profile found to associate transaction.' }, { status: 404 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = photo.type || 'image/jpeg';

    // Process with AI Vision
    const ocrResult = await generateReceiptOCR({ imageBase64: base64, mimeType });
    const txData = ocrResult.extracted;

    if (!txData || !txData.amount) {
      return NextResponse.json({
        error: 'Nominal tidak terdeteksi jelas pada screenshot.',
        extracted: txData,
      }, { status: 422 });
    }

    const today = new Date().toISOString().split('T')[0];
    const txDate = txData.date || today;

    // Insert into Supabase transactions
    const { data: insertedTx, error: insertError } = await supabase.from('transactions').insert([
      {
        user_id: userProfile.id,
        type: 'expense',
        amount: Number(txData.amount),
        description: txData.merchant || 'Screenshot Pintasan iPhone',
        transaction_date: txDate,
        payment_method: 'E-Wallet',
        notes: txData.items ? `Item: ${txData.items.join(', ')}` : 'Dicatat via Pintasan iPhone',
      },
    ]).select().single();

    if (insertError) throw insertError;

    // Send Telegram push notification if connected
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.replace(/^TELEGRAM_BOT_TOKEN=/, '').trim();
    if (userProfile.telegram_id && botToken) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userProfile.telegram_id,
            text:
              `📲 <b>Pintasan iPhone: Transaksi Dicatat!</b>\n\n` +
              `• <b>Merchant</b>: ${txData.merchant || 'Screenshot Transaksi'}\n` +
              `• <b>Nominal</b>: ${formatIDR(txData.amount)}\n` +
              `• <b>Kategori</b>: ${txData.category || 'Pengeluaran'}\n` +
              `• <b>Tanggal</b>: ${txDate}\n\n` +
              `<i>⚡ ${ocrResult.provider}</i>`,
            parse_mode: 'HTML',
          }),
        });
      } catch (err) {
        console.error('Telegram notification error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      transaction: insertedTx,
      extracted: txData,
      provider: ocrResult.provider,
    });
  } catch (err: any) {
    console.error('Shortcut scan error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process screenshot.' }, { status: 500 });
  }
}
