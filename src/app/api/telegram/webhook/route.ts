import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIChat, generateReceiptOCR } from '@/lib/ai/provider';
import { formatIDR } from '@/lib/utils/currency';

// Supabase Admin client for background bot operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnwqifnkgrlvpklapfkx.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  return createClient(url, key);
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
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.replace(/^TELEGRAM_BOT_TOKEN=/, '').trim();
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured.' }, { status: 400 });
  }

  try {
    const update = await req.json();
    const supabase = getSupabaseAdmin();

    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const telegramId = message.from.id.toString();
    const username = message.from.username || message.from.first_name || 'User';

    // 1. Check if user is paired with MoneyAssist account
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    // -------------------------------------------------------------
    // COMMAND: /start
    // -------------------------------------------------------------
    if (message.text && message.text.startsWith('/start')) {
      if (profile) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `👋 <b>Halo, ${profile.full_name || username}!</b>\n\nAkun Telegram Anda sudah terhubung ke <b>MoneyAssist 2.0</b>.\n\n` +
            `✨ <b>Cara Pakai:</b>\n` +
            `• Ketik transaksi: <i>"Makan siang 25rb"</i> atau <i>"Beli bensin 50000"</i>\n` +
            `• Kirim foto struk / screenshot m-Banking untuk scan otomatis!\n` +
            `• Cek saldo: <code>/saldo</code>`
        );
      } else {
        await sendTelegramMessage(
          botToken,
          chatId,
          `👋 <b>Selamat Datang di MoneyAssist AI 2.0 Bot!</b>\n\n` +
            `Hubungkan akun Anda terlebih dahulu untuk mencatat transaksi secara otomatis.\n\n` +
            `1. Buka menu <b>Pintasan & Bot</b> di dashboard web MoneyAssist\n` +
            `2. Salin 6 digit Kode Pairing Anda\n` +
            `3. Kirimkan ke sini dengan format:\n<code>/pair KODE_ANDA</code>`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // COMMAND: /pair <CODE>
    // -------------------------------------------------------------
    if (message.text && message.text.startsWith('/pair')) {
      const code = message.text.replace('/pair', '').trim().toUpperCase();
      if (!code) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `Format salah. Gunakan: <code>/pair KODE_ANDA</code>\n(Contoh: <code>/pair A1B2C3</code>)`
        );
        return NextResponse.json({ ok: true });
      }

      const { data: matchedProfile, error: pairError } = await supabase
        .from('profiles')
        .select('*')
        .eq('pairing_code', code)
        .single();

      if (pairError || !matchedProfile) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `❌ <b>Kode pairing tidak ditemukan atau salah.</b>\nSilakan periksa kembali kode di menu Pintasan & Bot di web MoneyAssist.`
        );
        return NextResponse.json({ ok: true });
      }

      // Link telegram_id
      await supabase
        .from('profiles')
        .update({
          telegram_id: telegramId,
          telegram_username: username,
        })
        .eq('id', matchedProfile.id);

      await sendTelegramMessage(
        botToken,
        chatId,
        `✅ <b>Berhasil Terhubung!</b>\n\nSelamat datang <b>${matchedProfile.full_name || matchedProfile.email}</b>!\n` +
          `Mulai sekarang Anda bisa mencatat pengeluaran via chat teks atau kirim foto struk langsung di sini.`
      );
      return NextResponse.json({ ok: true });
    }

    // Unpaired barrier for other commands
    if (!profile) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `⚠️ Akun Telegram Anda belum terhubung dengan web MoneyAssist 2.0.\n\nSilakan hubungkan dengan perintah:\n<code>/pair KODE_ANDA</code>`
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // COMMAND: /saldo or /status
    // -------------------------------------------------------------
    if (message.text && (message.text.startsWith('/saldo') || message.text.startsWith('/status'))) {
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', profile.id);

      const income = txs?.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
      const expense = txs?.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
      const balance = income - expense;

      await sendTelegramMessage(
        botToken,
        chatId,
        `📊 <b>Ringkasan Finansial MoneyAssist 2.0</b>\n\n` +
          `• <b>Sisa Saldo</b>: ${formatIDR(balance)}\n` +
          `• <b>Pemasukan</b>: ${formatIDR(income)}\n` +
          `• <b>Pengeluaran</b>: ${formatIDR(expense)}\n\n` +
          `<i>💡 Kelola lebih detail di dashboard web!</i>`
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // PHOTO MESSAGE (Scan Struk Kasir / Screenshot m-Banking)
    // -------------------------------------------------------------
    if (message.photo && message.photo.length > 0) {
      await sendTelegramMessage(botToken, chatId, `🔍 <i>Menganalisis foto bukti transaksi dengan AI Vision...</i>`);

      const photo = message.photo[message.photo.length - 1];
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`);
      const fileJson = await fileRes.json();
      const filePath = fileJson.result.file_path;

      const imgBuffer = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`).then((r) =>
        r.arrayBuffer()
      );
      const base64 = Buffer.from(imgBuffer).toString('base64');

      const ocrResult = await generateReceiptOCR({
        imageBase64: base64,
        mimeType: 'image/jpeg',
      });

      const txData = ocrResult.extracted;
      if (!txData || !txData.amount) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `⚠️ Nominal transaksi tidak terdeteksi jelas dari gambar. Pastikan foto struk / screenshot tidak buram.`
        );
        return NextResponse.json({ ok: true });
      }

      // Save to Supabase
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('transactions').insert([
        {
          user_id: profile.id,
          type: 'expense',
          amount: Number(txData.amount),
          description: txData.merchant || 'Transaksi Foto Telegram',
          transaction_date: txData.date || today,
          payment_method: 'Cash',
          notes: txData.items ? `Item: ${txData.items.join(', ')}` : null,
        },
      ]);

      await sendTelegramMessage(
        botToken,
        chatId,
        `✅ <b>Transaksi Berhasil Dicatat (OCR AI)</b>\n\n` +
          `• <b>Toko / Merchant</b>: ${txData.merchant || 'Struk Belanja'}\n` +
          `• <b>Nominal</b>: ${formatIDR(txData.amount)}\n` +
          `• <b>Kategori</b>: ${txData.category || 'Belanja & Kebutuhan'}\n` +
          `• <b>Tanggal</b>: ${txData.date || today}\n\n` +
          `<i>⚡ Diproses oleh ${ocrResult.provider}</i>`
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // TEXT MESSAGE (Natural Language Logging & Financial Chat)
    // -------------------------------------------------------------
    if (message.text) {
      const userText = message.text;
      const aiResult = await generateAIChat({ message: userText });

      if (aiResult.detectedTransaction && aiResult.detectedTransaction.amount) {
        const tx = aiResult.detectedTransaction;
        const today = new Date().toISOString().split('T')[0];

        await supabase.from('transactions').insert([
          {
            user_id: profile.id,
            type: tx.type || 'expense',
            amount: Number(tx.amount),
            description: tx.description || 'Pencatatan Telegram',
            transaction_date: today,
            payment_method: 'Cash',
          },
        ]);

        await sendTelegramMessage(
          botToken,
          chatId,
          `✅ <b>Transaksi Berhasil Dicatat!</b>\n\n` +
            `• <b>Keterangan</b>: ${tx.description}\n` +
            `• <b>Nominal</b>: ${formatIDR(tx.amount)}\n` +
            `• <b>Tipe</b>: ${tx.type === 'income' ? '💰 Pemasukan' : '💸 Pengeluaran'}\n` +
            `• <b>Kategori</b>: ${tx.suggested_category || 'Umum'}\n\n` +
            `<i>${aiResult.reply}</i>`
        );
      } else {
        await sendTelegramMessage(botToken, chatId, aiResult.reply);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram Webhook Handler Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
