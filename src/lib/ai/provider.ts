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

export type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'none';

/**
 * Sanitizes API keys in case user pasted the variable name or quotes in Vercel
 */
export function cleanApiKey(key?: string): string | undefined {
  if (!key) return undefined;
  const cleaned = key
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^[A-Za-z0-9_]+=\s*/, '')
    .trim();
  return cleaned.length > 5 ? cleaned : undefined;
}

/**
 * Detect available active AI provider from environment variables
 */
export function getActiveProvider(): AIProvider {
  if (cleanApiKey(process.env.GROQ_API_KEY)) return 'groq';
  if (cleanApiKey(process.env.GEMINI_API_KEY)) return 'gemini';
  if (cleanApiKey(process.env.OPENROUTER_API_KEY)) return 'openrouter';
  return 'none';
}

/**
 * 1. UNIFIED CHAT COMPLETION (Groq / Gemini / OpenRouter)
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
  const groqKey = cleanApiKey(process.env.GROQ_API_KEY);
  const geminiKey = cleanApiKey(process.env.GEMINI_API_KEY);
  const openrouterKey = cleanApiKey(process.env.OPENROUTER_API_KEY);

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

  // 1. GROQ PROVIDER (Llama 3.3 70B - Lightning Fast)
  if (groqKey) {
    try {
      const messages = [
        { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: promptWithInstruction },
      ];

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices[0]?.message?.content || '';
        return parseTransactionFromText(replyText, '⚡ Groq (Llama 3.3 70B)');
      } else {
        const errText = await res.text();
        console.warn('Groq chat error response:', errText);
      }
    } catch (e) {
      console.warn('Groq chat failed, falling back to Gemini...', e);
    }
  }

  // 2. GEMINI PROVIDER (Gemini Flash)
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: FINANCIAL_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
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
      return parseTransactionFromText(replyText, '✨ Google Gemini Flash');
    } catch (e) {
      console.warn('Gemini chat failed...', e);
    }
  }

  // 3. OPENROUTER PROVIDER
  if (openrouterKey) {
    try {
      const messages = [
        { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: promptWithInstruction },
      ];

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://money-assist2-0.vercel.app',
          'X-Title': 'MoneyAssist 2.0',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages,
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices[0]?.message?.content || '';
        return parseTransactionFromText(replyText, '🌐 OpenRouter (Llama 3.3 Free)');
      }
    } catch (e) {
      console.warn('OpenRouter chat failed...', e);
    }
  }

  // Fallback Simulation Mode
  return {
    reply: `Halo! Saya MoneyAssist AI. Silakan pastikan GROQ_API_KEY atau GEMINI_API_KEY telah dimasukkan di Environment Variables Vercel lalu lakukan Redeploy.\n\nTips Finansial: Sisihkan minimal 20% penghasilan untuk tabungan atau dana darurat di awal bulan!`,
    provider: 'Simulasi Lokal',
  };
}

/**
 * 2. ULTRA-FAST RECEIPT OCR VISION WITH DETAILED ITEM BREAKDOWN
 */
export async function generateReceiptOCR({
  imageBase64,
  mimeType = 'image/jpeg',
}: {
  imageBase64: string;
  mimeType?: string;
}): Promise<{ extracted: any; provider: string; executionTimeMs?: number }> {
  const startTime = Date.now();
  const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const geminiKey = cleanApiKey(process.env.GEMINI_API_KEY);
  const groqKey = cleanApiKey(process.env.GROQ_API_KEY);

  const prompt = `
Analisis foto struk / invoice / nota pembayaran kasir ini secara detail, akurat, dan lengkap.
Ekstrak nama toko, total bayar, tanggal, kategori, dan RINCIAN ITEM belanja (nama produk, kuantitas/qty, harga satuan, dan total item).

Kembalikan HANYA format JSON murni tanpa pembungkus markdown, dengan struktur:
{
  "merchant": "Nama Toko / Restoran / Supermarket / Marketplace",
  "amount": 73230,
  "subtotal": 70000,
  "discount": 0,
  "tax_or_fee": 3230,
  "date": "2026-05-20",
  "category": "Makanan & Minuman | Transportasi | Belanja & Kebutuhan | Tagihan & Utilitas | Hiburan & Rekreasi | Kesehatan & Medis | Lain-lain",
  "items": [
    {
      "name": "Nama Barang / Menu",
      "qty": 2,
      "price": 35000,
      "total": 70000
    }
  ],
  "notes": "Ringkasan transaksi"
}

Peraturan Penting:
1. "amount": Total akhir yang dibayarkan (angka bulat murni tanpa titik/koma/simbol mata uang).
2. "date": Format YYYY-MM-DD. Jika tanggal struk tidak ada tahun, gunakan tahun sekarang (${new Date().getFullYear()}).
3. "items": Buat daftar item sedetail mungkin dari yang tertera di struk/invoice (isi nama produk, qty/jumlah buah/pcs, harga satuan, dan subtotal per item).
4. "category": Pilih salah satu kategori yang paling tepat.`;

  // 1. GEMINI VISION (Best in class for Multimodal OCR)
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent([
        { inlineData: { data: base64Clean, mimeType } },
        { text: prompt },
      ]);

      const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const executionTimeMs = Date.now() - startTime;
      return {
        extracted: JSON.parse(cleanJson),
        provider: `✨ Gemini Flash Vision (${executionTimeMs}ms)`,
        executionTimeMs,
      };
    } catch (e: any) {
      console.warn('Gemini vision OCR error, attempting next fallback:', e);
    }
  }

  // 2. GROQ VISION (Llama 3.2 90B or latest vision fallback)
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.2-90b-vision-preview',
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
          temperature: 0.1,
          max_tokens: 1024,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices[0]?.message?.content || '{}';
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const executionTimeMs = Date.now() - startTime;
        return {
          extracted: JSON.parse(cleanJson),
          provider: `⚡ Groq Vision (${executionTimeMs}ms)`,
          executionTimeMs,
        };
      }
    } catch (e) {
      console.warn('Groq vision OCR error:', e);
    }
  }

  // Fallback Mock OCR with rich items breakdown
  const executionTimeMs = Date.now() - startTime;
  return {
    extracted: {
      merchant: 'SH-Fitness Store',
      amount: 73230,
      subtotal: 70000,
      discount: 0,
      tax_or_fee: 3230,
      date: new Date().toISOString().split('T')[0],
      category: 'Belanja & Kebutuhan',
      items: [
        {
          name: '(Pair) Ankle Weights 1.5kg Legging Weights',
          qty: 2,
          price: 26600,
          total: 53200,
        },
        {
          name: 'Biaya Pengiriman / Shipping',
          qty: 1,
          price: 20030,
          total: 20030,
        },
      ],
      notes: 'Ekstraksi struk belanja selesai. Masukkan GEMINI_API_KEY untuk live OCR akurat.',
    },
    provider: `Simulasi OCR (${executionTimeMs}ms)`,
    executionTimeMs,
  };
}

/**
 * 3. FAST FINANCIAL HEALTH AUDIT
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

  const groqKey = cleanApiKey(process.env.GROQ_API_KEY);
  const geminiKey = cleanApiKey(process.env.GEMINI_API_KEY);

  // 1. GROQ AUDIT
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const cleanJson = (data.choices[0]?.message?.content || '')
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        return JSON.parse(cleanJson);
      }
    } catch (e) {
      console.warn('Groq audit failed, falling back to Gemini...', e);
    }
  }

  // 2. GEMINI AUDIT
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });
      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Gemini audit failed...', e);
    }
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
