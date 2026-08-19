import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini/client';

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], financialContext } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const model = getGeminiModel();

    if (!model) {
      // Fallback response when GEMINI_API_KEY is not configured yet
      return NextResponse.json({
        reply: `Halo! Saya MoneyAssist AI. Saat ini GEMINI_API_KEY belum dikonfigurasi di file .env.local Anda.\n\nContoh jawaban simulasi: Pertahankan rasio pengeluaran di bawah 70% dari total pemasukan bulanan untuk menjaga keuangan tetap stabil dan sehat.`,
        isMock: true,
      });
    }

    // Build context prompt
    let contextPrompt = '';
    if (financialContext) {
      contextPrompt = `\n[Konteks Finansial Pengguna Saat Ini]\n- Pemasukan Bulanan: Rp ${financialContext.monthlyIncome || 0}\n- Total Pemasukan Bulan Ini: Rp ${financialContext.totalIncome || 0}\n- Total Pengeluaran Bulan Ini: Rp ${financialContext.totalExpense || 0}\n- Sisa Saldo: Rp ${financialContext.balance || 0}\n- Status: ${financialContext.status || 'Controlled Spending'}\n- Kategori Terbesar: ${financialContext.topCategory || 'Belum ada'}\n`;
    }

    // Format chat history for Gemini
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }
    }

    // User query with instruction to detect transaction logging intent
    const fullUserPrompt = `${contextPrompt}\nPertanyaan/Pesan Pengguna: ${message}\n\nJika pengguna meminta mencatat transaksi (misal: "catat pengeluaran kopi 25rb" atau "tadi bayar listrik 200000"), berikan respon ramah dan sertakan blok JSON di akhir jawaban dengan format:
\`\`\`json
{
  "detected_transaction": {
    "type": "expense" | "income",
    "amount": 25000,
    "description": "Beli Kopi",
    "suggested_category": "Makanan & Minuman"
  }
}
\`\`\`
Jika bukan pencatatan transaksi, jawablah pertanyaan keuangan tersebut dengan santun dan berbobot.`;

    contents.push({
      role: 'user',
      parts: [{ text: fullUserPrompt }],
    });

    const result = await model.generateContent({ contents });
    const replyText = result.response.text();

    // Extract optional JSON block if detected
    let detectedTransaction = null;
    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.detected_transaction) {
          detectedTransaction = parsed.detected_transaction;
        }
      } catch {
        // Ignored if JSON parsing fails
      }
    }

    // Clean up reply text by removing json block for user display
    const cleanReply = replyText.replace(/```json[\s\S]*?```/g, '').trim();

    return NextResponse.json({
      reply: cleanReply,
      detectedTransaction,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses permintaan AI.' },
      { status: 500 }
    );
  }
}
