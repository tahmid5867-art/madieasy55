import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Receipt, Plus, DollarSign, Calendar, Tag, X } from 'lucide-react';
import { Expense } from '../types/pharmacy';

export const ExpensesView: React.FC = () => {
  const { expenses, recordExpense, formatAmount, formatNum, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<'rent' | 'electricity' | 'salary' | 'transport' | 'packaging' | 'other'>('electricity');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    recordExpense({
      title,
      amount,
      category,
      date,
      paymentMethod,
      note,
      recordedBy: 'Store Manager',
    });

    setShowModal(false);
    setTitle('');
    setAmount(0);
    setNote('');
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_expenses')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn ? 'মোট খরচ: ' : 'Total Expenses: '}
            <strong className="text-amber-800 font-bold">{formatAmount(totalExpense)}</strong> ({formatNum(expenses.length)} {isBn ? 'টি এন্ট্রি' : 'entries'})
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন খরচ এন্ট্রি' : 'Record Expense'}</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'খরচের বিবরণ' : 'Expense Title'}</th>
                <th className="py-3 px-4">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4">{t('pos_paymentMethod')}</th>
                <th className="py-3 px-4">{t('notes')}</th>
                <th className="py-3 px-4 text-right">{t('total')} (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900">{exp.title}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{exp.date}</td>
                  <td className="py-3 px-4 uppercase text-gray-600 font-medium">{exp.paymentMethod}</td>
                  <td className="py-3 px-4 text-gray-500 italic">{exp.note || '-'}</td>
                  <td className="py-3 px-4 text-right font-bold text-amber-800">{formatAmount(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">{isBn ? 'নতুন খরচ এন্ট্রি' : 'Record Operating Expense'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{isBn ? 'খরচের বিবরণ' : 'Expense Title'} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop rent, Electricity bill, Tea & snacks"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{isBn ? 'টাকার পরিমাণ' : 'Amount'} (৳) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-amber-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{isBn ? 'ক্যাটাগরি' : 'Category'}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold"
                  >
                    <option value="rent">{isBn ? 'দোকান ভাড়া' : 'Rent'}</option>
                    <option value="electricity">{isBn ? 'বিদ্যুৎ বিল' : 'Electricity'}</option>
                    <option value="salary">{isBn ? 'স্টাফ বেতন' : 'Salary'}</option>
                    <option value="transport">{isBn ? 'যাতায়াত / পরিবহন' : 'Transport'}</option>
                    <option value="packaging">{isBn ? 'প্যাকেজিং ও ব্যাগ' : 'Packaging'}</option>
                    <option value="other">{isBn ? 'অন্যান্য খরচ' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('date')} *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('pos_paymentMethod')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">Cash / নগদ</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="bank">Bank / চেক</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('notes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Voucher no, meter slip"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
