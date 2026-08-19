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
    }
  };

  useEffect(() => {
    fetchProfile();

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
        subtitle="Integrasi otomatisasi pencatatan transaksi via Ketuk Belakang iPhone dan Bot Telegram"
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-5xl mx-auto">
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/25 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. Telegram Bot Integration Card */}
        <div className="p-6 md:p-7 rounded-2xl macos-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
                  Bot Telegram MoneyAssist AI
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 font-mono">
                    @{botUsername}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catat transaksi via chat teks atau kirim foto struk langsung di Telegram
                </p>
              </div>
            </div>

            {isConnected ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terhubung (@{profile.telegram_username || profile.telegram_id})
                </span>
                <button
                  onClick={handleSendTestPing}
                  disabled={testingPing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition-all active:scale-95 min-h-[34px]"
                  title="Tes Kirim Pesan ke Bot"
                >
                  {testingPing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                  <span>Tes Pesan</span>
                </button>
                <button
                  onClick={handleUnlinkTelegram}
                  disabled={unlinking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-white/10 text-xs font-semibold transition-all active:scale-95 min-h-[34px]"
                  title="Putuskan Sambungan"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 text-xs font-bold shrink-0 animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  Menunggu Pairing...
                </span>
                <button
                  onClick={fetchProfile}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 active:scale-95"
                  title="Cek Status Sekarang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Connected Verified Banner OR Pairing Code Customizer */}
          {isConnected ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold">Sinkronisasi Real-Time Aktif</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bot Telegram <strong>@{botUsername}</strong> telah terhubung dengan akun Anda. Setiap pesan teks atau foto struk yang Anda kirim akan langsung tercatat otomatis.
              </p>
              <div className="pt-1">
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[36px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Buka Chat Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kode Pairing Akun
                  </span>
                  <p className="text-xs text-slate-300 max-w-lg">
                    Kode ini dibuat otomatis untuk menghubungkan web dan bot Telegram. Salin kode atau buka bot langsung.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-2">
                    <span className="font-mono text-xl font-bold tracking-widest text-emerald-400">
                      {activePairingCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(activePairingCode, 'plain_code')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-95 min-h-[38px]"
                  >
                    {copiedKey === 'plain_code' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'plain_code' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2 Ways to Connect */}
          {!isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    Cara 1: Buka Bot Langsung (1-Klik)
                  </span>
                  <p className="text-xs text-slate-300 mt-1">
                    Buka Telegram dan hubungkan akun secara otomatis via link ini.
                  </p>
                </div>

                <a
                  href={telegramDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 transition-all min-h-[38px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Buka Bot @{botUsername}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Cara 2: Ketik Kode di Chat Bot
                  </span>
                  <p className="text-xs text-slate-300 mt-1">
                    Buka bot di Telegram, lalu ketik kodenya saja secara langsung.
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between font-mono text-xs text-emerald-400">
                  <span>{activePairingCode}</span>
                  <button
                    onClick={() => handleCopy(activePairingCode, 'code_only')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-xs font-sans font-semibold transition-all active:scale-95"
                  >
                    {copiedKey === 'code_only' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'code_only' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. iPhone Siri & Back Tap Shortcut Card */}
        <div className="p-6 md:p-7 rounded-2xl macos-card space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
                  Pintasan iPhone (Ketuk Belakang / Back Tap)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 font-mono">
                    iOS Shortcut
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catat transaksi instan dari tangkapan layar m-Banking via 2x ketuk punggung iPhone
                </p>
              </div>
            </div>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
              isConnected
                ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-300'
                : 'border-amber-500/25 bg-amber-500/15 text-amber-300'
            }`}>
              {isConnected ? <CheckCircle2 className="h-3.5 h-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              <span>{isConnected ? 'Siap Digunakan' : 'Perlu Hubungkan Telegram'}</span>
            </span>
          </div>

          {/* Endpoints */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white">Endpoint Upload Pintasan</span>
                  <p className="text-[10px] text-slate-400">POST Request Form</p>
                </div>
                <button
                  disabled={!isConnected || !shortcutToken}
                  onClick={() => handleCopy(uploadEndpoint, 'upload_ep')}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 disabled:opacity-40"
                >
                  {copiedKey === 'upload_ep' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'upload_ep' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className={`rounded-xl border p-2.5 font-mono text-[10px] truncate ${
                isConnected ? 'border-emerald-500/20 bg-black/40 text-emerald-300' : 'border-white/5 bg-black/30 text-slate-500'
              }`}>
                {isConnected ? uploadEndpoint : 'Hubungkan Telegram terlebih dahulu.'}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white">URL Tes Koneksi</span>
                  <p className="text-[10px] text-slate-400">GET Request Ping</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!isConnected || !shortcutToken}
                    onClick={() => handleCopy(pingEndpoint, 'ping_ep')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-500/25 disabled:opacity-40"
                  >
                    {copiedKey === 'ping_ep' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ping_ep' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  {isConnected && shortcutToken && (
                    <a
                      href={pingEndpoint}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2 py-1 text-xs font-bold text-cyan-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className={`rounded-xl border p-2.5 font-mono text-[10px] truncate ${
                isConnected ? 'border-cyan-500/20 bg-black/40 text-cyan-300' : 'border-white/5 bg-black/30 text-slate-500'
              }`}>
                {isConnected ? pingEndpoint : 'Hubungkan Telegram terlebih dahulu.'}
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Panduan Pembuatan Pintasan di iPhone:
            </h4>
            <div className="space-y-1.5 text-xs">
              {[
                'Buka aplikasi Pintasan (Shortcuts) di iPhone, ketuk +, lalu beri nama "Scan MoneyAssist".',
                'Tambah tindakan "Ambil Tangkapan Layar" (Take Screenshot).',
                'Tambah tindakan "Dapatkan Isi URL" (Get Contents of URL), lalu masukkan URL Endpoint Upload di atas.',
                'Pilih Method: POST, Request Body: Form, isi field File "photo" dengan hasil Tangkapan Layar.',
                'Buka Pengaturan iPhone > Aksesibilitas > Sentuh > Ketuk Bagian Belakang (Back Tap) > Ketuk Dua Kali > pilih "Scan MoneyAssist".'
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Reset Data Card */}
        <div className="rounded-2xl macos-card border-rose-500/20 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-rose-500/25 bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bersihkan Riwayat Transaksi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hapus seluruh data transaksi dan anggaran tanpa menghapus akun atau kode pairing Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2 lg:max-w-xs">
              <input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="Ketik HAPUS DATA"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 font-mono text-xs font-bold text-white outline-none focus:border-rose-500/60 min-h-[38px]"
              />
              <button
                onClick={handleResetAllData}
                disabled={resetConfirm.trim().toUpperCase() !== 'HAPUS DATA' || resettingData}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 min-h-[38px]"
              >
                {resettingData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>{resettingData ? 'Menghapus...' : 'Hapus Semua Data'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
