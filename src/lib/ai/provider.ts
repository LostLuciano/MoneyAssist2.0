import { GoogleGenerativeAI } from '@google/generative-ai';

export const FINANCIAL_SYSTEM_PROMPT = `
Kamu adalah "MoneyAssist AI", asisten perencanaan dan audit keuangan pribadi yang cerdas, ramah, profesional, dan berbahasa Indonesia.
Tugas utamamu adalah:
1. Membantu pengguna mengelola uang dengan bijak, meninjau pengeluaran vs pemasukan, serta memberi rekomendasi yang realistis.
2. Membantu mencatat transaksi dari bahasa natural percakapan jika diminta (contoh: "kemarin beli bensin 50rb").
3. Menganalisis kondisi keuangan ke dalam 3 status utama:
   - "Controlled Spending": Pengeluaran terkendali (rasio <= 70% dari pemasukan).
   - "Elevated Spending": Pengeluaran mulai tinggi dan butuh penyesuaian (rasio 71% - 100%).
   - "Critical Status": Pengeluaran melebihi pemasukan (defisit > 100%).
4. Memberikan tips hemat, evaluasi target tabungan (*savings goals*), dan alokasi anggaran (50/30/20 rule).

Gaya Komunikasi:
- Bahasa Indonesia yang santun, suportif, kasual-profesional.
- Gunakan pemformatan Rupiah (contoh: Rp 50.000).
- Berikan poin-poin yang mudah dibaca dan actionable.
`;

export type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'auto';

/**
 * Detect available active AI provider from environment variables
 */
export function getActiveProvider(): 'gemini' | 'groq' | 'openrouter' | 'none' {
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  return 'none';
}

/**
 * 1. UNIFIED CHAT COMPLETION (Gemini / Groq / OpenRouter)
 */
export async function generateAIChat({
  message,
  history = [],
  financialContext,
}: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  financialContext?: any;
}): Promise<{ reply: string; detectedTransaction?: any; provider: string }> {
  const provider = getActiveProvider();

  // Context prompt
  let contextPrompt = '';
  if (financialContext) {
    contextPrompt = `\n[Konteks Finansial Pengguna Saat Ini]\n- Pemasukan Bulanan: Rp ${financialContext.monthlyIncome || 0}\n- Total Pemasukan Bulan Ini: Rp ${financialContext.totalIncome || 0}\n- Total Pengeluaran Bulan Ini: Rp ${financialContext.totalExpense || 0}\n- Sisa Saldo: Rp ${financialContext.balance || 0}\n- Status: ${financialContext.status || 'Controlled Spending'}\n- Kategori Terbesar: ${financialContext.topCategory || 'Belum ada'}\n`;
  }

  const promptWithInstruction = `${contextPrompt}\nPertanyaan/Pesan Pengguna: ${message}\n\nJika pengguna meminta mencatat transaksi (misal: "catat pengeluaran kopi 25rb" atau "tadi bayar listrik 200000"), berikan respon ramah dan sertakan blok JSON di akhir jawaban dengan format:
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

  // 1. GROQ PROVIDER (Llama 3.3 70B)
  if (provider === 'groq') {
    const messages = [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: promptWithInstruction },
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API Error: ${err}`);
    }

    const data = await res.json();
    const replyText = data.choices[0]?.message?.content || '';
    return parseTransactionFromText(replyText, 'Groq (Llama 3.3 70B)');
  }

  // 2. OPENROUTER PROVIDER (DeepSeek R1 / Llama 3.3 Free)
  if (provider === 'openrouter') {
    const messages = [
      { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: promptWithInstruction },
    ];

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'MoneyAssist 2.0',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter API Error: ${err}`);
    }

    const data = await res.json();
    const replyText = data.choices[0]?.message?.content || '';
    return parseTransactionFromText(replyText, 'OpenRouter (Llama 3.3 Free)');
  }

  // 3. GEMINI PROVIDER
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: FINANCIAL_SYSTEM_PROMPT,
    });

    const contents: any[] = [];
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: promptWithInstruction }],
    });

    const result = await model.generateContent({ contents });
    const replyText = result.response.text();
    return parseTransactionFromText(replyText, 'Google Gemini 1.5 Flash');
  }

  // Fallback Simulation Mode
  return {
    reply: `Halo! Saya MoneyAssist AI. Silakan masukkan GEMINI_API_KEY, GROQ_API_KEY, atau OPENROUTER_API_KEY di file .env.local untuk mengaktifkan AI secara langsung.\n\nTips Finansial: Usahakan menyisihkan minimal 20% penghasilan untuk tabungan atau dana darurat di awal bulan!`,
    provider: 'Simulasi Lokal',
  };
}

/**
 * 2. UNIFIED RECEIPT OCR VISION (Gemini Vision / Groq Vision)
 */
export async function generateReceiptOCR({
  imageBase64,
  mimeType = 'image/jpeg',
}: {
  imageBase64: string;
  mimeType?: string;
}): Promise<{ extracted: any; provider: string }> {
  const provider = getActiveProvider();
  const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `
Analisis gambar struk / nota pembayaran ini secara detail.
Ekstrak informasi berikut dan berikan HANYA format JSON murni tanpa markdown, tanpa teks pembuka atau penutup:
{
  "merchant": "Nama Toko / Tempat Usaha",
  "amount": 125000,
  "date": "2026-05-20",
  "category": "Makanan & Minuman | Transportasi | Belanja & Kebutuhan | Tagihan & Utilitas | Hiburan & Rekreasi | Kesehatan & Medis | Lain-lain",
  "items": ["Item 1 (Qty x Harga)", "Item 2"],
  "notes": "Ringkasan singkat struk"
}

Peraturan:
1. "amount" harus berupa angka numerik murni (misal: jika total Rp 54.000, tulis 54000).
2. "date" harus berformat YYYY-MM-DD. Jika tahun tidak tertera jelas, gunakan tahun sekarang (${new Date().getFullYear()}).
3. "category" pilih salah satu kategori yang paling relevan.
`;

  // 1. GEMINI VISION
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { inlineData: { data: base64Clean, mimeType } },
      { text: prompt },
    ]);
    const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return { extracted: JSON.parse(cleanJson), provider: 'Gemini Vision' };
  }

  // 2. GROQ VISION (Llama 3.2 11B Vision)
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Clean}` },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq Vision Error: ${err}`);
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content || '{}';
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return { extracted: JSON.parse(cleanJson), provider: 'Groq Vision (Llama 3.2)' };
  }

  // Fallback Mock OCR
  return {
    extracted: {
      merchant: 'Indomaret Point (Simulasi)',
      amount: 52000,
      date: new Date().toISOString().split('T')[0],
      category: 'Makanan & Minuman',
      items: ['Roti Gandum - Rp 22.000', 'Susu UHT 1L - Rp 21.000', 'Air Mineral 600ml - Rp 9.000'],
      notes: 'Mode Simulasi: Masukkan GEMINI_API_KEY atau GROQ_API_KEY di .env.local untuk live scanning.',
    },
    provider: 'Simulasi OCR',
  };
}

/**
 * 3. UNIFIED FINANCIAL HEALTH AUDIT
 */
export async function generateFinancialAudit({
  income,
  expense,
  topCategories = [],
}: {
  income: number;
  expense: number;
  topCategories?: string[];
}): Promise<any> {
  const provider = getActiveProvider();
  const ratio = income > 0 ? (expense / income) * 100 : 100;
  let status: 'Controlled Spending' | 'Elevated Spending' | 'Critical Status' = 'Controlled Spending';

  if (ratio > 100) status = 'Critical Status';
  else if (ratio > 70) status = 'Elevated Spending';

  const prompt = `
Lakukan Audit Finansial Cepat untuk data berikut:
- Pemasukan Bulanan: Rp ${income}
- Pengeluaran Bulanan: Rp ${expense}
- Rasio Pengeluaran vs Pemasukan: ${ratio.toFixed(1)}%
- Kategori Pengeluaran Terbesar: ${topCategories.join(', ') || 'Belum terspesifikasi'}

Berikan hasil dalam format JSON murni tanpa markdown dengan schema:
{
  "status": "Controlled Spending" | "Elevated Spending" | "Critical Status",
  "score": 85,
  "summary": "Penjelasan singkat kondisi keuangan 2 kalimat.",
  "recommendations": [
    "Rekomendasi taktis 1",
    "Rekomendasi taktis 2",
    "Rekomendasi taktis 3"
  ]
}
`;

  // 1. GROQ AUDIT
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    const cleanJson = (data.choices[0]?.message?.content || '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanJson);
  }

  // 2. GEMINI AUDIT
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }

  // Fallback
  return {
    status,
    ratio: Math.round(ratio),
    score: ratio > 100 ? 30 : ratio > 70 ? 65 : 90,
    summary: `Rasio pengeluaranmu sebesar ${ratio.toFixed(0)}% dari pemasukan (${status}).`,
    recommendations: [
      'Terapkan formula anggaran 50/30/20 (50% Kebutuhan, 30% Keinginan, 20% Tabungan/Investasi).',
      'Catat setiap transaksi harian secara konsisten melalui fitur Scan Struk atau Chat AI.',
      'Bangun dana darurat minimal setara 3 sampai 6 kali pengeluaran bulanan.',
    ],
    isMock: true,
  };
}

function parseTransactionFromText(replyText: string, providerName: string) {
  let detectedTransaction = null;
  const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.detected_transaction) {
        detectedTransaction = parsed.detected_transaction;
      }
    } catch {
      // ignore
    }
  }
  const cleanReply = replyText.replace(/```json[\s\S]*?```/g, '').trim();
  return {
    reply: cleanReply,
    detectedTransaction,
    provider: providerName,
  };
}
