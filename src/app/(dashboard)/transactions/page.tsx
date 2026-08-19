'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Wallet,
  X,
  FileText,
  CreditCard,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import TransactionModal from '@/components/transactions/TransactionModal';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Category } from '@/lib/types/database';
import { formatIDR, formatDateID } from '@/lib/utils/currency';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  const supabase = createClient();

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) setCategories(catData);

      if (user) {
        let query = supabase
          .from('transactions')
          .select('*, categories(*)')
          .order('transaction_date', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        setTransactions(data || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCat = filterCategory === 'all' || tx.category_id === filterCategory;
    return matchesSearch && matchesType && matchesCat;
  });

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <Header
        title="Daftar Transaksi"
        subtitle="Manajemen dan riwayat seluruh transaksi arus kas"
        categories={categories}
        onTransactionAdded={fetchTransactions}
      />

      <div className="px-4 sm:px-6 space-y-5 max-w-7xl mx-auto">
        {/* macOS Style Filter & Search Toolbar */}
        <div className="p-4 rounded-2xl macos-card flex flex-col md:flex-row items-center justify-between gap-3.5">
          {/* Search Input with Spotlight Style */}
          <div className="flex-1 w-full md:w-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, merchant, catatan..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/[0.07] transition-all min-h-[38px]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* macOS Segmented Control */}
            <div className="macos-segmented shrink-0">
              <button
                onClick={() => setFilterType('all')}
                className={`macos-segmented-item ${filterType === 'all' ? 'active' : ''}`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`macos-segmented-item ${filterType === 'expense' ? 'active !text-rose-400' : ''}`}
              >
                Pengeluaran
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`macos-segmented-item ${filterType === 'income' ? 'active !text-emerald-400' : ''}`}
              >
                Pemasukan
              </button>
            </div>

            {/* Category Dropdown */}
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all min-h-[38px] shrink-0"
              >
                <option value="all" className="bg-[#0e1424] text-white">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0e1424] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                setSelectedTx(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shrink-0 shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[38px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Summary Counter Pill */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 select-none">
          <span>Menampilkan <strong className="text-white font-mono">{filteredTransactions.length}</strong> transaksi</span>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span>
              Pengeluaran: <strong className="text-rose-400 font-mono">{formatIDR(totalFilteredExpense)}</strong>
            </span>
            <span>
              Pemasukan: <strong className="text-emerald-400 font-mono">{formatIDR(totalFilteredIncome)}</strong>
            </span>
          </div>
        </div>

        {/* macOS Table Window */}
        <div className="rounded-2xl macos-card overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <p className="font-medium text-slate-400">Tidak ada transaksi yang cocok.</p>
              <p className="text-slate-600 mt-1">Coba sesuaikan kata kunci pencarian atau filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06] text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Keterangan</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Metode</th>
                    <th className="px-5 py-3 text-right">Nominal</th>
                    <th className="px-5 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setDetailTx(tx)}
                        className="cursor-pointer hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg border ${
                                isIncome
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.2]" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
                              )}
                            </div>
                            <span className="truncate max-w-xs">{tx.description}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08] text-[11px]">
                            {tx.categories?.name || 'Umum'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                          {formatDateID(tx.transaction_date, 'dd MMM yyyy')}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-[11px]">{tx.payment_method || 'Cash'}</td>
                        <td
                          className={`px-5 py-3.5 text-right font-bold text-xs sm:text-sm font-mono ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTx(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                              title="Edit Transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(tx.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors active:scale-95"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        initialData={selectedTx}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTx(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedTx(null);
          fetchTransactions();
        }}
        categories={categories}
      />

      {/* macOS Inspector / Detail Sheet Dialog */}
      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl macos-window shadow-macos-window">
            {/* macOS Window Titlebar with Traffic Lights */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-xs font-bold text-white tracking-tight ml-2">Detail Transaksi</span>
              </div>
              <button
                onClick={() => setDetailTx(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="border-b border-white/[0.06] pb-3">
                <h2 className="text-base font-bold text-white tracking-tight">{detailTx.description}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateID(detailTx.transaction_date, 'dd MMMM yyyy')}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nominal</p>
                  <p className={`mt-1 text-sm font-bold font-mono ${detailTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {detailTx.type === 'income' ? '+' : '-'} {formatIDR(detailTx.amount)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kategori</p>
                  <p className="mt-1 text-xs font-semibold text-white truncate">{detailTx.categories?.name || 'Umum'}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode</p>
                  <p className="mt-1 text-xs font-semibold text-white truncate">{detailTx.payment_method || 'Cash'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-[11px] font-bold uppercase tracking-wider">Rincian OCR / Catatan</p>
                </div>
                {detailTx.notes ? (
                  <div className="space-y-1">
                    {detailTx.notes.split('\n').map((line, index) => (
                      <p key={`${line}-${index}`} className="rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 font-mono">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Belum ada catatan detail untuk transaksi ini.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setSelectedTx(detailTx);
                    setDetailTx(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-95"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    const id = detailTx.id;
                    setDetailTx(null);
                    handleDelete(id);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-all active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
