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
  DollarSign,
  Calendar,
  Store,
  Tag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR } from '@/lib/utils/currency';

export default function OcrScanPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const router = useRouter();
  const supabase = createClient();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSaveSuccess(false);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessOCR = async () => {
    if (!imageBase64) {
      setError('Silakan pilih foto struk/nota terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses gambar struk.');

      setExtractedData(data.extracted);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses OCR Gemini Vision.');
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
      }, 1500);
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
        title="Scan Nota & Struk (OCR AI)"
        subtitle="Ekstraksi otomatis nominal, toko, dan item dari foto struk menggunakan Gemini Vision"
      />

      <div className="px-6 space-y-6 max-w-5xl mx-auto">
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
              Unggah Foto Struk / Nota
            </h3>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/60 min-h-[280px]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-white">Klik untuk memilih gambar</span>
                <span className="text-xs text-slate-400 mt-1">Format JPG, PNG, WEBP (Maks 5MB)</span>
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
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ganti Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleProcessOCR}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menganalisis Struk...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Proses dengan Gemini Vision</span>
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
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Hasil Ekstraksi OCR
              </h3>

              {!extractedData ? (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[220px]">
                  <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                  <p>Unggah dan proses foto struk di sebelah kiri.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    AI akan otomatis mendeteksi nama merchant, tanggal, total bayar, dan rincian belanja.
                  </p>
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
                      Catatan AI: {extractedData.notes}
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
