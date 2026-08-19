'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Category, Transaction } from '@/lib/types/database';
import clsx from 'clsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: Category[];
  initialData?: Partial<Transaction> | null;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#ef4444', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-2', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#f97316', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-3', name: 'Belanja & Kebutuhan', type: 'expense', icon: 'ShoppingBag', color: '#f59e0b', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-4', name: 'Tagihan & Utilitas', type: 'expense', icon: 'Receipt', color: '#8b5cf6', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-5', name: 'Hiburan & Rekreasi', type: 'expense', icon: 'Gamepad2', color: '#ec4899', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-6', name: 'Kesehatan & Medis', type: 'expense', icon: 'HeartPulse', color: '#06b6d4', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-7', name: 'Investasi & Tabungan', type: 'expense', icon: 'TrendingUp', color: '#10b981', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-8', name: 'Gaji Utama', type: 'income', icon: 'Wallet', color: '#10b981', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-9', name: 'Freelance & Side Job', type: 'income', icon: 'Briefcase', color: '#06b6d4', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-10', name: 'Hasil Usaha/Bisnis', type: 'income', icon: 'Store', color: '#3b82f6', is_system: true, user_id: null, created_at: '' },
  { id: 'cat-11', name: 'Bonus & Tunjangan', type: 'income', icon: 'Gift', color: '#8b5cf6', is_system: true, user_id: null, created_at: '' },
];

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  initialData = null,
}: TransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const allCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const filteredCategories = allCategories.filter((c) => c.type === type);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setDescription(initialData.description || '');
      setCategoryId(initialData.category_id || '');
      setDate(initialData.transaction_date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(initialData.payment_method || 'Cash');
      setNotes(initialData.notes || '');
    } else {
      setAmount('');
      setDescription('');
      setCategoryId(filteredCategories[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Cash');
      setNotes('');
    }
    setError(null);
  }, [isOpen, initialData]);

  useEffect(() => {
    const valid = filteredCategories.some((c) => c.id === categoryId);
    if (!valid && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setError('Nominal harus lebih besar dari Rp 0.');
      return;
    }

    if (!description.trim()) {
      setError('Deskripsi transaksi wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Sesi pengguna tidak valid. Silakan login kembali.');
      }

      const payload = {
        user_id: user.id,
        type,
        amount: numericAmount,
        description: description.trim(),
        category_id: categoryId || null,
        transaction_date: date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      if (initialData?.id) {
        const { error: updateErr } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', initialData.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from('transactions').insert([payload]);
        if (insertErr) throw insertErr;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Save transaction error:', err);
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl macos-window shadow-macos-window animate-in zoom-in-95 duration-150">
        {/* macOS Window Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <span className="text-xs font-bold text-white tracking-tight ml-2">
              {initialData?.id ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Segmented Type Selector */}
          <div className="macos-segmented w-full justify-center">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`macos-segmented-item flex-1 py-1.5 text-center ${
                type === 'expense' ? 'active !text-rose-400' : ''
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`macos-segmented-item flex-1 py-1.5 text-center ${
                type === 'income' ? 'active !text-emerald-400' : ''
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                Rp
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                }}
                placeholder="0"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500/60 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Keterangan / Merchant
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan Siang, Bensin, Gaji Bulanan"
              required
              className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-all min-h-[38px]"
            />
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e1424] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all min-h-[38px]"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0e1424]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e1424] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all min-h-[38px]"
              >
                <option value="Cash" className="bg-[#0e1424]">Tunai / Cash</option>
                <option value="QRIS" className="bg-[#0e1424]">QRIS / E-Wallet</option>
                <option value="Transfer Bank" className="bg-[#0e1424]">Transfer Bank</option>
                <option value="Debit Card" className="bg-[#0e1424]">Kartu Debit</option>
                <option value="Credit Card" className="bg-[#0e1424]">Kartu Kredit</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0e1424] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all min-h-[38px]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Tambahan detail transaksi..."
              className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all active:scale-95 min-h-[36px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[36px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{initialData?.id ? 'Perbarui' : 'Simpan Transaksi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
