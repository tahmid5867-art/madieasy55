import React from 'react';
import { Sale } from '../../types/pharmacy';
import { usePharmacy } from '../../context/PharmacyContext';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { store, language, formatAmount, formatNum, t } = usePharmacy();

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBn = language === 'bn';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-700 text-white print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm">
              {isBn ? 'ক্যাশ মেমো / বিক্রয় রসিদ' : 'Sale Cash Memo / Receipt'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-white text-emerald-800 text-xs font-bold rounded-lg shadow-xs hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 overflow-y-auto text-gray-800 text-xs font-mono space-y-4">
          {/* Pharmacy Info */}
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight">{store.name}</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">{store.address}</p>
            <p className="text-[11px] text-gray-600">{store.phone}</p>
            <p className="text-[10px] text-emerald-800 font-semibold mt-1">
              {isBn ? 'ড্রাগ লাইসেন্স নং: ' : 'Drug Lic: '} {store.drugLicenseNo}
            </p>
          </div>

          {/* Receipt Metadata */}
          <div className="grid grid-cols-2 gap-1 text-[11px] pb-2 border-b border-dashed border-gray-300">
            <div>
              <span className="text-gray-500">{isBn ? 'রসিদ নং: ' : 'Memo #: '}</span>
              <span className="font-bold">{sale.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">{isBn ? 'তারিখ: ' : 'Date: '}</span>
              <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-500">{isBn ? 'ক্যাশিয়ার: ' : 'Cashier: '}</span>
              <span className="font-medium">{sale.cashierName}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">{isBn ? 'সময়: ' : 'Time: '}</span>
              <span>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="col-span-2 mt-1">
              <span className="text-gray-500">{isBn ? 'ক্রেতা: ' : 'Customer: '}</span>
              <span className="font-bold">{sale.customerName}</span>
              {sale.customerPhone && <span className="text-gray-500"> ({sale.customerPhone})</span>}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold text-[11px] border-b border-gray-400 pb-1 uppercase">
              <span className="w-1/2">{isBn ? 'আইটেম বিবরণ' : 'Description'}</span>
              <span className="w-1/6 text-center">{isBn ? 'পরিমাণ' : 'Qty'}</span>
              <span className="w-1/6 text-right">{isBn ? 'দর' : 'Rate'}</span>
              <span className="w-1/6 text-right">{isBn ? 'মোট' : 'Total'}</span>
            </div>
            {sale.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5 py-1 border-b border-gray-100">
                <div className="flex justify-between font-medium">
                  <span className="w-1/2 font-semibold text-gray-900 truncate">{item.medicineName}</span>
                  <span className="w-1/6 text-center">{formatNum(item.quantity)}</span>
                  <span className="w-1/6 text-right">{formatNum(item.unitPrice.toFixed(2))}</span>
                  <span className="w-1/6 text-right font-semibold">{formatAmount(item.lineTotal)}</span>
                </div>
                {item.batchAllocations && item.batchAllocations.length > 0 && (
                  <div className="text-[10px] text-gray-500 pl-2">
                    {item.batchAllocations.map((b, bIdx) => (
                      <span key={bIdx} className="mr-2">
                        • {b.batchNumber} (Exp: {b.expiryDate})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="pt-2 border-t border-dashed border-gray-300 space-y-1 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>{isBn ? 'উপমোট (Subtotal):' : 'Subtotal:'}</span>
              <span>{formatAmount(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>{isBn ? 'ছাড় (Discount):' : 'Discount:'}</span>
                <span>-{formatAmount(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-950 pt-1 border-t border-gray-300">
              <span>{isBn ? 'প্রদেয় সর্বমোট (Payable):' : 'Net Payable:'}</span>
              <span>{formatAmount(sale.totalPayable)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>{isBn ? 'প্রাপ্ত নগদ/পেমেন্ট:' : 'Amount Received:'}</span>
              <span>{formatAmount(sale.paidAmount)}</span>
            </div>
            {sale.changeAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>{isBn ? 'ফেরত টাকা (Change):' : 'Change Return:'}</span>
                <span>{formatAmount(sale.changeAmount)}</span>
              </div>
            )}
            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>{isBn ? 'বকেয়া হিসাব (Due):' : 'Balance Due:'}</span>
                <span>{formatAmount(sale.dueAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 text-[11px] pt-1">
              <span>{isBn ? 'পদ্ধতি:' : 'Payment:'}</span>
              <span className="uppercase font-semibold">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Return Policy & Thank you */}
          <div className="pt-3 border-t border-dashed border-gray-300 text-center space-y-1 text-[10px] text-gray-500">
            <p className="font-medium">{store.returnPolicy}</p>
            <p className="font-bold text-gray-800 text-[11px] mt-1">
              {isBn ? 'সুস্থ থাকুন, আমাদের সাথে থাকার জন্য ধন্যবাদ!' : 'Thank you for shopping with MediEasy!'}
            </p>
            <p className="text-[9px] text-gray-400">Software: MediEasy BD Pharmacy OS</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
