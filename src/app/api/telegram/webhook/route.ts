import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIChat, generateReceiptOCR } from '@/lib/ai/provider';
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
    const update = await req.json();
    const supabase = getSupabaseAdmin();

    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const telegramId = message.from.id.toString();
    const username = message.from.username || message.from.first_name || 'Pengguna';

    // 1. Check if user is paired with MoneyAssist account
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    // -------------------------------------------------------------
    // COMMAND: /start [CODE]
    // -------------------------------------------------------------
    if (message.text && message.text.startsWith('/start')) {
      const parts = message.text.split(' ');
      const deepLinkCode = parts[1]?.trim().toUpperCase();

      if (deepLinkCode) {
        const { data: matchedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('pairing_code', deepLinkCode)
          .single();

        if (matchedProfile) {
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
            `<b>Koneksi Akun Berhasil</b>\n\n` +
              `Akun atas nama <b>${matchedProfile.full_name || matchedProfile.email}</b> telah terhubung dengan MoneyAssist 2.0.\n\n` +
              `<b>Panduan Penggunaan:</b>\n` +
              `- Catat Transaksi: Ketik pesan pengeluaran (contoh: <i>Makan siang 25000</i> atau <i>Beli bensin 50rb</i>)\n` +
              `- Scan Struk: Kirimkan foto nota/struk belanja atau tangkapan layar mutasi perbankan\n` +
              `- Informasi Saldo: Ketik <code>/saldo</code>`
          );
          return NextResponse.json({ ok: true });
        }
      }

      if (profile) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `<b>MoneyAssist 2.0 Financial System</b>\n\n` +
            `Akun Telegram Anda aktif terhubung dengan <b>${profile.full_name || profile.email}</b>.\n\n` +
            `<b>Format Perintah:</b>\n` +
            `- Catat Transaksi: Ketik nominal dan keterangan (contoh: <i>Makan siang 25000</i>)\n` +
            `- Scan Dokumen: Kirimkan foto struk pembayaran\n` +
            `- Ringkasan Saldo: Ketik <code>/saldo</code>`
        );
      } else {
        await sendTelegramMessage(
          botToken,
          chatId,
          `<b>MoneyAssist 2.0 Financial System</b>\n\n` +
            `Akun Telegram Anda belum terhubung dengan akun MoneyAssist.\n\n` +
            `<b>Petunjuk Penghubungan Akun:</b>\n` +
            `1. Buka menu Pintasan & Bot pada dashboard web MoneyAssist\n` +
            `2. Salin Kode Pairing Anda\n` +
            `3. Kirimkan pesan dengan format:\n<code>/pair KODE_ANDA</code>`
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
          `Format tidak valid. Gunakan format:\n<code>/pair KODE_ANDA</code>`
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
          `<b>Verifikasi Gagal</b>\n\nKode pairing tidak ditemukan. Pastikan kode yang dimasukkan sesuai dengan yang tertera di menu Pintasan & Bot web MoneyAssist.`
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
        `<b>Koneksi Akun Berhasil</b>\n\n` +
          `Akun atas nama <b>${matchedProfile.full_name || matchedProfile.email}</b> berhasil terhubung.\n` +
          `Pencatatan transaksi via teks dan foto dokumen keuangan sudah aktif.`
      );
      return NextResponse.json({ ok: true });
    }

    // Unpaired barrier for other commands
    if (!profile) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `Akun Telegram Anda belum terdaftar pada sistem.\nSilakan hubungkan akun dengan perintah:\n<code>/pair KODE_ANDA</code>`
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
        `<b>Ringkasan Finansial Akun</b>\n\n` +
          `• Sisa Saldo: <b>${formatIDR(balance)}</b>\n` +
          `• Total Pemasukan: ${formatIDR(income)}\n` +
          `• Total Pengeluaran: ${formatIDR(expense)}\n\n` +
          `Data diperbarui secara real-time dari database MoneyAssist 2.0.`
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // PHOTO MESSAGE (Scan Struk Kasir / Screenshot m-Banking)
    // -------------------------------------------------------------
    if (message.photo && message.photo.length > 0) {
      await sendTelegramMessage(botToken, chatId, `Sedang memproses dan menganalisis dokumen bukti transaksi...`);

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
          `Nominal transaksi tidak dapat terdeteksi secara jelas dari dokumen. Pastikan gambar yang dikirimkan memiliki resolusi yang memadai.`
        );
        return NextResponse.json({ ok: true });
      }

      // Format items detail
      let itemsNote = null;
      let itemsDisplay = '';
      if (txData.items && Array.isArray(txData.items) && txData.items.length > 0) {
        const itemLines = txData.items.map((it: any) =>
          typeof it === 'object'
            ? `${it.name || 'Item'} (${it.qty || 1}x @${formatIDR(it.price || 0)}) = ${formatIDR(it.total || it.price || 0)}`
            : it
        );
        itemsNote = itemLines.join('; ');
        itemsDisplay = `\n• Rincian Item: ${itemLines.slice(0, 3).join(', ')}${itemLines.length > 3 ? ' (dan item lainnya)' : ''}`;
      }

      // Save to Supabase
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('transactions').insert([
        {
          user_id: profile.id,
          type: 'expense',
          amount: Number(txData.amount),
          description: txData.merchant || 'Transaksi Struk Dokumen',
          transaction_date: txData.date || today,
          payment_method: 'Cash',
          notes: itemsNote || txData.notes || 'Dicatat via Telegram Dokumen OCR',
        },
      ]);

      await sendTelegramMessage(
        botToken,
        chatId,
        `<b>Pencatatan Transaksi Berhasil</b>\n\n` +
          `• Merchant/Toko: <b>${txData.merchant || 'Transaksi Belanja'}</b>\n` +
          `• Total Nominal: <b>${formatIDR(txData.amount)}</b>\n` +
          `• Kategori: ${txData.category || 'Belanja & Kebutuhan'}\n` +
          `• Tanggal: ${txData.date || today}${itemsDisplay}\n\n` +
          `Sistem telah menyimpan data ini ke dalam akun Anda.`
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
          `<b>Pencatatan Transaksi Berhasil</b>\n\n` +
            `• Keterangan: <b>${tx.description}</b>\n` +
            `• Nominal: <b>${formatIDR(tx.amount)}</b>\n` +
            `• Jenis: ${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}\n` +
            `• Kategori: ${tx.suggested_category || 'Umum'}\n` +
            `• Tanggal: ${today}`
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
