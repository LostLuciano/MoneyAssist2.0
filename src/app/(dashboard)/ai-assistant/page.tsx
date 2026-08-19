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
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR } from '@/lib/utils/currency';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Halo! Saya MoneyAssist AI 2.0. Saya dapat membantu Anda meninjau kondisi keuangan, merancang anggaran bulanan, ataupun mencatat transaksi langsung dari percakapan ini (misal: "catat beli bensin 50rb"). Ada yang bisa saya bantu hari ini?',
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghubungi AI.');

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: data.reply,
        detectedTransaction: data.detectedTransaction || null,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: 'Maaf, terjadi kendala saat memproses jawaban. Pastikan GEMINI_API_KEY telah dikonfigurasi.',
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

      if (user) {
        const { error } = await supabase.from('transactions').insert([payload]);
        if (error) throw error;
      } else {
        const localTx = JSON.parse(localStorage.getItem('moneyassist_demo_tx') || '[]');
        localTx.unshift({
          id: 'demo-' + Date.now(),
          ...payload,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('moneyassist_demo_tx', JSON.stringify(localTx));
      }

      setSavedSuccessId(msgId);
    } catch (err: any) {
      alert('Gagal menyimpan transaksi: ' + err.message);
    } finally {
      setSavingTxId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Header
        title="AI Financial Advisor"
        subtitle="Konsultasi strategi finansial & pencatatan transaksi percakapan cerdas"
      />

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-4">
        {messages.map((msg) => {
          const isAI = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                isAI ? 'justify-start' : 'justify-end'
              } animate-in fade-in duration-150`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  isAI
                    ? 'glass-panel border border-white/10 text-slate-200'
                    : 'bg-emerald-500 text-slate-950 font-medium'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Detected Transaction Card */}
                {isAI && msg.detectedTransaction && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Transaksi Terdeteksi
                      </span>
                      <span className="text-xs font-bold text-white">
                        {formatIDR(msg.detectedTransaction.amount)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {msg.detectedTransaction.description} (
                      {msg.detectedTransaction.suggested_category || 'Pengeluaran'})
                    </p>

                    {savedSuccessId === msg.id ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold pt-1">
                        <Check className="w-4 h-4" />
                        <span>Tersimpan di Catatan Transaksi!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleSaveDetectedTransaction(msg.id, msg.detectedTransaction)
                        }
                        disabled={savingTxId === msg.id}
                        className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                      >
                        {savingTxId === msg.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Konfirmasi & Simpan ke Database</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-panel border border-white/10 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>MoneyAssist AI sedang mengetik...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts & Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#0b0f19] max-w-4xl w-full mx-auto space-y-3">
        {messages.length <= 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300 text-xs shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan rekomendasi atau ketik transaksi (contoh: 'beli kopi 25rb')..."
            className="flex-1 px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
