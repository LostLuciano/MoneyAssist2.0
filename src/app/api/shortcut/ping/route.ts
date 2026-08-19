import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnwqifnkgrlvpklapfkx.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || searchParams.get('telegram_id');

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.replace(/^TELEGRAM_BOT_TOKEN=/, '').trim();

  if (token && botToken) {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .or(`api_token.eq.${token},telegram_id.eq.${token}`)
      .single();

    if (profile && profile.telegram_id) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: profile.telegram_id,
            text: `🔔 <b>Tes Koneksi Pintasan iPhone Berhasil!</b>\n\nEndpoint MoneyAssist 2.0 siap menerima screenshot transaksi dari Back Tap iPhone Anda.`,
            parse_mode: 'HTML',
          }),
        });
      } catch (err) {
        console.error('Ping Telegram notification failed:', err);
      }
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'MoneyAssist 2.0 iPhone Shortcut Endpoint is Active and Ready.',
    timestamp: new Date().toISOString(),
  });
}
