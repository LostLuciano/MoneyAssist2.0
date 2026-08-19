import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIChat, generateReceiptOCR } from '@/lib/ai/provider';
import { extractTransactionHeuristic } from '@/lib/utils/transactionParser';
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

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: 'Cek Saldo' }, { text: 'Riwayat Transaksi' }],
    [{ text: 'Analisis Keuangan' }, { text: 'Panduan Format' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

const INLINE_QUICK_ACTIONS = {
  inline_keyboard: [
    [
      { text: 'Riwayat Terakhir', callback_data: 'history' },
      { text: 'Cek Saldo', callback_data: 'balance' },
    ],
    [
      { text: 'Buka Web Dashboard', url: 'https://money-assist2-0.vercel.app/dashboard' },
    ],
  ],
};

async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  replyMarkup?: any,
  parseMode: string = 'HTML'
) {
  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

async function answerCallbackQuery(botToken: string, callbackQueryId: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (err) {
    console.error('Failed to answer callback query:', err);
  }
}

export async function POST(req: NextRequest) {
  const botToken = cleanBotToken(process.env.TELEGRAM_BOT_TOKEN) || '8825779149:AAFI5p2O7Tq0T1qXhJj_rnssv3o4xJFjzmw';

  try {
    const update = await req.json();
    const supabase = getSupabaseAdmin();

    // -------------------------------------------------------------
    // HANDLE CALLBACK QUERY (Inline Button Clicks)
    // -------------------------------------------------------------
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const telegramId = cb.from.id.toString();
      const action = cb.data;

      await answerCallbackQuery(botToken, cb.id);

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (!profile) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `Akun belum terhubung. Silakan kirimkan Kode Pairing Anda untuk menghubungkan akun.`
        );
        return NextResponse.json({ ok: true });
      }

      if (action === 'history' || action === 'btn_history') {
        await handleHistoryCommand(botToken, chatId, profile.id, supabase);
        return NextResponse.json({ ok: true });
      }

      if (action === 'balance' || action === 'btn_balance') {
        await handleBalanceCommand(botToken, chatId, telegramId, profile.id, supabase);
        return NextResponse.json({ ok: true });
      }

      if (action === 'health' || action === 'btn_health') {
        await handleHealthCommand(botToken, chatId, telegramId, profile.id, supabase);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

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
        const { data: pairRes } = await supabase.rpc('pair_telegram_user', {
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
              `<b>Pilihan Menu Cepat:</b>\n` +
              `Gunakan tombol pilihan menu di bawah untuk memeriksa saldo, riwayat, atau analisis keuangan Anda.`,
            MAIN_KEYBOARD
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
            `Gunakan menu di bawah atau langsung ketik transaksi Anda (contoh: <i>Makan siang 25rb</i> atau kirim foto struk).`,
          MAIN_KEYBOARD
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
      (!profile && !rawText.includes(' ') && rawText.length >= 3 && rawText.length <= 15);

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
        const { data: pairRes } = await supabase.rpc('pair_telegram_user', {
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
              `Menu pilihan instan telah diaktifkan pada tombol chat Anda.`,
            MAIN_KEYBOARD
          );
          return NextResponse.json({ ok: true });
        } else {
          // Direct fallback
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
                `Akun atas nama <b>${matched.full_name || matched.email}</b> berhasil terhubung.`,
              MAIN_KEYBOARD
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

    const textLower = (message.text || '').toLowerCase().trim();

    // -------------------------------------------------------------
    // TEMPLATE 1: CEK SALDO / RINGKASAN SALDO
    // -------------------------------------------------------------
    if (
      textLower === 'cek saldo' ||
      textLower === 'saldo' ||
      textLower === '/saldo' ||
      textLower === '/status'
    ) {
      await handleBalanceCommand(botToken, chatId, telegramId, profile.id, supabase);
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // TEMPLATE 2: RIWAYAT TRANSAKSI
    // -------------------------------------------------------------
    if (
      textLower === 'riwayat transaksi' ||
      textLower === 'riwayat' ||
      textLower === '/riwayat' ||
      textLower === 'history' ||
      textLower === '/history'
    ) {
      await handleHistoryCommand(botToken, chatId, profile.id, supabase);
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // TEMPLATE 3: ANALISIS KEUANGAN
    // -------------------------------------------------------------
    if (
      textLower === 'analisis keuangan' ||
      textLower === 'analisis' ||
      textLower === '/analisis' ||
      textLower === 'audit' ||
      textLower === '/audit'
    ) {
      await handleHealthCommand(botToken, chatId, telegramId, profile.id, supabase);
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // TEMPLATE 4: PANDUAN FORMAT / BANTUAN
    // -------------------------------------------------------------
    if (
      textLower === 'panduan format' ||
      textLower === 'bantuan' ||
      textLower === '/help' ||
      textLower === 'help' ||
      textLower === 'menu'
    ) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `<b>Panduan Penggunaan MoneyAssist 2.0</b>\n\n` +
          `<b>1. Mencatat Transaksi Instan:</b>\n` +
          `Ketik pesan pengeluaran atau pemasukan secara langsung:\n` +
          `• <i>Beli bensin 50000</i> (atau <i>bensin 50rb</i>)\n` +
          `• <i>Makan siang 25rb</i>\n` +
          `• <i>Gaji bulanan 8.5jt</i>\n` +
          `• <i>Bayar tagihan listrik 150k</i>\n\n` +
          `<b>2. Scan Gambar / Struk Kasir / Bukti Pesanan:</b>\n` +
          `Kirimkan langsung foto nota belanja, invoice, atau screenshot detail pesanan marketplace.\n\n` +
          `<b>3. Menu Cepat:</b>\n` +
          `Gunakan tombol pilihan menu di bawah untuk memeriksa Saldo, Riwayat, atau Analisis Keuangan.`,
        MAIN_KEYBOARD
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // PHOTO MESSAGE (Scan Struk Kasir / Screenshot m-Banking)
    // -------------------------------------------------------------
    if (message.photo && message.photo.length > 0) {
      try {
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
            `Nominal transaksi tidak terdeteksi secara jelas dari dokumen. Pastikan gambar menampilkan angka total transaksi yang terbaca.`
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

        // Insert via RPC
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
            `• Toko / Merchant: <b>${txData.merchant || 'Transaksi Belanja'}</b>\n` +
            `• Total Nominal: <b>${formatIDR(txData.amount)}</b>\n` +
            `• Kategori: ${txData.category || 'Belanja & Kebutuhan'}\n` +
            `• Tanggal: ${txData.date || new Date().toISOString().split('T')[0]}${itemsDisplay}\n\n` +
            `Transaksi telah tersimpan ke dalam akun Anda.`,
          INLINE_QUICK_ACTIONS
        );
      } catch (photoErr: any) {
        console.error('Telegram photo processing error:', photoErr);
        await sendTelegramMessage(
          botToken,
          chatId,
          `Gagal menganalisis gambar transaksi.\n\nDetail: ${photoErr.message || 'Layanan AI vision sibuk.'}\nPastikan gambar memiliki rincian nominal yang jelas.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // TEXT MESSAGE (Instant Heuristic Parser + AI Augmentation)
    // -------------------------------------------------------------
    if (message.text) {
      const userText = message.text;

      // 1. Check Instant Heuristic Parser (< 1ms, 100% Reliable for all transaction phrases)
      const parsedTx = extractTransactionHeuristic(userText);

      if (parsedTx && parsedTx.amount > 0) {
        const today = new Date().toISOString().split('T')[0];

        await supabase.rpc('add_telegram_transaction', {
          p_telegram_id: telegramId,
          p_type: parsedTx.type,
          p_amount: Number(parsedTx.amount),
          p_description: parsedTx.description,
          p_category_name: parsedTx.category,
          p_notes: 'Dicatat via Bot Telegram',
        });

        await sendTelegramMessage(
          botToken,
          chatId,
          `<b>Pencatatan Transaksi Berhasil</b>\n\n` +
            `• Keterangan: <b>${parsedTx.description}</b>\n` +
            `• Nominal: <b>${formatIDR(parsedTx.amount)}</b>\n` +
            `• Jenis: ${parsedTx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}\n` +
            `• Kategori: ${parsedTx.category}\n` +
            `• Tanggal: ${today}`,
          INLINE_QUICK_ACTIONS
        );
        return NextResponse.json({ ok: true });
      }

      // 2. If not a direct transaction, call AI Chat for advice
      try {
        const aiResult = await generateAIChat({ message: userText });

        if (aiResult.detectedTransaction && aiResult.detectedTransaction.amount) {
          const tx = aiResult.detectedTransaction;
          await supabase.rpc('add_telegram_transaction', {
            p_telegram_id: telegramId,
            p_type: tx.type || 'expense',
            p_amount: Number(tx.amount),
            p_description: tx.description || 'Pencatatan Telegram',
            p_category_name: tx.suggested_category || 'Lain-lain',
            p_notes: 'Dicatat via Bot Telegram AI',
          });

          await sendTelegramMessage(
            botToken,
            chatId,
            `<b>Pencatatan Transaksi Berhasil</b>\n\n` +
              `• Keterangan: <b>${tx.description}</b>\n` +
              `• Nominal: <b>${formatIDR(tx.amount)}</b>\n` +
              `• Jenis: ${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}\n` +
              `• Kategori: ${tx.suggested_category || 'Umum'}`,
            INLINE_QUICK_ACTIONS
          );
        } else {
          await sendTelegramMessage(botToken, chatId, aiResult.reply, MAIN_KEYBOARD);
        }
      } catch (aiErr: any) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `Format pesan tidak terdeteksi sebagai transaksi.\n\nContoh format yang valid:\n- <i>Beli bensin 50000</i>\n- <i>Makan siang 25rb</i>\n- <i>Gaji bulanan 8.5jt</i>\n- <i>Bayar tagihan wifi 350k</i>`,
          MAIN_KEYBOARD
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram Webhook Handler Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR COMMANDS & TEMPLATES
// -------------------------------------------------------------

async function handleBalanceCommand(
  botToken: string,
  chatId: string | number,
  telegramId: string,
  userId: string,
  supabase: any
) {
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
      .eq('user_id', userId);

    income = txs?.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
    expense = txs?.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
    balance = income - expense;
  }

  await sendTelegramMessage(
    botToken,
    chatId,
    `<b>Ringkasan Finansial Akun</b>\n\n` +
      `• Sisa Saldo: <b>${formatIDR(balance)}</b>\n` +
      `• Total Pemasukan: ${formatIDR(income)}\n` +
      `• Total Pengeluaran: ${formatIDR(expense)}\n\n` +
      `<i>Data diperbarui secara real-time dari database MoneyAssist 2.0.</i>`,
    INLINE_QUICK_ACTIONS
  );
}

async function handleHistoryCommand(
  botToken: string,
  chatId: string | number,
  userId: string,
  supabase: any
) {
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, description, amount, type, transaction_date, notes, categories(name)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !txs || txs.length === 0) {
    await sendTelegramMessage(
      botToken,
      chatId,
      `<b>Riwayat Transaksi</b>\n\nBelum ada transaksi yang tercatat pada akun Anda.\nKetik transaksi pertama Anda (contoh: <i>Beli kopi 25rb</i>).`,
      MAIN_KEYBOARD
    );
    return;
  }

  let text = `<b>Riwayat 5 Transaksi Terakhir</b>\n\n`;
  txs.forEach((tx: any, idx: number) => {
    const categoryName = tx.categories?.name || 'Umum';
    const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    text +=
      `<b>${idx + 1}. ${tx.description}</b>\n` +
      `• Nominal: <b>${formatIDR(tx.amount)}</b> (${typeLabel})\n` +
      `• Tanggal: ${tx.transaction_date}\n` +
      `• Kategori: ${categoryName}\n\n`;
  });

  text += `<i>Lihat riwayat lengkap dan grafik di dashboard web.</i>`;

  await sendTelegramMessage(botToken, chatId, text, INLINE_QUICK_ACTIONS);
}

async function handleHealthCommand(
  botToken: string,
  chatId: string | number,
  telegramId: string,
  userId: string,
  supabase: any
) {
  const { data: summaryData } = await supabase.rpc('get_telegram_summary', {
    p_telegram_id: telegramId,
  });

  const income = Number(summaryData?.income) || 0;
  const expense = Number(summaryData?.expense) || 0;
  const ratio = income > 0 ? Math.round((expense / income) * 100) : expense > 0 ? 100 : 0;

  let statusText = 'Controlled Spending (Terkendali)';
  let advice = 'Pertahankan pola keuangan ini dan sisihkan minimal 20% ke tabungan/investasi.';

  if (ratio > 100) {
    statusText = 'Critical Status (Defisit)';
    advice = 'Pengeluaran Anda melebihi pemasukan bulan ini. Prioritaskan kebutuhan pokok dan tunda pengeluaran non-primer.';
  } else if (ratio > 70) {
    statusText = 'Elevated Spending (Mendekati Batas)';
    advice = 'Pengeluaran Anda mulai mendekati batas ideal. Batasi jajan dan pengeluaran hiburan.';
  }

  await sendTelegramMessage(
    botToken,
    chatId,
    `<b>Analisis Kesehatan Finansial</b>\n\n` +
      `• Status: <b>${statusText}</b>\n` +
      `• Rasio Pengeluaran: <b>${ratio}%</b> dari pemasukan\n` +
      `• Total Pemasukan: ${formatIDR(income)}\n` +
      `• Total Pengeluaran: ${formatIDR(expense)}\n\n` +
      `<b>Rekomendasi:</b>\n${advice}`,
    INLINE_QUICK_ACTIONS
  );
}
