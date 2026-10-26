import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Purchase, PurchaseLineItem } from '../types/pharmacy';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  Calendar,
  Truck,
  X,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    suppliers,
    medicines,
    recordSupplierPurchase,
    formatAmount,
    formatNum,
    language,
    t,
  } = usePharmacy();

  const isBn = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [items, setItems] = useState<
    {
      medicineId: string;
      medicineName: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
      lineTotal: number;
    }[]
  >([]);

  // Item line form
  const [currMedId, setCurrMedId] = useState(medicines[0]?.id || '');
  const [currBatch, setCurrBatch] = useState('');
  const [currExp, setCurrExp] = useState('2028-12-31');
  const [currQty, setCurrQty] = useState(100);
  const [currPrice, setCurrPrice] = useState(medicines[0]?.purchasePrice || 5.0);

  const handleAddItem = () => {
    const med = medicines.find((m) => m.id === currMedId);
    if (!med || !currBatch.trim() || currQty <= 0) return;

    const lineTotal = currQty * currPrice;
    setItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        medicineName: `${med.brandName} (${med.strength})`,
        batchNumber: currBatch,
        expiryDate: currExp,
        quantity: currQty,
        purchasePrice: currPrice,
        lineTotal,
      },
    ]);

    setCurrBatch('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim() || items.length === 0) return;

    const supp = suppliers.find((s) => s.id === supplierId);
    const supplierName = supp ? supp.name : 'Supplier';

    recordSupplierPurchase({
      invoiceNo,
      supplierId,
      supplierName,
      purchaseDate,
      items,
      discount,
      paidAmount: Number(paidAmount) || totalAmount,
    });

    setShowAddModal(false);
    setInvoiceNo('');
    setItems([]);
  };

  const filteredPurchases = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return purchases.filter(
      (p) =>
        !q ||
        p.invoiceNo.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.purchaseDate.includes(q)
    );
  }, [purchases, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_purchases')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(purchases.length)} {isBn ? 'টি ক্রয় চালান রেকর্ড করা হয়েছে' : 'procurement invoices recorded'}
          </p>
        </div>

        <button
          onClick={() => {
            setItems([]);
            setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('pur_newPurchase')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            placeholder={isBn ? 'চালান নম্বর বা কোম্পানি খুঁজুন...' : 'Search invoice or supplier...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{t('pur_invoiceNo')}</th>
                <th className="py-3 px-4">{t('pur_supplier')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'আইটেম সংখ্যা' : 'Items'}</th>
                <th className="py-3 px-4 text-right">{t('total')}</th>
                <th className="py-3 px-4 text-right">{t('paid')}</th>
                <th className="py-3 px-4 text-right">{t('due')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    {isBn ? 'কোনো ক্রয় চালান পাওয়া যায়নি।' : 'No purchases found.'}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{pur.invoiceNo}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{pur.supplierName}</td>
                    <td className="py-3 px-4 text-gray-600">{pur.purchaseDate}</td>
                    <td className="py-3 px-4 text-center font-bold">{formatNum(pur.items.length)}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatAmount(pur.totalAmount)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatAmount(pur.paidAmount)}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-semibold">{formatAmount(pur.payableAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900">
                        {pur.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingPurchase(pur)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        title={t('view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
              <h3 className="font-bold text-base">{t('pur_newPurchase')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-white/80 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('pur_supplier')} *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('pur_invoiceNo')} *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('date')} *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Add Line Item Box */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider block">
                  {isBn ? 'চালানে ওষুধ আইটেম যুক্ত করুন' : 'Add Medicine Line Item'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-gray-600 mb-0.5">{t('med_brandName')}</label>
                    <select
                      value={currMedId}
                      onChange={(e) => {
                        setCurrMedId(e.target.value);
                        const med = medicines.find((m) => m.id === e.target.value);
                        if (med) setCurrPrice(med.purchasePrice);
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg font-medium"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brandName} ({m.strength})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-0.5">{t('batch_number')}</label>
                    <input
                      type="text"
                      placeholder="e.g. B-991"
                      value={currBatch}
                      onChange={(e) => setCurrBatch(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-0.5">{t('batch_expiryDate')}</label>
                    <input
                      type="date"
                      value={currExp}
                      onChange={(e) => setCurrExp(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-0.5">{t('quantity')}</label>
                    <input
                      type="number"
                      min={1}
                      value={currQty}
                      onChange={(e) => setCurrQty(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-gray-700">{t('med_purchasePrice')} (৳):</label>
                    <input
                      type="number"
                      step="0.05"
                      value={currPrice}
                      onChange={(e) => setCurrPrice(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    + {isBn ? 'তালিকায় যোগ করুন' : 'Add Item'}
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2">Medicine</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2">Expiry</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-400">
                          {isBn ? 'এখনও কোনো আইটেম যোগ করা হয়নি।' : 'No items added yet.'}
                        </td>
                      </tr>
                    ) : (
                      items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold text-gray-900">{i.medicineName}</td>
                          <td className="p-2 font-mono text-gray-600">{i.batchNumber}</td>
                          <td className="p-2 font-mono">{i.expiryDate}</td>
                          <td className="p-2 text-center font-bold">{formatNum(i.quantity)}</td>
                          <td className="p-2 text-right">{formatAmount(i.purchasePrice)}</td>
                          <td className="p-2 text-right font-bold text-gray-900">{formatAmount(i.lineTotal)}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-gray-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[11px] text-gray-500 block">{t('subtotal')}:</span>
                  <span className="font-bold text-sm text-gray-900">{formatAmount(subtotal)}</span>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">{t('discount')} (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">{t('paid')} (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer"
                >
                  {isBn ? 'চালান গ্রহণ ও স্টক বৃদ্ধি' : 'Receive & Add to Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">
                Invoice #{viewingPurchase.invoiceNo}
              </h3>
              <button onClick={() => setViewingPurchase(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <p>Supplier: <strong className="text-gray-900">{viewingPurchase.supplierName}</strong></p>
              <p>Date: <strong className="text-gray-900">{viewingPurchase.purchaseDate}</strong></p>
              <p>Total Amount: <strong className="text-gray-900">{formatAmount(viewingPurchase.totalAmount)}</strong></p>
              <p>Paid Amount: <strong className="text-emerald-700">{formatAmount(viewingPurchase.paidAmount)}</strong></p>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 uppercase text-[10px] font-bold text-gray-600">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Exp</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewingPurchase.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold text-gray-900">{it.medicineName}</td>
                      <td className="p-2 font-mono text-gray-600">{it.batchNumber}</td>
                      <td className="p-2 font-mono">{it.expiryDate}</td>
                      <td className="p-2 text-center font-bold">{formatNum(it.quantity)}</td>
                      <td className="p-2 text-right">{formatAmount(it.purchasePrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-2 font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
