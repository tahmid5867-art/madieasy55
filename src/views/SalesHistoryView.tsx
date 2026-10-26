import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Sale } from '../types/pharmacy';
import { History, Search, Printer, RotateCcw, Eye, Calendar, User, DollarSign, X } from 'lucide-react';
import { ReceiptModal } from '../components/common/ReceiptModal';

export const SalesHistoryView: React.FC = () => {
  const { sales, formatAmount, formatNum, language, t, recordReturn } = usePharmacy();
  const isBn = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('Customer returned unopened medicine');

  const filteredSales = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return sales.filter(
      (s) =>
        !q ||
        s.receiptNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [sales, searchTerm]);

  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setShowReceiptModal(true);
  };

  const handleConfirmRefund = () => {
    if (!refundingSale) return;

    // Record return record
    refundingSale.items.forEach((item) => {
      recordReturn({
        type: 'customer_return',
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchNumber: item.batchAllocations?.[0]?.batchNumber || 'N/A',
        quantity: item.quantity,
        reason: refundReason,
        refundAmount: item.lineTotal,
        recordedBy: 'Pharmacist',
      });
    });

    refundingSale.status = 'refunded';
    setRefundingSale(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_salesHistory')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(sales.length)} {isBn ? 'টি বিক্রয় লেনদেনের সম্পূর্ণ রেকর্ড' : 'completed sales transactions recorded'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            placeholder={isBn ? 'রসিদ নম্বর, ক্রেতা বা ক্যাশিয়ার খুঁজুন...' : 'Search receipt number, customer, or cashier...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'রসিদ নং' : 'Receipt No'}</th>
                <th className="py-3 px-4">{isBn ? 'ক্রেতার নাম' : 'Customer'}</th>
                <th className="py-3 px-4">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                <th className="py-3 px-4">{isBn ? 'ক্যাশিয়ার' : 'Cashier'}</th>
                <th className="py-3 px-4">{t('pos_paymentMethod')}</th>
                <th className="py-3 px-4 text-right">{t('subtotal')}</th>
                <th className="py-3 px-4 text-right">{t('discount')}</th>
                <th className="py-3 px-4 text-right">{t('pos_payable')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400">
                    {isBn ? 'কোনো বিক্রয় পাওয়া যায়নি।' : 'No sales records found.'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{sale.receiptNo}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{sale.customerName}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{sale.cashierName}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px] text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-gray-100">{sale.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatAmount(sale.subtotal)}</td>
                    <td className="py-3 px-4 text-right text-rose-500 font-medium">
                      {sale.discount > 0 ? `-${formatAmount(sale.discount)}` : '0'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-950">{formatAmount(sale.totalPayable)}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sale.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t('print')}</span>
                        </button>

                        {sale.status === 'completed' && (
                          <button
                            onClick={() => setRefundingSale(sale)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isBn ? 'ফেরত / রিফান্ড' : 'Issue Refund'}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {refundingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">
                {isBn ? 'বিক্রয় ফেরত ও রিফান্ড অনুমোদন' : 'Authorize Sale Refund'}
              </h3>
              <button onClick={() => setRefundingSale(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <p className="font-bold text-gray-900">
                Receipt #{refundingSale.receiptNo} ({formatAmount(refundingSale.totalPayable)})
              </p>
              <p className="text-gray-600">Customer: {refundingSale.customerName}</p>
              <p className="text-amber-800 text-[11px]">
                {isBn
                  ? 'সতর্কতা: ফেরত নেওয়া ওষুধ সরাসরি বিক্রয়যোগ্য হবে না, ফার্মাসিস্টের কোয়ারেন্টাইন পরিদর্শনের প্রয়োজন।'
                  : 'Notice: Returned medicines will be routed to quarantine inspection.'}
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">{isBn ? 'ফেরতের কারণ' : 'Refund Reason'} *</label>
              <input
                type="text"
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundingSale(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {isBn ? 'রিফান্ড অনুমোদন করুন' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal sale={selectedSale} onClose={() => setShowReceiptModal(false)} />
      )}
    </div>
  );
};
