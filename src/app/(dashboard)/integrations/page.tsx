'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Unlink,
  Loader2,
  Radio,
  BellRing,
  Trash2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [unlinking, setUnlinking] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resettingData, setResettingData] = useState(false);
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
          const randomCode = 'MA' + Math.random().toString(36).substring(2, 6).toUpperCase();
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
      // Profile fetching is intentionally silent; the cards render from the latest profile state.
    }
  };

  useEffect(() => {
    fetchProfile();

    // 1. Live Realtime Listener for instant verification update
    const channel = supabase
      .channel('profile-pairing-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new);
            if (payload.new.telegram_id && !profile?.telegram_id) {
              setStatusMsg({
                type: 'success',
                text: `Akun Telegram berhasil terhubung: @${payload.new.telegram_username || payload.new.telegram_id}`,
              });
            }
          }
        }
      )
      .subscribe();

    // 2. Polling Fallback every 3 seconds if not yet connected
    const interval = setInterval(() => {
      if (!profile?.telegram_id) {
        fetchProfile();
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [profile?.telegram_id]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendTestPing = async () => {
    if (!profile?.id) return;
    setTestingPing(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/telegram/test-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim pesan.');

      setStatusMsg({ type: 'success', text: 'Pesan tes verifikasi berhasil dikirim ke bot Telegram Anda!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Gagal mengirim tes: ' + err.message });
    } finally {
      setTestingPing(false);
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

  const handleResetAllData = async () => {
    if (resetConfirm.trim().toUpperCase() !== 'HAPUS DATA') return;
    setResettingData(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/user/reset-data', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data.');

      setResetConfirm('');
      setStatusMsg({ type: 'success', text: data.message || 'Data berhasil dibersihkan.' });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal menghapus data.' });
    } finally {
      setResettingData(false);
    }
  };

  const isConnected = !!profile?.telegram_id;
  const activePairingCode = profile?.pairing_code || 'MEMUAT';
  const shortcutToken = profile?.api_token || profile?.telegram_id || '';
  const telegramDirectUrl = `https://t.me/${botUsername}?start=${activePairingCode}`;
  const uploadEndpoint = `${origin}/api/shortcut/scan?token=${encodeURIComponent(shortcutToken)}`;
  const pingEndpoint = `${origin}/api/shortcut/ping?token=${encodeURIComponent(shortcutToken)}`;

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

            {isConnected ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  Terhubung (@{profile.telegram_username || profile.telegram_id})
                </span>
                <button
                  onClick={handleSendTestPing}
                  disabled={testingPing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition-colors"
                  title="Tes Kirim Pesan ke Bot"
                >
                  {testingPing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                  <span>Tes Pesan</span>
                </button>
                <button
                  onClick={handleUnlinkTelegram}
                  disabled={unlinking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 text-xs font-semibold transition-colors"
                  title="Putuskan Sambungan"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold shrink-0 animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  Menunggu Pairing...
                </span>
                <button
                  onClick={fetchProfile}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Cek Status Sekarang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Connected Verified Banner OR Pairing Code Customizer */}
          {isConnected ? (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold">Akun Terhubung & Sinkronisasi Real-Time Aktif</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bot Telegram <strong>@{botUsername}</strong> telah terhubung dengan akun <strong>{profile?.full_name || profile?.email}</strong>. Setiap pesan teks atau foto struk yang Anda kirim ke bot akan langsung otomatis tercatat ke riwayat finansial Anda.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 hover:opacity-90 shadow-md shadow-emerald-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Buka Chat Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Kode Pairing Akun
                    </span>
                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      Otomatis oleh sistem
                    </span>
                    <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      Tidak bisa diubah manual
                    </span>
                  </div>
                  <p className="max-w-xl text-xs leading-relaxed text-slate-300">
                    Kode ini dibuat otomatis supaya akun web, bot Telegram, dan endpoint Pintasan tetap sinkron. Salin kode atau buka bot langsung untuk pairing.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 px-5 py-3 shadow-inner">
                    <span className="block font-mono text-2xl font-black tracking-[0.28em] text-emerald-400">
                      {activePairingCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(activePairingCode, 'plain_code')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                    title="Salin kode pairing"
                  >
                    {copiedKey === 'plain_code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedKey === 'plain_code' ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2 Ways to Connect: 1-Click Link & Direct Text */}
          {!isConnected && (
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
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-sans font-semibold transition-colors"
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
          )}
        </div>

        {/* 2. iPhone Siri & Back Tap Shortcut Card */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
              isConnected
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
            }`}>
              {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              <span>{isConnected ? 'Siap Dipakai' : 'Terkunci sampai Telegram terhubung'}</span>
            </span>
          </div>

          {/* Endpoints */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white">Endpoint Upload Pintasan</span>
                  <p className="mt-0.5 text-[11px] text-slate-500">POST, token otomatis di URL</p>
                </div>
                <button
                  disabled={!isConnected || !shortcutToken}
                  onClick={() => handleCopy(uploadEndpoint, 'upload_ep')}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:bg-slate-800/60 disabled:text-slate-600"
                >
                  {copiedKey === 'upload_ep' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'upload_ep' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className={`rounded-xl border p-3 font-mono text-[11px] leading-relaxed ${
                isConnected ? 'border-emerald-500/10 bg-slate-950 text-emerald-300' : 'border-white/5 bg-slate-950/70 text-slate-500'
              }`}>
                {isConnected ? uploadEndpoint : 'Hubungkan Telegram dulu agar URL Pintasan aktif.'}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white">URL Tes Koneksi</span>
                  <p className="mt-0.5 text-[11px] text-slate-500">Buka untuk kirim ping ke Telegram</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!isConnected || !shortcutToken}
                    onClick={() => handleCopy(pingEndpoint, 'ping_ep')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:bg-slate-800/60 disabled:text-slate-600"
                  >
                    {copiedKey === 'ping_ep' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ping_ep' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  {isConnected && shortcutToken && (
                    <a
                      href={pingEndpoint}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-300"
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className={`rounded-xl border p-3 font-mono text-[11px] leading-relaxed ${
                isConnected ? 'border-cyan-500/10 bg-slate-950 text-cyan-300' : 'border-white/5 bg-slate-950/70 text-slate-500'
              }`}>
                {isConnected ? pingEndpoint : 'Hubungkan Telegram dulu untuk mengaktifkan URL tes.'}
              </div>
            </div>
          </div>

          {/* Setup Steps Guide */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Panduan 6 Langkah Pembuatan Pintasan di iPhone:
            </h4>
            <div className="space-y-2 text-xs">
              {[
                'Buka aplikasi Pintasan (Shortcuts) di iPhone, ketuk tombol +, lalu beri nama "Scan MoneyAssist".',
                'Ketuk Tambah Tindakan, cari dan pilih tindakan "Ambil Tangkapan Layar" (Take Screenshot).',
                'Cari tindakan "Dapatkan Isi URL" (Get Contents of URL), lalu tempel URL Endpoint Upload di atas.',
                'Buka Tampilkan Lebih Banyak (Show More) di tindakan Dapatkan Isi URL. Pilih Method: POST, Request Body: Form.',
                'Di bagian Form, tambah field File dengan nama "photo". Isi nilainya dengan hasil dari tindakan Ambil Tangkapan Layar. Tidak perlu menambah field token karena token sudah ada di URL endpoint.',
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

        <div className="glass-panel rounded-3xl border border-rose-500/15 bg-rose-950/10 p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Mulai dari Awal</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Hapus transaksi, anggaran, target tabungan, dan riwayat AI. Akun, login, kode pairing, dan sambungan Telegram tetap aktif.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2 lg:max-w-md">
              <input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="Ketik HAPUS DATA"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs font-bold text-white outline-none transition-colors placeholder:text-slate-600 focus:border-rose-500"
              />
              <button
                onClick={handleResetAllData}
                disabled={resetConfirm.trim().toUpperCase() !== 'HAPUS DATA' || resettingData}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-xs font-black text-white transition-colors hover:bg-rose-400 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>{resettingData ? 'Menghapus...' : 'Hapus Semua Data'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
