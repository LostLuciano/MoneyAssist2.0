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
  RefreshCw,
  Edit2,
  Save,
  Unlink,
  Loader2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom Pairing Code State
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://money-assist2-0.vercel.app');
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ManageUr_MoneyBot';

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        // Generate default pairing code if null
        if (data && !data.pairing_code) {
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          await supabase.from('profiles').update({ pairing_code: randomCode }).eq('id', user.id);
          data.pairing_code = randomCode;
        }

        setProfile(data);
        setCustomCodeInput(data?.pairing_code || '');
      } else {
        setProfile({
          pairing_code: 'MA2026',
          telegram_id: null,
          api_token: 'demo-token-12345',
        });
        setCustomCodeInput('MA2026');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateRandomCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCustomCodeInput(randomCode);
  };

  const handleSaveCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = customCodeInput.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setStatusMsg({ type: 'error', text: 'Kode pairing minimal 3 karakter.' });
      return;
    }

    setSavingCode(true);
    setStatusMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ pairing_code: cleanCode })
          .eq('id', user.id);

        if (error) throw error;
      }

      setProfile((prev: any) => ({ ...prev, pairing_code: cleanCode }));
      setIsEditingCode(false);
      setStatusMsg({ type: 'success', text: `Kode pairing berhasil diubah menjadi: ${cleanCode}` });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Gagal mengubah kode: ' + err.message });
    } finally {
      setSavingCode(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm('Putuskan sambungan akun Telegram ini?')) return;
    setUnlinking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ telegram_id: null, telegram_username: null })
          .eq('id', user.id);
      }
      setProfile((prev: any) => ({ ...prev, telegram_id: null, telegram_username: null }));
      setStatusMsg({ type: 'success', text: 'Sambungan Telegram berhasil diputuskan.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert('Gagal memutuskan sambungan: ' + err.message);
    } finally {
      setUnlinking(false);
    }
  };

  const activePairingCode = profile?.pairing_code || customCodeInput || 'DEMO20';
  const telegramDirectUrl = `https://t.me/${botUsername}?start=${activePairingCode}`;
  const uploadEndpoint = `${origin}/api/shortcut/scan`;
  const pingEndpoint = `${origin}/api/shortcut/ping?token=${profile?.api_token || profile?.telegram_id || 'demo'}`;

  return (
    <div className="space-y-6">
      <Header
        title="Pintasan iPhone & Bot Telegram"
        subtitle="Otomatisasi pencatatan transaksi via Ketuk Belakang iPhone dan Bot Telegram AI"
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-5xl mx-auto">
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

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
                    @{botUsername}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Catat transaksi via chat teks atau kirim foto struk/screenshot mutasi langsung di Telegram
                </p>
              </div>
            </div>

            {profile?.telegram_id ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  Terhubung (@{profile.telegram_username || profile.telegram_id})
                </span>
                <button
                  onClick={handleUnlinkTelegram}
                  disabled={unlinking}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors"
                  title="Putuskan Sambungan"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold shrink-0">
                Belum Terhubung
              </span>
            )}
          </div>

          {/* Pairing Code Customizer & Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kode Pairing Akun Anda
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Anda bisa mengubah kode ini sesuai keinginan (bebas gonta-ganti kode).
                </p>
              </div>

              {!isEditingCode ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-400 tracking-widest px-4 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 shadow-inner">
                    {activePairingCode}
                  </span>
                  <button
                    onClick={() => handleCopy(activePairingCode, 'plain_code')}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/5"
                    title="Salin Kode"
                  >
                    {copiedKey === 'plain_code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setCustomCodeInput(activePairingCode);
                      setIsEditingCode(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-white/5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ganti Kode</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveCustomCode} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                    placeholder="KODE BARU..."
                    className="px-3.5 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-400 font-mono font-bold text-sm tracking-wider focus:outline-none w-36 uppercase"
                    maxLength={12}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Buat Kode Acak"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={savingCode}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                  >
                    {savingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCode(false)}
                    className="px-2.5 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 2 Ways to Connect: 1-Click Link & Direct Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Way 1: 1-Click Link */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/20 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Cara 1: Buka Bot Langsung (1-Klik)
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Klik tombol di bawah untuk membuka Telegram dan langsung menghubungkan akun secara otomatis.
                </p>
              </div>

              <a
                href={telegramDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Buka Bot @{botUsername}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Way 2: Direct Text Message */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Cara 2: Ketik Langsung Kodenya di Chat
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Buka bot di Telegram, lalu <strong>cukup ketik kodenya saja</strong> (tidak perlu pakai tanda <code>/</code>):
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between font-mono text-sm text-emerald-400">
                <span>{activePairingCode}</span>
                <button
                  onClick={() => handleCopy(activePairingCode, 'code_only')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold transition-colors"
                >
                  {copiedKey === 'code_only' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
