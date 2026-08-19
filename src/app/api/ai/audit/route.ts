import { NextRequest, NextResponse } from 'next/server';
import { generateFinancialAudit } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { income, expense, topCategories } = await req.json();

    const result = await generateFinancialAudit({
      income: Number(income) || 0,
      expense: Number(expense) || 0,
      topCategories: topCategories || [],
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Audit API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghasilkan audit finansial.' },
      { status: 500 }
    );
  }
}
