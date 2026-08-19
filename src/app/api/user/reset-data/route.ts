import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const tables = [
      'ai_messages',
      'ai_conversations',
      'transactions',
      'budgets',
      'savings_goals',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', user.id);
      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Semua data transaksi, anggaran, target tabungan, dan riwayat AI berhasil dibersihkan.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus data akun.' },
      { status: 500 }
    );
  }
}
