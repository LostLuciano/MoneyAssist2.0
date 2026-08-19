import { NextRequest, NextResponse } from 'next/server';
import { generateAIChat } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], financialContext, selectedModelId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const result = await generateAIChat({ message, history, financialContext, selectedModelId });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses permintaan AI.' },
      { status: 500 }
    );
  }
}
