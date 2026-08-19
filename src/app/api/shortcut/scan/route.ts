import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptOCR } from '@/lib/ai/provider';
import { formatIDR } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

function cleanBotToken(token?: string) {
  if (!token) return undefined;
  return token.trim().replace(/^["']|["']$/g, '').replace(/^TELEGRAM_BOT_TOKEN=\s*/, '').trim();
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnwqifnkgrlvpklapfkx.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  return createClient(url, key);
}

async function sendTelegramPhoto(botToken: string, chatId: string | number, photoBlob: Blob | File, caption: string) {
  try {
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption);
    formData.append('photo', photoBlob, 'screenshot.jpg');

    await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('Failed to send Telegram photo:', err);
  }
}

async function sendTelegramMessage(botToken: string, chatId: string | number, text: string, parseMode: string = 'HTML') {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

export async function POST(req: NextRequest) {
  const botToken = cleanBotToken(process.env.TELEGRAM_BOT_TOKEN) || '8825779149:AAFI5p2O7Tq0T1qXhJj_rnssv3o4xJFjzmw';

  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const token = (formData.get('token') as string) || (formData.get('telegram_id') as string);

    if (!photo) {
      return NextResponse.json({ error: 'Field "photo" is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Authenticate user via token or fallback to latest user
    let userProfile: any = null;
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

    // Convert file to buffer and base64
    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = photo.type || 'image/jpeg';

    // 1. Immediately send photo preview to Telegram if user is connected
    if (userProfile.telegram_id && botToken) {
      await sendTelegramPhoto(
        botToken,
        userProfile.telegram_id,
        photo,
        'MoneyAssist menerima screenshot dari Pintasan iPhone. Sedang dianalisis...'
      );
    }

    // 2. Process with AI Vision OCR
    try {
      const ocrResult = await generateReceiptOCR({ imageBase64: base64, mimeType });
      const txData = ocrResult.extracted;

      if (!txData || !txData.amount) {
        if (userProfile.telegram_id && botToken) {
          await sendTelegramMessage(
            botToken,
            userProfile.telegram_id,
            `<b>Analisis Dokumen</b>\n\nScreenshot dari Pintasan iPhone berhasil diterima, namun nominal transaksi tidak terdeteksi secara jelas. Pastikan tangkapan layar menampilkan rincian total transaksi.`
          );
        }

        return NextResponse.json({
          error: 'Nominal tidak terdeteksi jelas pada screenshot.',
          extracted: txData,
        }, { status: 422 });
      }

      const today = new Date().toISOString().split('T')[0];
      const txDate = txData.date || today;

      // Format items
      let itemsNote = '';
      if (txData.items && Array.isArray(txData.items) && txData.items.length > 0) {
        itemsNote = txData.items
          .map((it: any) =>
            typeof it === 'object'
              ? `${it.name || 'Item'} (${it.qty || 1}x @${formatIDR(it.price || 0)}) = ${formatIDR(it.total || it.price || 0)}`
              : it
          )
          .join('; ');
      }

      // 3. Insert into Supabase transactions via RPC or table
      const { data: insertedTx, error: insertError } = await supabase.from('transactions').insert([
        {
          user_id: userProfile.id,
          type: 'expense',
          amount: Number(txData.amount),
          description: txData.merchant || 'Screenshot Pintasan iPhone',
          transaction_date: txDate,
          payment_method: 'E-Wallet',
          notes: itemsNote || txData.notes || 'Dicatat via Pintasan iPhone',
        },
      ]).select().single();

      if (insertError) throw insertError;

      // 4. Send Confirmation Result to Telegram (Professional Tone, Zero Emojis)
      if (userProfile.telegram_id && botToken) {
        await sendTelegramMessage(
          botToken,
          userProfile.telegram_id,
          `<b>Transaksi Berhasil Dicatat</b>\n\n` +
            `• Tipe: Pengeluaran\n` +
            `• Nominal: <b>${formatIDR(txData.amount)}</b>\n` +
            `• Kategori: ${txData.category || 'Belanja & Kebutuhan'}\n` +
            `• Keterangan: ${txData.merchant || 'Screenshot Pintasan iPhone'}\n` +
            `• Tanggal: ${txDate}`
        );
      }

      return NextResponse.json({
        success: true,
        transaction: insertedTx,
        extracted: txData,
        provider: ocrResult.provider,
      });
    } catch (ocrErr: any) {
      if (userProfile.telegram_id && botToken) {
        await sendTelegramMessage(
          botToken,
          userProfile.telegram_id,
          `Screenshot dari Pintasan iPhone sudah masuk ke server, namun terjadi kendala pemrosesan AI.\n\nDetail: ${ocrErr.message || 'Layanan AI vision sibuk.'}`
        );
      }
      throw ocrErr;
    }
  } catch (err: any) {
    console.error('Shortcut scan error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process screenshot.' }, { status: 500 });
  }
}
