import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptOCR } from '@/lib/ai/provider';
import { formatIDR } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';

function cleanBotToken(token?: string) {
  if (!token) return undefined;
  return token.trim().replace(/^["']|["']$/g, '').replace(/^TELEGRAM_BOT_TOKEN=\s*/, '').trim();
}

function cleanShortcutToken(token?: string | null) {
  return String(token || '').trim().replace(/^["']|["']$/g, '');
}

function getSafeErrorDetail(error: unknown) {
  const raw = String((error as any)?.message || 'Error tidak diketahui.');
  return raw
    .replace(/gsk_[A-Za-z0-9_-]+/g, '[groq-key]')
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, '[openrouter-key]')
    .replace(/AIza[A-Za-z0-9_-]+/g, '[google-key]')
    .replace(/AQ\.[A-Za-z0-9_-]+/g, '[google-key]')
    .slice(0, 350);
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
  const botToken = cleanBotToken(process.env.TELEGRAM_BOT_TOKEN);

  try {
    const { searchParams } = new URL(req.url);
    const formData = await req.formData();
    const photo = (
      formData.get('photo') ||
      formData.get('image') ||
      formData.get('file') ||
      formData.get('screenshot')
    ) as File | null;
    const token = cleanShortcutToken(
      searchParams.get('token') ||
      searchParams.get('telegram_id') ||
      (formData.get('token') as string | null) ||
      (formData.get('telegram_id') as string | null)
    );

    if (!token) {
      return NextResponse.json(
        { error: 'Token Pintasan wajib ada di URL. Salin endpoint dari halaman Integrasi MoneyAssist.' },
        { status: 401 }
      );
    }

    if (!photo || typeof photo.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Field file "photo" wajib diisi dengan hasil Ambil Tangkapan Layar.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .or(`api_token.eq.${token},telegram_id.eq.${token}`)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'Token Pintasan tidak valid atau akun Telegram belum terhubung.' }, { status: 404 });
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
        const detail = getSafeErrorDetail(ocrErr);
        await sendTelegramMessage(
          botToken,
          userProfile.telegram_id,
          `Screenshot dari Pintasan iPhone sudah masuk ke server, namun terjadi kendala pemrosesan AI.\n\nDetail: ${detail}\n\nCek setelan API key/model AI backend lalu coba lagi.`
        );
      }
      throw ocrErr;
    }
  } catch (err: any) {
    console.error('Shortcut scan error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process screenshot.' }, { status: 500 });
  }
}
