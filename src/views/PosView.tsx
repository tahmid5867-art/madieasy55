import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Medicine, CartItem, Sale } from '../types/pharmacy';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  User,
  CreditCard,
  DollarSign,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';
import { allocateBatchesFEFO, calculatePaymentSplits, convertUnits } from '../utils/calculations';
import { ReceiptModal } from '../components/common/ReceiptModal';

export const PosView: React.FC = () => {
  const {
    medicines,
    batches,
    customers,
    formatAmount,
    formatNum,
    language,
    t,
    completeSale,
  } = usePharmacy();

  const isBn = language === 'bn';

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Customer & Payment
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [walkInName, setWalkInName] = useState<string>('General Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'due' | 'split'>('cash');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');

  // Receipt & Status
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Available medicines with their sellable remaining stock
  const medicinesWithStock = useMemo(() => {
    return medicines
      .filter((m) => m.status === 'active')
      .map((med) => {
        const activeBatches = batches.filter(
          (b) => b.medicineId === med.id && b.status === 'active' && new Date(b.expiryDate).getTime() > Date.now()
        );
        const totalStock = activeBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
        return {
          ...med,
          sellableStock: totalStock,
          activeBatches,
        };
      });
  }, [medicines, batches]);

  // Filtered medicine list for browsing
  const filteredMedicines = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return medicinesWithStock.filter((m) => {
      const matchSearch =
        !q ||
        m.brandName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.banglaName.toLowerCase().includes(q) ||
        m.barcode.includes(q) ||
        m.manufacturer.toLowerCase().includes(q);

      const matchDosage = selectedDosage === 'all' || m.dosageForm.toLowerCase() === selectedDosage.toLowerCase();
      return matchSearch && matchDosage;
    });
  }, [medicinesWithStock, searchTerm, selectedDosage]);

  // Add medicine to cart
  const addToCart = (med: Medicine) => {
    setErrorMessage(null);
    const existingIndex = cart.findIndex((item) => item.medicine.id === med.id);

    const medBatches = batches.filter((b) => b.medicineId === med.id);
    const availableStock = medBatches
      .filter((b) => b.status === 'active' && new Date(b.expiryDate).getTime() > Date.now())
      .reduce((sum, b) => sum + b.remainingQuantity, 0);

    if (availableStock <= 0) {
      setErrorMessage(
        isBn
          ? `${med.brandName} এর কোনো বিক্রয়যোগ্য সক্রিয় স্টক নেই!`
          : `No sellable active stock for ${med.brandName}!`
      );
      return;
    }

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > availableStock) {
        setErrorMessage(
          isBn
            ? `পর্যাপ্ত স্টক নেই! অবশিষ্ট স্টক: ${availableStock} পিস`
            : `Insufficient stock! Remaining: ${availableStock} pcs`
        );
        return;
      }

      const fefo = allocateBatchesFEFO(medBatches, currentQty + 1);
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: currentQty + 1,
                allocations: fefo.allocations,
                totalPrice: (currentQty + 1) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      const fefo = allocateBatchesFEFO(medBatches, 1);
      const newItem: CartItem = {
        medicine: med,
        quantity: 1,
        unit: 'piece',
        unitPrice: med.sellingPrice,
        discount: 0,
        allocations: fefo.allocations,
        totalPrice: med.sellingPrice,
      };
      setCart((prev) => [newItem, ...prev]);
    }
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    const medBatches = batches.filter((b) => b.medicineId === item.medicine.id);
    const availableStock = medBatches
      .filter((b) => b.status === 'active' && new Date(b.expiryDate).getTime() > Date.now())
      .reduce((sum, b) => sum + b.remainingQuantity, 0);

    if (newQty > availableStock) {
      setErrorMessage(
        isBn
          ? `সর্বোচ্চ প্রাপ্ত স্টক: ${availableStock} পিস`
          : `Maximum available stock: ${availableStock} pcs`
      );
      return;
    }

    const fefo = allocateBatchesFEFO(medBatches, newQty);
    setCart((prev) =>
      prev.map((it, idx) =>
        idx === index
          ? {
              ...it,
              quantity: newQty,
              allocations: fefo.allocations,
              totalPrice: newQty * it.unitPrice,
            }
          : it
      )
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setPaidAmountInput('');
    setErrorMessage(null);
  };

  // Handle barcode scanner input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = medicinesWithStock.find((m) => m.barcode.trim() === barcodeInput.trim());
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      setErrorMessage(
        isBn
          ? `বারকোড (${barcodeInput}) মেলে নি!`
          : `Barcode (${barcodeInput}) not found in catalog!`
      );
    }
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    if (discountPercent > 0) {
      return Number(((subtotal * discountPercent) / 100).toFixed(2));
    }
    return discountAmount || 0;
  }, [subtotal, discountPercent, discountAmount]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount);
  }, [subtotal, totalDiscount]);

  // Default paid amount to total payable when total changes
  useEffect(() => {
    if (totalPayable > 0 && !paidAmountInput) {
      setPaidAmountInput(String(totalPayable));
    }
  }, [totalPayable]);

  const paidAmountNumber = parseFloat(paidAmountInput) || 0;
  const paymentSplits = calculatePaymentSplits(totalPayable, paidAmountNumber);

  // Complete checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const customerObj = customers.find((c) => c.id === selectedCustomerId);
    const finalCustName = customerObj ? customerObj.name : walkInName || 'General Walk-in Customer';
    const finalCustPhone = customerObj ? customerObj.phone : walkInPhone;

    try {
      const result = await completeSale({
        customerId: selectedCustomerId || undefined,
        customerName: finalCustName,
        customerPhone: finalCustPhone,
        items: cart,
        discount: totalDiscount,
        paidAmount: paidAmountNumber,
        paymentMethod,
      });

      if (!result.success || !result.sale) {
        throw new Error(result.error || 'Checkout failed');
      }

      setCompletedSale(result.sale);
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dosageForms = ['all', 'Tablet', 'Capsule', 'Syrup', 'Drop', 'Injection', 'Sachet'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Cols: Medicine Browsing & Search */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Barcode Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={isBn ? 'ওষুধ, জেনেরিক বা শক্তি খুঁজুন (যেমন: Napa, Seclo)...' : 'Search brand or generic...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>

            {/* Quick Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative w-44 sm:w-56">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={t('pos_barcodeInput')}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              />
              <Barcode className="w-4 h-4 text-emerald-600 absolute left-2.5 top-2.5" />
            </form>
          </div>

          {/* Dosage Form Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {dosageForms.map((df) => (
              <button
                key={df}
                onClick={() => setSelectedDosage(df)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDosage.toLowerCase() === df.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {df === 'all' ? (isBn ? 'সব' : 'All') : df}
              </button>
            ))}
          </div>
        </div>

        {/* Medicine Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredMedicines.map((med) => {
            const hasStock = med.sellableStock > 0;
            const earliestExp = med.activeBatches.sort(
              (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
            )[0];

            return (
              <div
                key={med.id}
                onClick={() => hasStock && addToCart(med)}
                className={`p-3.5 bg-white rounded-xl border transition-all text-left flex flex-col justify-between ${
                  hasStock
                    ? 'border-gray-200 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      {med.dosageForm}
                    </span>
                    {med.prescriptionRequired && (
                      <span className="text-[10px] font-bold text-rose-600 px-1 border border-rose-200 rounded">
                        Rx
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 leading-tight truncate">{med.brandName}</h4>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{med.strength}</p>
                  <p className="text-[11px] text-gray-400 italic truncate">{med.genericName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{med.manufacturer}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-emerald-700 text-sm">{formatAmount(med.sellingPrice)}</span>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold block ${
                        med.sellableStock <= med.minStockAlert ? 'text-amber-600' : 'text-gray-500'
                      }`}
                    >
                      {formatNum(med.sellableStock)} {isBn ? 'পিস' : 'pcs'}
                    </span>
                    {earliestExp && (
                      <span className="text-[9px] text-gray-400 block">
                        Exp: {earliestExp.expiryDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 5 Cols: Cart & Checkout Ledger */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 sticky top-20">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-gray-900">{t('pos_title')}</h3>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              {formatNum(cart.length)}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              {t('pos_clearCart')}
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700">{t('pos_selectCustomer')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) {
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) {
                    setWalkInName(cust.name);
                    setWalkInPhone(cust.phone);
                  }
                } else {
                  setWalkInName('General Walk-in Customer');
                  setWalkInPhone('');
                }
              }}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
            >
              <option value="">{t('pos_walkInCustomer')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {isBn ? 'বকেয়া: ' : 'Due: '} {c.currentDue}
                </option>
              ))}
            </select>

            {!selectedCustomerId && (
              <input
                type="text"
                placeholder={isBn ? 'ওয়াক-ইন নাম / ফোন (ঐচ্ছিক)' : 'Walk-in phone / name'}
                value={walkInPhone}
                onChange={(e) => setWalkInPhone(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-200"
              />
            )}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="py-8 text-center text-gray-400 space-y-2">
              <ShoppingCart className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs">{t('pos_cartEmpty')}</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.medicine.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 truncate">
                  <p className="font-bold text-gray-900 truncate">
                    {item.medicine.brandName} <span className="text-gray-500 font-normal">({item.medicine.strength})</span>
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {formatAmount(item.unitPrice)} / {isBn ? 'পিস' : 'pc'}
                  </p>
                  {/* FEFO Batch Indicator */}
                  {item.allocations && item.allocations.length > 0 && (
                    <p className="text-[9px] text-emerald-700 font-mono mt-0.5">
                      Batch: {item.allocations.map((a) => `${a.batchNumber} (${a.quantity})`).join(', ')}
                    </p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900">{formatNum(item.quantity)}</span>
                  <button
                    onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <span className="w-16 text-right font-bold text-gray-900">{formatAmount(item.totalPrice)}</span>

                {/* Delete */}
                <button
                  onClick={() => removeFromCart(idx)}
                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Financial Totals & Discounts */}
        {cart.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>{t('subtotal')}:</span>
              <span>{formatAmount(subtotal)}</span>
            </div>

            {/* Discount Inputs */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600">{t('discount')}:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="%"
                    value={discountPercent || ''}
                    onChange={(e) => {
                      setDiscountPercent(Number(e.target.value));
                      setDiscountAmount(0);
                    }}
                    className="w-12 px-1.5 py-1 text-right text-xs bg-gray-50 border border-gray-200 rounded"
                  />
                  <span>%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>৳</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="BDT"
                    value={discountAmount || ''}
                    onChange={(e) => {
                      setDiscountAmount(Number(e.target.value));
                      setDiscountPercent(0);
                    }}
                    className="w-16 px-1.5 py-1 text-right text-xs bg-gray-50 border border-gray-200 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Total Payable */}
            <div className="flex justify-between items-center text-sm font-bold text-gray-950 pt-2 border-t border-dashed border-gray-200">
              <span>{t('pos_payable')}:</span>
              <span className="text-base text-emerald-700 font-extrabold">{formatAmount(totalPayable)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('pos_paymentMethod')}</label>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                {(['cash', 'bkash', 'nagad', 'card'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 rounded-lg font-bold uppercase transition-colors cursor-pointer text-center ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount & Change / Due */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('pos_paidAmount')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-gray-300 rounded-lg text-right"
                />
              </div>

              <div className="text-right flex flex-col justify-end">
                {paymentSplits.change > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase">{t('change')}:</span>
                    <p className="text-sm font-bold text-emerald-600">{formatAmount(paymentSplits.change)}</p>
                  </div>
                )}
                {paymentSplits.due > 0 && (
                  <div>
                    <span className="text-[10px] text-rose-500 uppercase font-bold">{t('due')}:</span>
                    <p className="text-sm font-bold text-rose-600">{formatAmount(paymentSplits.due)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('pos_completeSale')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
    </div>
  );
};
