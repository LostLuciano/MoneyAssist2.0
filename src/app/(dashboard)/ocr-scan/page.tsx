'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScanLine,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Tag,
  RefreshCw,
  Zap,
  Camera,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR } from '@/lib/utils/currency';

/**
 * Client-Side Instant Image Compression to accelerate OCR processing by up to 10x!
 */
async function compressImageForOCR(file: File, maxDimension: number = 1000, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OcrScanPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [providerBadge, setProviderBadge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const router = useRouter();
  const supabase = createClient();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSaveSuccess(false);
    setExtractedData(null);
    setProviderBadge(null);

    try {
      // Compress instantly in client memory
      const compressed = await compressImageForOCR(file);
      setImagePreview(compressed);
      setImageBase64(compressed);

      // Auto-trigger fast scan
      runOCRScan(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
    }
  };

  const runOCRScan = async (base64ToUse?: string) => {
    const dataToSend = base64ToUse || imageBase64;
    if (!dataToSend) {
      setError('Silakan pilih foto struk/nota terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses gambar struk.');

      setExtractedData(data.extracted);
      setProviderBadge(data.provider || 'AI Vision');
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses OCR.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTransactions = async () => {
    if (!extractedData) return;
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id,
        type: 'expense',
        amount: Number(extractedData.amount) || 0,
        description: extractedData.merchant || 'Struk Belanja (OCR)',
        transaction_date: extractedData.date || new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        notes: extractedData.items ? `Item: ${extractedData.items.join(', ')}` : null,
      };

      if (user) {
        const { error: insertError } = await supabase.from('transactions').insert([payload]);
        if (insertError) throw insertError;
      } else {
        const localTx = JSON.parse(localStorage.getItem('moneyassist_demo_tx') || '[]');
        localTx.unshift({
          id: 'demo-' + Date.now(),
          ...payload,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('moneyassist_demo_tx', JSON.stringify(localTx));
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push('/transactions');
      }, 1200);
    } catch (err: any) {
      console.error('Error saving OCR transaction:', err);
      setError(err.message || 'Gagal menyimpan transaksi dari struk.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Scan Nota & Struk (Ultra-Fast OCR)"
        subtitle="Ekstraksi instan total belanja, nama toko, dan tanggal otomatis dari foto struk"
      />

      <div className="px-6 space-y-6 max-w-5xl mx-auto">
        {/* Speed Highlight Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span>Mode Kompresi Kilat Aktif: Foto otomatis dioptimalkan sebelum dikirim ke AI.</span>
          </div>
          {providerBadge && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-bold">
              {providerBadge}
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Transaksi dari struk berhasil disimpan! Mengalihkan ke daftar transaksi...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload and Preview Column */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-emerald-400" />
              Unggah atau Foto Struk
            </h3>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/60 min-h-[280px]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-white">Ambil Foto / Pilih Struk</span>
                <span className="text-xs text-slate-400 mt-1">Otomatis dipindai kilat (&lt; 1 detik)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 max-h-80 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Receipt Preview"
                    className="object-contain max-h-80 w-full"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      <span className="text-xs font-bold">Menganalisis kilat dengan AI...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Pilih Foto Lain</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => runOCRScan()}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memindai...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Pindai Ulang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data Column */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Hasil Ekstraksi OCR
                </h3>
                {providerBadge && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {providerBadge}
                  </span>
                )}
              </div>

              {!extractedData ? (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[220px]">
                  <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                  <p>Unggah foto struk belanja untuk melihat ekstraksi otomatis.</p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Merchant & Amount Highlight */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        Tempat / Toko
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {extractedData.merchant || 'Struk Belanja'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        Total Nominal
                      </span>
                      <h4 className="text-lg font-black text-emerald-400 mt-0.5">
                        {formatIDR(extractedData.amount)}
                      </h4>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Tanggal
                      </span>
                      <p className="text-xs font-semibold text-white mt-1">
                        {extractedData.date || '-'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        Kategori Disarankan
                      </span>
                      <p className="text-xs font-semibold text-emerald-400 mt-1">
                        {extractedData.category || 'Belanja & Kebutuhan'}
                      </p>
                    </div>
                  </div>

                  {/* Item List */}
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                        Rincian Item Terdeteksi:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {extractedData.items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.notes && (
                    <p className="text-[11px] text-slate-400 italic">
                      Catatan: {extractedData.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {extractedData && (
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleSaveToTransactions}
                  disabled={saving || saveSuccess}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Sebagai Transaksi Baru</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
