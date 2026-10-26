import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Customer } from '../types/pharmacy';
import { Users, Plus, Phone, MapPin, DollarSign, CreditCard, X, CheckCircle2 } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, collectCustomerDue, formatAmount, formatNum, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [collectingCustomer, setCollectingCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [collectNote, setCollectNote] = useState<string>('');

  const handleCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCustomer || collectAmount <= 0) return;

    collectCustomerDue(collectingCustomer.id, collectAmount, paymentMethod, collectNote);
    setCollectingCustomer(null);
    setCollectAmount(0);
    setCollectNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_customers')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(customers.length)} {isBn ? 'জন নিয়মিত গ্রাহক ও কাস্টমার তালিকা' : 'customer profiles with dues tracking'}
          </p>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{c.phone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">{t('cust_currentDue')}</span>
                  <span className={`text-base font-bold ${c.currentDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatAmount(c.currentDue)}
                  </span>
                </div>
              </div>

              {c.address && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{c.address}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                {isBn ? 'মোট কেনাকাটা: ' : 'Total: '} <strong className="text-gray-900">{formatAmount(c.totalSpent)}</strong>
              </span>

              <button
                onClick={() => {
                  setCollectingCustomer(c);
                  setCollectAmount(c.currentDue);
                }}
                disabled={c.currentDue <= 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t('cust_collectDue')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Collect Due Modal */}
      {collectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">{t('cust_collectDue')}</h3>
              <button onClick={() => setCollectingCustomer(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">{collectingCustomer.name}</p>
              <p className="text-gray-500">{collectingCustomer.phone}</p>
              <p className="text-rose-600 font-bold mt-1">
                {isBn ? 'মোট বকেয়া বিল: ' : 'Total Outstanding Due: '} {formatAmount(collectingCustomer.currentDue)}
              </p>
            </div>

            <form onSubmit={handleCollect} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{isBn ? 'আদায়কৃত টাকার পরিমাণ' : 'Collected Amount'} (৳) *</label>
                <input
                  type="number"
                  min={1}
                  max={collectingCustomer.currentDue}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-bold text-emerald-800"
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
                  <option value="rocket">Rocket</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('notes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared partial due, Money receipt #101"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectingCustomer(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  {t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
