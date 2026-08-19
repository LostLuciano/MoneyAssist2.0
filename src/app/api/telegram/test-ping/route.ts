import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function cleanBotToken(token?: string) {
  if (!token) return undefined;
  return token.trim().replace(/^["']|["']$/g, '').replace(/^TELEGRAM_BOT_TOKEN=\s*/, '').trim();
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnwqifnkgrlvpklapfkx.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const botToken = cleanBotToken(process.env.TELEGRAM_BOT_TOKEN);

  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN belum dikonfigurasi.' }, { status: 500 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (!profile || !profile.telegram_id) {
      return NextResponse.json({ error: 'Akun Telegram belum terhubung.' }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: profile.telegram_id,
        text:
          `<b>Tes Verifikasi Sambungan Berhasil</b>\n\n` +
          `Halo <b>${profile.full_name || 'Pengguna'}</b>,\n` +
          `Bot MoneyAssist 2.0 Anda sudah terhubung 100% dan aktif menerima pencatatan transaksi via teks dan foto struk belanja.\n\n` +
          `<i>Waktu Verifikasi: ${new Date().toLocaleString('id-ID')}</i>`,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json({ error: errData.description || 'Gagal mengirim pesan ke Telegram.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pesan tes verifikasi berhasil dikirim ke Telegram!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
