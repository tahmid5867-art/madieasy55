import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { RotateCcw, Plus, AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { ReturnRecord } from '../types/pharmacy';

export const ReturnsView: React.FC = () => {
  const { medicines, batches, recordReturn, formatAmount, formatNum, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [showModal, setShowModal] = useState(false);
  const [returnType, setReturnType] = useState<
    'customer_return' | 'supplier_return' | 'damaged' | 'quarantine' | 'write_off'
  >('damaged');
  const [selectedMedId, setSelectedMedId] = useState(medicines[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [reason, setReason] = useState('Broken strip during shipping / packaging defect');
  const [refundAmount, setRefundAmount] = useState(0);

  // Return history records
  const [returnHistory, setReturnHistory] = useState<ReturnRecord[]>([
    {
      id: 'ret-01',
      storeId: 'store-dhanmondi-01',
      type: 'damaged',
      medicineId: 'med-napa-extra',
      medicineName: 'Napa Extra 500mg (Beximco)',
      batchNumber: 'BEX-NE-26A',
      quantity: 10,
      reason: 'Liquid spill on carton during monsoon delivery',
      refundAmount: 21.0,
      recordedBy: 'Pharmacist',
      createdAt: '2026-10-24T15:00:00.000Z',
    },
    {
      id: 'ret-02',
      storeId: 'store-dhanmondi-01',
      type: 'quarantine',
      medicineId: 'med-alatrol-10',
      medicineName: 'Alatrol 10mg (Square)',
      batchNumber: 'SQ-AL-012',
      quantity: 15,
      reason: 'Batch reached expiration date (2026-09-30)',
      refundAmount: 36.0,
      recordedBy: 'Inventory Lead',
      createdAt: '2026-10-20T11:00:00.000Z',
    },
  ]);

  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med || quantity <= 0) return;

    const newRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      storeId: 'store-dhanmondi-01',
      type: returnType,
      medicineId: med.id,
      medicineName: `${med.brandName} (${med.strength})`,
      batchNumber: batchNumber || 'GENERAL',
      quantity,
      reason,
      refundAmount,
      recordedBy: 'Pharmacist',
      createdAt: new Date().toISOString(),
    };

    recordReturn(newRecord);
    setReturnHistory((prev) => [newRecord, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('ret_title')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn
              ? 'গ্রাহক ও কোম্পানি ফেরত, ক্ষতিগ্রস্থ স্টক এবং মেয়াদোত্তীর্ণ কোয়ারেন্টাইন ট্র্যাকিং'
              : 'Audit workflows for customer returns, supplier returns, damaged stock, and expiry quarantine'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন ফেরত / ক্ষতি এন্ট্রি' : 'Record Return / Damaged Stock'}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>{t('ret_type_customer')}</span>
            <RotateCcw className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {formatNum(returnHistory.filter((r) => r.type === 'customer_return').length)} {isBn ? 'টি' : 'records'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{isBn ? 'পরিদর্শন সাপেক্ষে ফেরত' : 'Subject to pharmacist inspection'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>{t('ret_type_damaged')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {formatNum(returnHistory.filter((r) => r.type === 'damaged').length)} {isBn ? 'টি' : 'records'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{isBn ? 'ভাঙা বা নষ্ট স্টক' : 'Broken / handling damage'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>{t('ret_type_quarantine')}</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {formatNum(returnHistory.filter((r) => r.type === 'quarantine' || r.type === 'write_off').length)} {isBn ? 'টি' : 'records'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{isBn ? 'বিক্রয় নিষিদ্ধ আইটেম' : 'Locked from active sale'}</p>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{t('ret_type')}</th>
                <th className="py-3 px-4">{t('med_brandName')}</th>
                <th className="py-3 px-4">{t('batch_number')}</th>
                <th className="py-3 px-4 text-center">{t('quantity')}</th>
                <th className="py-3 px-4">{isBn ? 'কারণ / বিবরণ' : 'Reason'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'সমন্বয় মূল্য' : 'Refund / Loss'}</th>
                <th className="py-3 px-4">{isBn ? 'দায়িত্বপ্রাপ্ত' : 'Recorded By'}</th>
                <th className="py-3 px-4">{t('date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returnHistory.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ret.type === 'customer_return'
                          ? 'bg-emerald-100 text-emerald-900'
                          : ret.type === 'supplier_return'
                          ? 'bg-blue-100 text-blue-900'
                          : ret.type === 'quarantine'
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {ret.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{ret.medicineName}</td>
                  <td className="py-3 px-4 font-mono text-gray-600">{ret.batchNumber}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-900">
                    {formatNum(ret.quantity)} {isBn ? 'পিস' : 'pcs'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{ret.reason}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600">{formatAmount(ret.refundAmount)}</td>
                  <td className="py-3 px-4 text-gray-500">{ret.recordedBy}</td>
                  <td className="py-3 px-4 text-gray-400">{new Date(ret.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Return Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">{isBn ? 'নতুন ফেরত / নষ্ট রেকর্ড' : 'Record Return or Damaged Stock'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReturn} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('ret_type')} *</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold"
                >
                  <option value="customer_return">{t('ret_type_customer')}</option>
                  <option value="supplier_return">{t('ret_type_supplier')}</option>
                  <option value="damaged">{t('ret_type_damaged')}</option>
                  <option value="quarantine">{t('ret_type_quarantine')}</option>
                  <option value="write_off">{t('ret_type_writeOff')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('med_brandName')} *</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brandName} ({m.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('batch_number')}</label>
                <input
                  type="text"
                  placeholder="e.g. SQ-SEC-992"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('quantity')} *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{isBn ? 'সমন্বয় মূল্য' : 'Refund / Value'} (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{isBn ? 'কারণ / বিবরণ' : 'Reason'} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Breakage, customer allergic reaction, packaging defect"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
