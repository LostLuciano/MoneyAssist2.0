import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptOCR } from '@/lib/ai/provider';

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

    const result = await generateReceiptOCR({ imageBase64, mimeType });
    return NextResponse.json({
      success: true,
      extracted: result.extracted,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses OCR gambar struk.' },
      { status: 500 }
    );
  }
}
