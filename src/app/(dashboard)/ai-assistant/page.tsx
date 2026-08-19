'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  TrendingDown,
  Wallet,
  AlertCircle,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR } from '@/lib/utils/currency';
import { AVAILABLE_AI_MODELS } from '@/lib/ai/provider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  detectedTransaction?: {
    type: 'expense' | 'income';
    amount: number;
    description: string;
    suggested_category?: string;
  } | null;
}

const STARTER_PROMPTS = [
  'Bagaimana cara membagi gaji dengan metode 50/30/20?',
  'Catat pengeluaran makan siang ayam geprek 25rb',
  'Apa tips menekan biaya langganan bulanan & hiburan?',
  'Bagaimana cara mulai mengumpulkan dana darurat 3 bulan?',
];

export default function AiAssistantPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>('groq-llama-3.3');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Halo! Saya MoneyAssist AI 2.0. Saya dapat membantu Anda meninjau kondisi keuangan, merancang anggaran bulanan, ataupun mencatat transaksi langsung dari percakapan ini (misal: "catat beli bensin 50rb"). Anda juga bebas memilih model AI yang ingin digunakan pada menu di atas. Ada yang bisa saya bantu hari ini?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingTxId, setSavingTxId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeModel = AVAILABLE_AI_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_AI_MODELS[0];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-4),
          selectedModelId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghubungi AI.');

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: data.reply,
        provider: data.provider,
        detectedTransaction: data.detectedTransaction,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: `Terjadi kendala saat memproses: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetectedTransaction = async (msgId: string, txData: any) => {
    setSavingTxId(msgId);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id,
        type: txData.type || 'expense',
        amount: Number(txData.amount) || 0,
        description: txData.description || 'Transaksi dari AI Chat',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
      };

      if (!user) throw new Error('Silakan login terlebih dahulu untuk menyimpan transaksi.');

      const { error } = await supabase.from('transactions').insert([payload]);
      if (error) throw error;

      setSavedSuccessId(msgId);
    } catch (err: any) {
      alert('Gagal menyimpan transaksi: ' + err.message);
    } finally {
      setSavingTxId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="AI Financial Advisor"
        subtitle="Konsultasi finansial interaktif, tips budgeting, dan pencatatan transaksi cerdas"
      />

      <div className="px-4 sm:px-6 max-w-4xl mx-auto space-y-4">
        {/* Model Selector Bar */}
        <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Model AI Aktif
              </span>
              <span className="text-xs font-semibold text-white">
                {activeModel.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-slate-950 border border-white/10 hover:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer w-full sm:w-auto"
            >
              {AVAILABLE_AI_MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-slate-900 text-white">
                  {model.badge} • {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Window */}
        <div className="glass-panel rounded-3xl border border-white/5 flex flex-col h-[580px] overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0 mt-1 shadow-lg shadow-cyan-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-tr-none shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/90 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Detected Transaction Card */}
                    {msg.detectedTransaction && (
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-white space-y-2.5">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Transaksi Terdeteksi
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              msg.detectedTransaction.type === 'income'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {msg.detectedTransaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Keterangan:</span>
                            <span className="font-semibold">{msg.detectedTransaction.description}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Nominal:</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {formatIDR(msg.detectedTransaction.amount)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSaveDetectedTransaction(msg.id, msg.detectedTransaction)}
                          disabled={savingTxId === msg.id || savedSuccessId === msg.id}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            savedSuccessId === msg.id
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          }`}
                        >
                          {savingTxId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : savedSuccessId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tersimpan di Riwayat!</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Simpan Transaksi Ini</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Model Provider Footnote */}
                    {!isUser && msg.provider && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex items-center gap-1">
                        <span>Dijawab oleh:</span>
                        <span className="font-mono text-cyan-400 font-semibold">{msg.provider}</span>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{activeModel.name} sedang berpikir...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Prompts */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-[11px] text-slate-300 hover:text-white whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-950 border-t border-white/5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Tanyakan keuangan atau catat transaksi dengan ${activeModel.name}...`}
                className="flex-1 px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
