'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Send,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://money-assist2-0.vercel.app');
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ManageUr_MoneyBot';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          
          // Generate pairing code if null
          if (data && !data.pairing_code) {
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await supabase.from('profiles').update({ pairing_code: randomCode }).eq('id', user.id);
            data.pairing_code = randomCode;
          }

          setProfile(data);
        } else {
          setProfile({
            pairing_code: 'MA2026',
            telegram_id: null,
            api_token: 'demo-token-12345',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pairingCommand = `/pair ${profile?.pairing_code || 'KODE'}`;
  const telegramDirectUrl = `https://t.me/${botUsername}?start=${profile?.pairing_code || ''}`;
  const uploadEndpoint = `${origin}/api/shortcut/scan`;
  const pingEndpoint = `${origin}/api/shortcut/ping?token=${profile?.api_token || profile?.telegram_id || 'demo'}`;

  return (
    <div className="space-y-6">
      <Header
        title="Pintasan iPhone & Bot Telegram"
        subtitle="Otomatisasi pencatatan transaksi via Ketuk Belakang iPhone dan Bot Telegram AI"
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-5xl mx-auto">
        {/* 1. Telegram Bot Integration Card */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Bot Telegram MoneyAssist AI
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                    Telegram AI
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Catat transaksi via chat teks atau kirim foto struk/screenshot mutasi langsung di Telegram
                </p>
              </div>
            </div>

            {profile?.telegram_id ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                Terhubung (@{profile.telegram_username || profile.telegram_id})
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold shrink-0">
                Belum Terhubung
              </span>
            )}
          </div>

          {/* Quick Action Button & Ready-to-send message */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Box 1: Direct Link */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/20 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  1. Buka Bot Langsung (1-Klik)
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Klik tombol di bawah untuk membuka bot di aplikasi Telegram dan menghubungkan akun secara otomatis.
                </p>
              </div>

              <a
                href={telegramDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Buka & Hubungkan ke Bot Telegram</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Box 2: Ready-to-copy message */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  2. Pesan Siap Kirim (Manual Pair)
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Atau salin pesan perintah ini dan kirimkan ke bot Telegram Anda:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between font-mono text-sm text-emerald-400">
                  <span>{pairingCommand}</span>
                  <button
                    onClick={() => handleCopy(pairingCommand, 'pairing_cmd')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold transition-colors"
                  >
                    {copiedKey === 'pairing_cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick guide */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-200">Fitur yang bisa dilakukan di Bot Telegram setelah terhubung:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Ketik pesan pengeluaran bebas: <code className="text-emerald-400 font-mono">"Makan siang 25rb"</code> atau <code className="text-emerald-400 font-mono">"Bensin 50000"</code></li>
              <li>Kirim foto struk / screenshot transaksi m-Banking untuk langsung di-scan OCR oleh AI Vision.</li>
              <li>Ketik <code className="text-cyan-400 font-mono">/saldo</code> untuk cek ringkasan pengeluaran & sisa saldo bulan ini.</li>
            </ul>
          </div>
        </div>

        {/* 2. iPhone Siri & Back Tap Shortcut Card */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Pintasan iPhone (Ketuk Belakang / Back Tap)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                    iOS Shortcut
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ambil tangkapan layar m-Banking / e-wallet dan catat transaksi otomatis dengan 2x ketuk punggung iPhone
                </p>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Endpoint Upload Pintasan (POST):</span>
                <button
                  onClick={() => handleCopy(uploadEndpoint, 'upload_ep')}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-bold"
                >
                  {copiedKey === 'upload_ep' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'upload_ep' ? 'Tersalin!' : 'Salin URL'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 font-mono text-[11px] text-emerald-400 truncate">
                {uploadEndpoint}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">URL Tes Koneksi Pintasan:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(pingEndpoint, 'ping_ep')}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-bold"
                  >
                    {copiedKey === 'ping_ep' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ping_ep' ? 'Tersalin!' : 'Salin URL Tes'}</span>
                  </button>
                  <a
                    href={pingEndpoint}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 font-mono text-[11px] text-cyan-400 truncate">
                {pingEndpoint}
              </div>
            </div>
          </div>

          {/* Setup Steps Guide */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Panduan 5 Langkah Pembuatan Pintasan di iPhone:
            </h4>
            <div className="space-y-2 text-xs">
              {[
                'Buka aplikasi Pintasan (Shortcuts) di iPhone, ketuk tombol +, lalu beri nama "Scan MoneyAssist".',
                'Ketuk Tambah Tindakan, cari dan pilih tindakan "Ambil Tangkapan Layar" (Take Screenshot).',
                'Cari tindakan "Dapatkan Isi URL" (Get Contents of URL), lalu tempel URL Endpoint Upload di atas.',
                'Buka Tampilkan Lebih Banyak (Show More) di tindakan Dapatkan Isi URL. Pilih Method: POST, Request Body: Form.',
                'Tambah field File dengan nama "photo" dan isi dengan hasil Tangkapan Layar. Tambah juga field Teks "token" dan isi token akun Anda.',
                'Buka Pengaturan iPhone > Aksesibilitas > Sentuh > Ketuk Bagian Belakang (Back Tap) > Ketuk Dua Kali > pilih "Scan MoneyAssist". Selesai!'
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
