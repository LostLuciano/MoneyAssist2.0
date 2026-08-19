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

  // Set default category when type changes
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

      const payload = {
        user_id: user?.id,
        type,
        amount: numericAmount,
        description: description.trim(),
        category_id: categoryId.startsWith('cat-') ? null : categoryId,
        transaction_date: date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      if (initialData?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', initialData.id);
        if (updateError) throw updateError;
      } else {
        // Insert
        if (!user) throw new Error('Silakan login terlebih dahulu untuk menyimpan transaksi.');

        const { error: insertError } = await supabase
          .from('transactions')
          .insert([payload]);
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData?.id ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
              </h2>
              <p className="text-xs text-slate-400">Pencatatan instan terhubung ke Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle: Expense / Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={clsx(
                'py-2 text-xs font-bold rounded-lg transition-all',
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              💸 Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={clsx(
                'py-2 text-xs font-bold rounded-lg transition-all',
                type === 'income'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              💰 Pemasukan
            </button>
          </div>

          {/* Nominal Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nominal (Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-base font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Keterangan / Deskripsi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan Siang Nasi Padang, Belanja Mingguan..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="Cash">Cash (Tunai)</option>
                <option value="Transfer Bank">Transfer Bank / VA</option>
                <option value="QRIS">QRIS / E-Wallet</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
              </select>
            </div>
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Transaksi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
