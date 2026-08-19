import { NextRequest, NextResponse } from 'next/server';
import { getGeminiVisionModel } from '@/lib/gemini/client';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { imageBase64, mimeType = 'image/jpeg' } = data;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Data gambar (base64) wajib disertakan.' },
        { status: 400 }
      );
    }

    const model = getGeminiVisionModel();

    if (!model) {
      // Mock OCR response when Gemini API key is not yet set
      return NextResponse.json({
        success: true,
        isMock: true,
        extracted: {
          merchant: 'Indomaret Point (Simulasi)',
          amount: 47500,
          date: new Date().toISOString().split('T')[0],
          category: 'Makanan & Minuman',
          items: ['Roti Tawar - Rp 18.000', 'Susu UHT 1L - Rp 21.500', 'Air Mineral - Rp 8.000'],
          notes: 'OCR Simulasi: Set GEMINI_API_KEY di file .env.local untuk live scanning dengan AI Gemini Vision.',
        },
      });
    }

    // Strip base64 prefix if present (e.g. data:image/jpeg;base64,...)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

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

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text().trim();

    // Parse JSON
    let parsedData = null;
    try {
      const cleanJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      parsedData = JSON.parse(cleanJson);
    } catch {
      console.warn('Failed to parse Gemini OCR response as JSON directly:', responseText);
      parsedData = {
        merchant: 'Struk / Nota Terdeteksi',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Belanja & Kebutuhan',
        items: [],
        notes: responseText,
      };
    }

    return NextResponse.json({
      success: true,
      extracted: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini OCR API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses OCR gambar struk.' },
      { status: 500 }
    );
  }
}
