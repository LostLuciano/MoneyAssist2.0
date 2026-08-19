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
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://moneyassist.vercel.app';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setProfile(data);
        } else {
          setProfile({
            pairing_code: 'DEMO20',
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

  const uploadEndpoint = `${origin}/api/shortcut/scan`;
  const pingEndpoint = `${origin}/api/shortcut/ping?token=${profile?.api_token || profile?.telegram_id || 'demo'}`;

  return (
    <div className="space-y-6">
      <Header
        title="Pintasan iPhone & Bot Telegram"
        subtitle="Otomatisasi pencatatan transaksi via Ketuk Belakang iPhone dan Bot Telegram AI"
      />

      <div className="px-6 space-y-6 max-w-5xl mx-auto">
        {/* 1. Telegram Bot Integration Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
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
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Terhubung (@{profile.telegram_username || profile.telegram_id})
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                Belum Terhubung
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Pairing Code */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Kode Pairing Anda
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
                  {profile?.pairing_code || '------'}
                </span>
                <button
                  onClick={() => handleCopy(`/pair ${profile?.pairing_code}`, 'pair_cmd')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Salin Perintah Pair"
                >
                  {copiedKey === 'pair_cmd' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Instruction */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white block">Cara Menghubungkan:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Buka bot Telegram Anda di aplikasi Telegram.</li>
                <li>
                  Ketik perintah:{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono font-bold">
                    /pair {profile?.pairing_code || 'KODE'}
                  </code>
                </li>
                <li>Setelah terhubung, bot akan otomatis mencatat setiap pesan atau foto yang Anda kirim!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 2. iPhone Siri & Back Tap Shortcut Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
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
                    className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold"
                  >
                    Buka
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
