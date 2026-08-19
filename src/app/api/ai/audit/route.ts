import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini/client';

export async function POST(req: NextRequest) {
  try {
    const { income = 0, expense = 0, topCategories = [], savingsRate = 0 } = await req.json();

    const numericIncome = Number(income) || 0;
    const numericExpense = Number(expense) || 0;

    let status: 'Controlled Spending' | 'Elevated Spending' | 'Critical Status' = 'Controlled Spending';
    const ratio = numericIncome > 0 ? (numericExpense / numericIncome) * 100 : 100;

    if (ratio > 100) {
      status = 'Critical Status';
    } else if (ratio > 70) {
      status = 'Elevated Spending';
    } else {
      status = 'Controlled Spending';
    }

    const model = getGeminiModel();

    if (!model) {
      return NextResponse.json({
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
      });
    }

    const prompt = `
Lakukan Audit Finansial Cepat untuk data berikut:
- Pemasukan Bulanan: Rp ${numericIncome}
- Pengeluaran Bulanan: Rp ${numericExpense}
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

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        status,
        score: ratio > 100 ? 35 : ratio > 70 ? 68 : 88,
        summary: text,
        recommendations: [
          'Evaluasi pengeluaran non-esensial secara berkala.',
          'Gunakan MoneyAssist 2.0 untuk melacak setiap rupiah pengeluaran.',
          'Sisihkan tabungan di awal bulan begitu gaji diterima.',
        ],
      });
    }
  } catch (error: any) {
    console.error('Gemini Audit API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menjalankan audit AI.' },
      { status: 500 }
    );
  }
}
