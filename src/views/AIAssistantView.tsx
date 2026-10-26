import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Sparkles, Send, Bot, User, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const { sales, batches, medicines, expenses, store, suppliers, customers, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: isBn
        ? `আসসালামু আলাইকুম! আমি মেডিইজি এআই বিজনেস অ্যাসিস্ট্যান্ট। জেমিনাই ৩.৮ ফ্ল্যাশ দ্বারা পরিচালিত। আমি আপনার ফার্মেসির বর্তমান ডেটাবেস বিশ্লেষণ করে বিক্রয়, স্টক, মেয়াদ এবং অর্ডার সংক্রান্ত যেকোনো প্রশ্নের সঠিক উত্তর দিতে পারি।`
        : `Hello! I am the MediEasy AI Business Assistant powered by Gemini 3.8 Flash. I can analyze your live pharmacy database and answer questions about sales, inventory velocity, expiry alerts, and supplier reordering.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSend = async (userPrompt?: string) => {
    const promptToSend = userPrompt || input;
    if (!promptToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setInput('');
    setLoading(true);

    // Prepare live grounded database context
    const contextData = {
      storeName: store.name,
      totalMedicines: medicines.length,
      medicinesSummary: medicines.map((m) => ({
        id: m.id,
        name: m.brandName,
        strength: m.strength,
        manufacturer: m.manufacturer,
        sellingPrice: m.sellingPrice,
        purchasePrice: m.purchasePrice,
        minStockAlert: m.minStockAlert,
      })),
      batchesSummary: batches.map((b) => ({
        batchNumber: b.batchNumber,
        medicineId: b.medicineId,
        remainingQty: b.remainingQuantity,
        expiryDate: b.expiryDate,
        status: b.status,
      })),
      recentSalesCount: sales.length,
      salesTotals: {
        totalRevenue: sales.reduce((sum, s) => sum + s.totalPayable, 0),
        totalGrossSales: sales.reduce((sum, s) => sum + s.subtotal, 0),
        totalDiscounts: sales.reduce((sum, s) => sum + s.discount, 0),
        totalCogs: sales.reduce((sum, s) => sum + (s.cogs || 0), 0),
      },
      recentExpenses: expenses.map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
      })),
      customerDuesTotal: customers.reduce((sum, c) => sum + (c.currentDue || 0), 0),
      supplierPayablesTotal: suppliers.reduce((sum, s) => sum + (s.currentPayable || 0), 0),
    };

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          context: contextData,
          language,
        }),
      });

      const res = await response.json();
      const reply = res.reply || (isBn ? 'উত্তর তৈরি করা সম্ভব হয়নি।' : 'Failed to generate response.');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isBn
            ? 'সার্ভারে সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Error connecting to AI service.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { text: t('ai_suggested_sales'), prompt: isBn ? 'আজকের বিক্রয় ও লাভের পূর্ণাঙ্গ হিসাব দাও' : "Summarize today's sales and estimated profit" },
    { text: t('ai_suggested_lowStock'), prompt: isBn ? 'কোন কোন ওষুধের স্টক কম রয়েছে এবং কত পিস রিঅর্ডার করা দরকার?' : 'Which medicines are running low in stock and need reordering?' },
    { text: t('ai_suggested_expiry'), prompt: isBn ? 'কোন কোন ব্যাচ শীঘ্রই মেয়াদোত্তীর্ণ হবে?' : 'Which batches will expire soon in the next 30-45 days?' },
    { text: t('ai_suggested_reorder'), prompt: isBn ? 'স্কয়ার ও বেক্সিমকো কোম্পানি থেকে কী কী ওষুধ অর্ডার করা প্রয়োজন?' : 'Suggest reorder items for Square and Beximco distributors' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('ai_title')}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{t('ai_subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isBn ? 'লাইভ ডেটাবেস গ্রাউন্ডেড' : 'Live Database Grounded'}</span>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s.prompt)}
            disabled={loading}
            className="p-3 bg-white hover:bg-emerald-50/70 border border-gray-200 hover:border-emerald-300 rounded-xl text-left text-xs font-medium text-gray-700 hover:text-emerald-950 transition-all cursor-pointer shadow-xs flex items-center justify-between gap-2"
          >
            <span className="line-clamp-2">{s.text}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-teal-100 text-teal-800'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                <p>{msg.content}</p>
                <span
                  className={`text-[9px] block mt-1.5 ${
                    msg.role === 'user' ? 'text-emerald-200 text-right' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-xl w-48">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>{isBn ? 'বিশ্লেষণ করা হচ্ছে...' : 'Gemini is analyzing...'}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 pt-3 border-t border-gray-100 flex gap-2"
        >
          <input
            type="text"
            placeholder={t('ai_askPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t('ai_send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
