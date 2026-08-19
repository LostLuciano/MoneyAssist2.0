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

export interface AIModelOption {
  id: string;
  name: string;
  provider: 'groq' | 'gemini' | 'openrouter';
  modelId: string;
  badge: string;
  description: string;
}

export const AVAILABLE_AI_MODELS: AIModelOption[] = [
  {
    id: 'groq-llama-3.3',
    name: 'Groq Llama 3.3 70B',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    badge: '⚡ Ultra Cepat',
    description: 'Respon super instan & hemat latency',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Google Gemini 1.5 Flash',
    provider: 'gemini',
    modelId: 'gemini-1.5-flash',
    badge: '✨ Multimodal',
    description: 'Akurat, pintar, & responsif',
  },
  {
    id: 'openrouter-gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    provider: 'openrouter',
    modelId: 'openai/gpt-4o-mini',
    badge: '🌟 Rekomendasi',
    description: 'Analisis cerdas & presisi kategori',
  },
  {
    id: 'openrouter-deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-chat',
    badge: '🧠 Penalaran',
    description: 'Logika matematika & perhitungan akurat',
  },
  {
    id: 'openrouter-deepseek-r1',
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-r1',
    badge: '🔬 Deep Thinking',
    description: 'Penalaran finansial tingkat lanjut',
  },
  {
    id: 'openrouter-gpt-4o',
    name: 'OpenAI GPT-4o Flagship',
    provider: 'openrouter',
    modelId: 'openai/gpt-4o',
    badge: '💎 Flagship',
    description: 'Model tercanggih dengan reasoning tertinggi',
  },
  {
    id: 'openrouter-llama-3.3-free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    badge: '🆓 Gratis',
    description: 'Open-source 70B gratis di OpenRouter',
  },
];

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
 * 1. UNIFIED CHAT COMPLETION (Groq / Gemini / OpenRouter with Multi-Model Support)
 */
export async function generateAIChat({
  message,
  history = [],
  financialContext,
  selectedModelId,
}: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  financialContext?: any;
  selectedModelId?: string;
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

  const selectedModel = AVAILABLE_AI_MODELS.find((m) => m.id === selectedModelId);

  // -------------------------------------------------------------
  // 1. DIRECT ROUTING IF USER CHOSE A SPECIFIC OPENROUTER MODEL
  // -------------------------------------------------------------
  if (selectedModel?.provider === 'openrouter' && openrouterKey) {
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
          model: selectedModel.modelId,
          messages,
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices[0]?.message?.content || '';
        return parseTransactionFromText(replyText, selectedModel.name);
      }
    } catch (e) {
      console.warn(`OpenRouter (${selectedModel.name}) failed, attempting fallbacks:`, e);
    }
  }

  // -------------------------------------------------------------
  // 2. DIRECT ROUTING IF USER CHOSE GEMINI
  // -------------------------------------------------------------
  if (selectedModel?.provider === 'gemini' && geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: selectedModel.modelId,
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
      return parseTransactionFromText(replyText, selectedModel.name);
    } catch (e) {
      console.warn('Gemini chat failed, attempting fallbacks...', e);
    }
  }

  // -------------------------------------------------------------
  // 3. GROQ PROVIDER (Llama 3.3 70B - Default Primary Fast Engine)
  // -------------------------------------------------------------
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
        return parseTransactionFromText(replyText, 'Groq Llama 3.3');
      }
    } catch (e) {
      console.warn('Groq chat failed, falling back to Gemini...', e);
    }
  }

  // -------------------------------------------------------------
  // 4. GEMINI PROVIDER (Gemini 1.5 Flash Fallback)
  // -------------------------------------------------------------
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
      return parseTransactionFromText(replyText, 'Google Gemini Flash');
    } catch (e) {
      console.warn('Gemini chat failed, falling back to OpenRouter...', e);
    }
  }

  // -------------------------------------------------------------
  // 5. OPENROUTER MULTI-MODEL FALLBACK
  // -------------------------------------------------------------
  if (openrouterKey) {
    try {
      const messages = [
        { role: 'system', content: FINANCIAL_SYSTEM_PROMPT },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: promptWithInstruction },
      ];

      const modelIdToUse = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://money-assist2-0.vercel.app',
          'X-Title': 'MoneyAssist 2.0',
        },
        body: JSON.stringify({
          model: modelIdToUse,
          messages,
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices[0]?.message?.content || '';
        return parseTransactionFromText(replyText, `OpenRouter (${modelIdToUse})`);
      }
    } catch (e) {
      console.warn('OpenRouter chat fallback failed...', e);
    }
  }

  throw new Error('Layanan AI tidak dapat diakses. Pastikan GROQ_API_KEY, GEMINI_API_KEY, atau OPENROUTER_API_KEY terkonfigurasi dengan benar di environment variables.');
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
Kamu adalah MoneyAssist Vision OCR Engine. Analisis gambar bukti transaksi ini secara teliti dan akurat.
Gambar dapat berupa:
- Screenshot Marketplace / E-commerce (TikTok Shop, Shopee, Tokopedia, detail pesanan, invoice)
- Screenshot m-Banking / E-Wallet (BCA, Mandiri, GoPay, OVO, DANA, ShopeePay)
- Struk Kasir / Bon Belanja / Nota SPBU / Restoran

Tentukan apakah ini PENGELUARAN (expense) atau PEMASUKAN (income).
Ekstrak data dalam format JSON murni:
{
  "merchant": "Nama Toko / Penjual / Merchant / Marketplace",
  "amount": 45228,
  "subtotal": 41990,
  "discount": 7000,
  "tax_or_fee": 3500,
  "date": "${new Date().toISOString().split('T')[0]}",
  "category": "Makanan & Minuman | Transportasi | Belanja & Kebutuhan | Tagihan & Utilitas | Hiburan & Rekreasi | Kesehatan & Medis | Lain-lain",
  "items": [
    {
      "name": "Nama Produk / Barang",
      "qty": 1,
      "price": 21390,
      "total": 21390
    }
  ],
  "notes": "Ringkasan transaksi"
}

Aturan Khusus:
1. "amount": Cari nominal akhir transaksi (contoh pada label: Total, Total Pembayaran, Total Pesanan, Grand Total, Rp 45.228 -> 45228). Nilai WAJIB angka numerik murni tanpa titik/koma/simbol mata uang.
2. "merchant": Nama toko atau brand (contoh: KAHF, Indomaret, Shopee, TikTok Shop).
3. "items": Buat rincian item produk yang dibeli jika tertera di gambar.
4. Kembalikan HANYA JSON murni tanpa markdown, tanpa teks pembuka/penutup.`;

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
        provider: `Gemini Flash Vision (${executionTimeMs}ms)`,
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
          provider: `Groq Vision (${executionTimeMs}ms)`,
          executionTimeMs,
        };
      }
    } catch (e) {
      console.warn('Groq vision OCR error:', e);
    }
  }

  throw new Error('Gagal memproses gambar struk via AI Vision. Pastikan GEMINI_API_KEY telah dimasukkan dengan benar.');
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

  // Pure mathematical calculation without hardcoded mock
  return {
    status,
    ratio: Math.round(ratio),
    score: ratio > 100 ? 30 : ratio > 70 ? 65 : 90,
    summary: `Rasio pengeluaran Anda saat ini sebesar ${ratio.toFixed(0)}% dari total pemasukan.`,
    recommendations: [
      'Terapkan formula anggaran 50/30/20 (50% Kebutuhan Pokok, 30% Keinginan, 20% Tabungan/Investasi).',
      'Catat transaksi harian secara konsisten melalui fitur Scan Struk atau Chat AI.',
      'Pertahankan alokasi dana darurat minimal 3 hingga 6 kali pengeluaran bulanan.',
    ],
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
