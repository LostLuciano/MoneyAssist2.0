'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Wallet,
  Download,
  AlertCircle,
  X,
  FileText,
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
        subtitle="Kelola dan telusuri seluruh riwayat pengeluaran dan pemasukan"
        categories={categories}
        onTransactionAdded={fetchTransactions}
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-7xl mx-auto">
        {/* Filters & Search Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full md:w-auto relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, toko, keterangan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
            {/* Type selector */}
            <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'expense'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pengeluaran
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shrink-0 shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Summary Pill */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2">
          <span>Menampilkan {filteredTransactions.length} transaksi</span>
          <div className="flex items-center gap-4">
            <span>
              Total Pengeluaran:{' '}
              <strong className="text-rose-400 font-bold">{formatIDR(totalFilteredExpense)}</strong>
            </span>
            <span>
              Total Pemasukan:{' '}
              <strong className="text-emerald-400 font-bold">{formatIDR(totalFilteredIncome)}</strong>
            </span>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <p>Tidak ada transaksi yang cocok dengan filter atau pencarian Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3.5">Keterangan</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5">Tanggal</th>
                    <th className="px-6 py-3.5">Metode</th>
                    <th className="px-6 py-3.5 text-right">Nominal</th>
                    <th className="px-6 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setDetailTx(tx)}
                        className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isIncome
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="truncate max-w-xs">{tx.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                            {tx.categories?.name || 'Umum'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {formatDateID(tx.transaction_date, 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{tx.payment_method || 'Cash'}</td>
                        <td
                          className={`px-6 py-4 text-right font-bold text-sm ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTx(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(tx.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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

      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/5 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Detail Transaksi</p>
                <h2 className="mt-1 text-lg font-black text-white">{detailTx.description}</h2>
                <p className="mt-1 text-xs text-slate-400">{formatDateID(detailTx.transaction_date, 'dd MMMM yyyy')}</p>
              </div>
              <button
                onClick={() => setDetailTx(null)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nominal</p>
                  <p className={`mt-2 text-xl font-black ${detailTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {detailTx.type === 'income' ? '+' : '-'} {formatIDR(detailTx.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kategori</p>
                  <p className="mt-2 text-sm font-bold text-white">{detailTx.categories?.name || 'Umum'}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Metode</p>
                  <p className="mt-2 text-sm font-bold text-white">{detailTx.payment_method || 'Cash'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-300">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <p className="text-xs font-bold uppercase tracking-wider">Rincian OCR / Catatan</p>
                </div>
                {detailTx.notes ? (
                  <div className="space-y-1.5">
                    {detailTx.notes.split('\n').map((line, index) => (
                      <p key={`${line}-${index}`} className="rounded-lg bg-slate-900/70 px-3 py-2 text-xs leading-relaxed text-slate-300">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Belum ada catatan detail untuk transaksi ini.</p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setSelectedTx(detailTx);
                    setDetailTx(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-700"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    const id = detailTx.id;
                    setDetailTx(null);
                    handleDelete(id);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
