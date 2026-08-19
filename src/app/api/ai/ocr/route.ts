import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptOCR } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Gambar struk (imageBase64) diperlukan.' },
        { status: 400 }
      );
    }

    const result = await generateReceiptOCR({ imageBase64, mimeType });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses struk dengan OCR.' },
      { status: 500 }
    );
  }
}
