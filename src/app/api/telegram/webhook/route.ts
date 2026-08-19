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

    // 1. Check user profile via RPC or table
    let profile: any = null;
    try {
      const { data: rpcProfile } = await supabase.rpc('get_profile_by_telegram', {
        p_telegram_id: telegramId,
      });
      if (rpcProfile && rpcProfile.found) {
        profile = rpcProfile;
      }
    } catch {
      // fallback
    }

    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      if (data) profile = data;
    }

    // -------------------------------------------------------------
    // COMMAND: /start [CODE]
    // -------------------------------------------------------------
    if (message.text && message.text.startsWith('/start')) {
      const parts = message.text.split(' ');
      const deepLinkCode = parts[1]?.trim().toUpperCase();

      if (deepLinkCode) {
        const { data: pairRes, error: rpcErr } = await supabase.rpc('pair_telegram_user', {
          p_pairing_code: deepLinkCode,
          p_telegram_id: telegramId,
          p_telegram_username: username,
        });

        if (pairRes && pairRes.success) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `<b>Koneksi Akun Berhasil</b>\n\n` +
              `Akun atas nama <b>${pairRes.full_name || pairRes.email}</b> telah terhubung dengan MoneyAssist 2.0.\n\n` +
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
            `<b>Format Penggunaan:</b>\n` +
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
            `Cukup kirimkan Kode Pairing Anda langsung di chat ini (contoh: <b>DEMO20</b> atau <b>/pair DEMO20</b>).`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // PAIRING HANDLER (Supports: "KODE", "/pair KODE", "pair KODE")
    // -------------------------------------------------------------
    const rawText = (message.text || '').trim();
    const isPairCommand =
      rawText.startsWith('/pair') ||
      rawText.toLowerCase().startsWith('pair ') ||
      (!profile && !rawText.includes(' ') && rawText.length >= 4 && rawText.length <= 15);

    if (isPairCommand) {
      let codeToTest = rawText;
      if (codeToTest.startsWith('/pair')) {
        codeToTest = codeToTest.replace('/pair', '').trim();
      } else if (codeToTest.toLowerCase().startsWith('pair ')) {
        codeToTest = codeToTest.replace(/^pair\s+/i, '').trim();
      }
      codeToTest = codeToTest.toUpperCase();

      if (codeToTest) {
        // Attempt RPC pairing (bypasses RLS securely)
        const { data: pairRes, error: rpcErr } = await supabase.rpc('pair_telegram_user', {
          p_pairing_code: codeToTest,
          p_telegram_id: telegramId,
          p_telegram_username: username,
        });

        if (pairRes && pairRes.success) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `<b>Koneksi Akun Berhasil</b>\n\n` +
              `Akun atas nama <b>${pairRes.full_name || pairRes.email}</b> berhasil terhubung ke MoneyAssist 2.0.\n\n` +
              `Anda dapat langsung mencatat transaksi dengan mengetik pesan (contoh: <i>Beli bensin 50000</i>) atau mengirim foto struk.`
          );
          return NextResponse.json({ ok: true });
        } else {
          // Direct fallback if RPC is not yet created in Supabase
          const { data: directProfiles } = await supabase
            .from('profiles')
            .select('*')
            .ilike('pairing_code', codeToTest);

          if (directProfiles && directProfiles.length > 0) {
            const matched = directProfiles[0];
            await supabase
              .from('profiles')
              .update({
                telegram_id: telegramId,
                telegram_username: username,
              })
              .eq('id', matched.id);

            await sendTelegramMessage(
              botToken,
              chatId,
              `<b>Koneksi Akun Berhasil</b>\n\n` +
                `Akun atas nama <b>${matched.full_name || matched.email}</b> berhasil terhubung.`
            );
            return NextResponse.json({ ok: true });
          }

          if (!profile) {
            await sendTelegramMessage(
              botToken,
              chatId,
              `<b>Verifikasi Gagal</b>\n\nKode pairing <code>${codeToTest}</code> tidak ditemukan pada sistem.\n` +
                `Silakan periksa kembali kode Anda di menu Pintasan & Bot pada dashboard web MoneyAssist.`
            );
            return NextResponse.json({ ok: true });
          }
        }
      }
    }

    // Unpaired barrier for other commands
    if (!profile) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `Akun Telegram Anda belum terdaftar pada sistem.\nSilakan kirimkan Kode Pairing Anda untuk menghubungkan akun.`
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // COMMAND: /saldo or /status
    // -------------------------------------------------------------
    if (message.text && (message.text.startsWith('/saldo') || message.text.startsWith('/status') || message.text.toLowerCase() === 'saldo')) {
      let income = 0;
      let expense = 0;
      let balance = 0;

      const { data: summaryData } = await supabase.rpc('get_telegram_summary', {
        p_telegram_id: telegramId,
      });

      if (summaryData && summaryData.found) {
        income = Number(summaryData.income) || 0;
        expense = Number(summaryData.expense) || 0;
        balance = Number(summaryData.balance) || 0;
      } else {
        const { data: txs } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('user_id', profile.id);

        income = txs?.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
        expense = txs?.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
        balance = income - expense;
      }

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
      await sendTelegramMessage(botToken, chatId, `Sedang menganalisis dokumen transaksi...`);

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
          `Nominal transaksi tidak terdeteksi secara jelas dari dokumen. Pastikan gambar yang dikirimkan memiliki pencahayaan dan resolusi yang memadai.`
        );
        return NextResponse.json({ ok: true });
      }

      // Format items
      let itemsNote = '';
      let itemsDisplay = '';
      if (txData.items && Array.isArray(txData.items) && txData.items.length > 0) {
        const itemLines = txData.items.map((it: any) =>
          typeof it === 'object'
            ? `${it.name || 'Item'} (${it.qty || 1}x @${formatIDR(it.price || 0)}) = ${formatIDR(it.total || it.price || 0)}`
            : it
        );
        itemsNote = itemLines.join('; ');
        itemsDisplay = `\n• Rincian Item: ${itemLines.slice(0, 3).join(', ')}${itemLines.length > 3 ? ' (dan lainnya)' : ''}`;
      }

      // Insert via RPC or table
      await supabase.rpc('add_telegram_transaction', {
        p_telegram_id: telegramId,
        p_type: 'expense',
        p_amount: Number(txData.amount),
        p_description: txData.merchant || 'Transaksi Struk Dokumen',
        p_category_name: txData.category || 'Belanja & Kebutuhan',
        p_notes: itemsNote || txData.notes || 'Dicatat via Telegram OCR',
      });

      await sendTelegramMessage(
        botToken,
        chatId,
        `<b>Pencatatan Transaksi Berhasil</b>\n\n` +
          `• Merchant/Toko: <b>${txData.merchant || 'Transaksi Belanja'}</b>\n` +
          `• Total Nominal: <b>${formatIDR(txData.amount)}</b>\n` +
          `• Kategori: ${txData.category || 'Belanja & Kebutuhan'}\n` +
          `• Tanggal: ${txData.date || new Date().toISOString().split('T')[0]}${itemsDisplay}\n\n` +
          `Transaksi telah tersimpan ke dalam akun Anda.`
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
        await supabase.rpc('add_telegram_transaction', {
          p_telegram_id: telegramId,
          p_type: tx.type || 'expense',
          p_amount: Number(tx.amount),
          p_description: tx.description || 'Pencatatan Telegram',
          p_category_name: tx.suggested_category || 'Lain-lain',
          p_notes: 'Dicatat via Bot Telegram',
        });

        await sendTelegramMessage(
          botToken,
          chatId,
          `<b>Pencatatan Transaksi Berhasil</b>\n\n` +
            `• Keterangan: <b>${tx.description}</b>\n` +
            `• Nominal: <b>${formatIDR(tx.amount)}</b>\n` +
            `• Jenis: ${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}\n` +
            `• Kategori: ${tx.suggested_category || 'Umum'}`
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
