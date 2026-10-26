import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Supplier } from '../types/pharmacy';
import { Truck, Plus, Phone, Mail, MapPin, DollarSign, CreditCard, X } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, paySupplierDue, formatAmount, formatNum, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [payNote, setPayNote] = useState<string>('');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || payAmount <= 0) return;

    paySupplierDue(payingSupplier.id, payAmount, payMethod, payNote);
    setPayingSupplier(null);
    setPayAmount(0);
    setPayNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_suppliers')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(suppliers.length)} {isBn ? 'টি ওষুধ প্রস্তুতকারী ও সরবরাহকারী' : 'pharmaceutical distributor profiles'}
          </p>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{s.name}</h3>
                  <p className="text-xs font-semibold text-emerald-800">{s.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">{t('supp_payable')}</span>
                  <span className={`text-base font-bold ${s.currentPayable > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatAmount(s.currentPayable)}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{s.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {isBn ? 'কোম্পানি কোড: ' : 'ID: '} <span className="font-mono">{s.id}</span>
              </span>
              <button
                onClick={() => {
                  setPayingSupplier(s);
                  setPayAmount(s.currentPayable);
                }}
                disabled={s.currentPayable <= 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t('supp_recordPayment')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pay Supplier Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">{t('supp_recordPayment')}</h3>
              <button onClick={() => setPayingSupplier(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">{payingSupplier.name}</p>
              <p className="text-gray-500 mt-0.5">{payingSupplier.company}</p>
              <p className="text-rose-600 font-bold mt-1">
                {isBn ? 'বর্তমান প্রদেয় দেনা: ' : 'Current Payable: '} {formatAmount(payingSupplier.currentPayable)}
              </p>
            </div>

            <form onSubmit={handlePay} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{isBn ? 'পরিশোধিত টাকার পরিমাণ' : 'Payment Amount'} (৳) *</label>
                <input
                  type="number"
                  min={1}
                  max={payingSupplier.currentPayable}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('pos_paymentMethod')}</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="cash">Cash / নগদ</option>
                  <option value="bank">Bank Transfer / চেক</option>
                  <option value="bkash">bKash Merchant</option>
                  <option value="nagad">Nagad</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('notes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #8812, Cash voucher"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
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
