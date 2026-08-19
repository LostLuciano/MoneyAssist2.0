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
  ShoppingBag,
  Receipt,
  ListOrdered,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR } from '@/lib/utils/currency';
import { buildTransactionDetailNotes, getPaymentMethodFromExtracted } from '@/lib/utils/transactionDetails';

async function compressImageForOCR(file: File, maxDimension: number = 1100, quality: number = 0.82): Promise<string> {
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
      const compressed = await compressImageForOCR(file);
      setImagePreview(compressed);
      setImageBase64(compressed);

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

      const notesContent = buildTransactionDetailNotes(extractedData, 'Scan Struk OCR');
      const paymentMethod = getPaymentMethodFromExtracted(extractedData);

      const payload = {
        user_id: user?.id,
        type: 'expense',
        amount: Number(extractedData.amount) || 0,
        description: extractedData.merchant || extractedData.seller || extractedData.platform || 'Struk Belanja (OCR)',
        transaction_date: extractedData.date || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        notes: notesContent || extractedData.notes || 'Dicatat via Scan Struk OCR',
      };

      if (!user) throw new Error('Silakan login terlebih dahulu untuk menyimpan transaksi struk.');

      const { error: insertError } = await supabase.from('transactions').insert([payload]);
      if (insertError) throw insertError;

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
        title="Scan Nota (Gemini Vision OCR)"
        subtitle="Ekstraksi total belanja, nama merchant, tanggal, dan rincian item otomatis"
      />

      <div className="px-4 sm:px-6 space-y-5 max-w-6xl mx-auto">
        {/* Banner with macOS status style */}
        <div className="p-3.5 rounded-2xl macos-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0 animate-pulse" />
            <span>AI Multimodal Vision: Membaca foto struk belanja, m-Banking, invoice & marketplace.</span>
          </div>
          {providerBadge && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono text-[10px] font-bold shrink-0">
              {providerBadge}
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Transaksi struk berhasil disimpan! Mengalihkan ke halaman transaksi...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload & Dropzone Column (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl macos-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                <ScanLine className="w-4 h-4 text-emerald-400" />
                Upload Dokumen / Struk
              </h3>
            </div>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04] min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/25">
                  <Camera className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white">Ambil Foto / Pilih Struk</span>
                <span className="text-[11px] text-slate-400 mt-1 text-center">Format JPEG, PNG, WEBP (maks 10MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 max-h-96 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Receipt Preview"
                    className="object-contain max-h-96 w-full rounded-xl"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      <span className="text-xs font-bold">Menganalisis rincian item dengan Gemini Vision...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer flex items-center gap-1.5 min-h-[36px]">
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
                    onClick={() => runOCRScan()}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[36px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memindai...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pindai Ulang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Inspector Column (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl macos-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Hasil Inspeksi OCR
                </h3>
              </div>

              {!extractedData ? (
                <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[260px] space-y-2">
                  <Receipt className="w-10 h-10 text-slate-600 mb-1" />
                  <p className="font-semibold text-slate-300">Belum ada struk yang dipindai</p>
                  <p className="text-slate-400 max-w-xs text-[11px]">
                    Unggah atau foto struk belanja untuk melihat rincian nama item, kuantitas, harga satuan, dan total otomatis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Total & Merchant Highlight */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Merchant / Toko
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {extractedData.merchant || 'Struk Belanja'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Pembayaran
                      </span>
                      <h4 className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                        {formatIDR(extractedData.amount)}
                      </h4>
                    </div>
                  </div>

                  {/* Metadata row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Tanggal
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {extractedData.date || '-'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        Kategori Disarankan
                      </span>
                      <p className="text-xs font-bold text-emerald-400 mt-1">
                        {extractedData.category || 'Belanja & Kebutuhan'}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <div className="px-3.5 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                          Rincian Item ({extractedData.items.length} Barang)
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-white/[0.02] text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                            <tr>
                              <th className="px-3 py-2">Nama Barang</th>
                              <th className="px-3 py-2 text-center">Qty</th>
                              <th className="px-3 py-2 text-right">Harga Satuan</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04] text-[11px]">
                            {extractedData.items.map((it: any, idx: number) => {
                              const isObj = typeof it === 'object';
                              const name = isObj ? it.name : it;
                              const qty = isObj ? it.qty || 1 : 1;
                              const price = isObj ? Number(it.price) || 0 : 0;
                              const total = isObj ? Number(it.total) || price * qty : 0;

                              return (
                                <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                                  <td className="px-3 py-2 font-medium text-white max-w-[160px] truncate">
                                    {name}
                                  </td>
                                  <td className="px-3 py-2 text-center text-cyan-400 font-semibold font-mono">
                                    {qty}x
                                  </td>
                                  <td className="px-3 py-2 text-right text-slate-400 font-mono">
                                    {price > 0 ? formatIDR(price) : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-slate-200 font-mono">
                                    {total > 0 ? formatIDR(total) : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={handleSaveToTransactions}
                  disabled={saving || saveSuccess}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[40px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Transaksi...</span>
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
