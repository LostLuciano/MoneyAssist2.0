import { NextRequest, NextResponse } from 'next/server';
import { generateFinancialAudit } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const { income = 0, expense = 0, topCategories = [] } = await req.json();

    const numericIncome = Number(income) || 0;
    const numericExpense = Number(expense) || 0;

    const result = await generateFinancialAudit({
      income: numericIncome,
      expense: numericExpense,
      topCategories,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Audit API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menjalankan audit AI.' },
      { status: 500 }
    );
  }
}
