import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Clock,
  Boxes,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Sparkles,
  Receipt,
  FileText,
  Calendar,
} from 'lucide-react';
import { computeAccountingSummary } from '../utils/calculations';

export const DashboardView: React.FC = () => {
  const {
    sales,
    batches,
    medicines,
    purchases,
    expenses,
    customers,
    suppliers,
    formatAmount,
    formatNum,
    language,
    t,
    setActiveView,
    store,
  } = usePharmacy();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('today');

  const isBn = language === 'bn';

  // Compute date-filtered sales & expenses
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchesDate = (isoString: string) => {
      const datePart = isoString.slice(0, 10);
      const d = new Date(isoString);
      if (dateFilter === 'today') return datePart === todayStr;
      if (dateFilter === 'yesterday') return datePart === yesterdayStr;
      if (dateFilter === '7days') return d >= sevenDaysAgo;
      if (dateFilter === '30days') return d >= thirtyDaysAgo;
      return true;
    };

    const periodSales = sales.filter((s) => matchesDate(s.createdAt) && s.status === 'completed');
    const periodExpenses = expenses.filter((e) => matchesDate(e.date || e.createdAt));

    let grossSales = 0;
    let discounts = 0;
    let cogs = 0;

    periodSales.forEach((s) => {
      grossSales += s.subtotal;
      discounts += s.discount;
      cogs += s.cogs || 0;
    });

    const totalExpenseAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const accounting = computeAccountingSummary({
      grossSales,
      discounts,
      refunds: 0,
      cogs,
      expenses: totalExpenseAmount,
    });

    return {
      periodSales,
      periodExpenses,
      grossSales,
      discounts,
      netSales: accounting.netSales,
      cogs,
      grossProfit: accounting.grossProfit,
      expenses: totalExpenseAmount,
      netProfit: accounting.netOperatingProfit,
      salesCount: periodSales.length,
    };
  }, [sales, expenses, dateFilter]);

  // Inventory value at purchase cost
  const totalInventoryCost = useMemo(() => {
    return batches
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + b.remainingQuantity * b.purchaseCost, 0);
  }, [batches]);

  // Alert counts
  const lowStockCount = useMemo(() => {
    return medicines.filter((m) => {
      const stock = batches
        .filter((b) => b.medicineId === m.id && b.status === 'active')
        .reduce((sum, b) => sum + b.remainingQuantity, 0);
      return stock <= m.minStockAlert;
    }).length;
  }, [medicines, batches]);

  const nowTime = new Date().getTime();
  const alertDaysMs = store.expiryAlertDays * 24 * 60 * 60 * 1000;

  const expiringCount = useMemo(() => {
    return batches.filter((b) => {
      if (b.status !== 'active') return false;
      const expTime = new Date(b.expiryDate).getTime();
      return expTime > nowTime && expTime - nowTime <= alertDaysMs;
    }).length;
  }, [batches, nowTime, alertDaysMs]);

  const expiredCount = useMemo(() => {
    return batches.filter((b) => {
      const expTime = new Date(b.expiryDate).getTime();
      return b.status === 'expired' || expTime < nowTime;
    }).length;
  }, [batches, nowTime]);

  const totalCustomerDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
  }, [customers]);

  const totalSupplierPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.currentPayable || 0), 0);
  }, [suppliers]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isBn ? 'ফার্মেসি ব্যবসা ড্যাশবোর্ড' : 'Pharmacy Business Dashboard'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {store.name} • {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === 'today' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('dateFilter_today')}
          </button>
          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === 'yesterday' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('dateFilter_yesterday')}
          </button>
          <button
            onClick={() => setDateFilter('7days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === '7days' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('dateFilter_last7Days')}
          </button>
          <button
            onClick={() => setDateFilter('30days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === '30days' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('dateFilter_last30Days')}
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('all')}
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dash_netSales')}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 tracking-tight">{formatAmount(filteredData.netSales)}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
              <span>{isBn ? 'মোট বিক্রয়:' : 'Gross:'} {formatAmount(filteredData.grossSales)}</span>
              {filteredData.discounts > 0 && (
                <span className="text-rose-500 font-semibold">(-{formatAmount(filteredData.discounts)})</span>
              )}
            </div>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dash_grossProfit')}</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-teal-700 tracking-tight">{formatAmount(filteredData.grossProfit)}</div>
            <div className="mt-1 text-xs text-gray-500 font-medium">
              {isBn ? 'ওষুধ ক্রয় খরচ (COGS):' : 'Cost of Goods:'} {formatAmount(filteredData.cogs)}
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dash_expenses')}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-800 tracking-tight">{formatAmount(filteredData.expenses)}</div>
            <div className="mt-1 text-xs text-gray-500 font-medium">
              {formatNum(filteredData.periodExpenses.length)} {isBn ? 'টি খরচ এন্ট্রি' : 'expense entries'}
            </div>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm shadow-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{t('dash_netProfit')}</span>
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight">{formatAmount(filteredData.netProfit)}</div>
            <div className="mt-1 text-xs text-emerald-100 font-medium">
              {filteredData.netSales > 0
                ? `${formatNum(((filteredData.netProfit / filteredData.netSales) * 100).toFixed(1))}% ${isBn ? 'মুনাফার মার্জিন' : 'Profit Margin'}`
                : isBn ? 'লাভের অনুপাত' : 'Operating Net'}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total inventory cost */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-left">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">{t('dash_inventoryValue')}</span>
          <span className="text-base font-bold text-gray-900 mt-1 block">{formatAmount(totalInventoryCost)}</span>
          <span className="text-[10px] text-gray-400 block">{formatNum(batches.length)} {isBn ? 'টি ব্যাচ' : 'batches'}</span>
        </div>

        {/* Low stock alerts */}
        <div
          onClick={() => setActiveView('inventory')}
          className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-semibold uppercase">{t('dash_lowStock')}</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-base font-bold text-amber-900 block">{formatNum(lowStockCount)}</span>
          <span className="text-[10px] text-amber-700 block">{isBn ? 'রিঅর্ডার জরুরি' : 'Reorder needed'}</span>
        </div>

        {/* Approaching Expiry */}
        <div
          onClick={() => setActiveView('inventory')}
          className="bg-white p-4 rounded-xl border border-orange-200 hover:border-orange-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-orange-600 mb-1">
            <span className="text-[11px] font-semibold uppercase">{t('dash_approachingExpiry')}</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-base font-bold text-orange-900 block">{formatNum(expiringCount)}</span>
          <span className="text-[10px] text-orange-700 block">{isBn ? 'FEFO বিক্রয় করুন' : 'Push via FEFO'}</span>
        </div>

        {/* Expired Stock */}
        <div
          onClick={() => setActiveView('returns')}
          className="bg-white p-4 rounded-xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-semibold uppercase">{t('dash_expiredStock')}</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-base font-bold text-rose-900 block">{formatNum(expiredCount)}</span>
          <span className="text-[10px] text-rose-700 block">{isBn ? 'কোয়ারেন্টাইন আবশ্যক' : 'Quarantine stock'}</span>
        </div>

        {/* Customer Dues */}
        <div
          onClick={() => setActiveView('accounts')}
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">{t('dash_customerDues')}</span>
          <span className="text-base font-bold text-rose-600 mt-1 block">{formatAmount(totalCustomerDues)}</span>
          <span className="text-[10px] text-gray-400 block">{isBn ? 'আদায়যোগ্য বাকি' : 'Receivables'}</span>
        </div>

        {/* Supplier Payables */}
        <div
          onClick={() => setActiveView('accounts')}
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">{t('dash_supplierPayables')}</span>
          <span className="text-base font-bold text-gray-900 mt-1 block">{formatAmount(totalSupplierPayables)}</span>
          <span className="text-[10px] text-gray-400 block">{isBn ? 'কোম্পানিকে প্রদেয়' : 'Payables'}</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100">
        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3">
          {t('dash_quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveView('pos')}
            className="flex items-center gap-2.5 p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isBn ? 'নতুন বিক্রয় (POS)' : 'New POS Sale'}</span>
          </button>
          <button
            onClick={() => setActiveView('purchases')}
            className="flex items-center gap-2.5 p-3.5 bg-white hover:bg-emerald-50 text-gray-800 border border-emerald-200 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? 'ক্রয় চালান এন্ট্রি' : 'Receive Purchase'}</span>
          </button>
          <button
            onClick={() => setActiveView('medicines')}
            className="flex items-center gap-2.5 p-3.5 bg-white hover:bg-emerald-50 text-gray-800 border border-emerald-200 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? 'নতুন ওষুধ নিবন্ধন' : 'Register Medicine'}</span>
          </button>
          <button
            onClick={() => setActiveView('aiAssistant')}
            className="flex items-center gap-2.5 p-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>{isBn ? 'এআই বিজনেস পরামর্শ' : 'Ask AI Business Bot'}</span>
          </button>
        </div>
      </div>

      {/* Recent Sales & Purchases Split Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">{t('dash_recentSales')}</h3>
            <button
              onClick={() => setActiveView('salesHistory')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {isBn ? 'সব বিক্রয় দেখুন' : 'View all'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-4">{isBn ? 'রসিদ' : 'Receipt'}</th>
                  <th className="py-2.5 px-4">{isBn ? 'ক্রেতা' : 'Customer'}</th>
                  <th className="py-2.5 px-4">{isBn ? 'পেমেন্ট' : 'Method'}</th>
                  <th className="py-2.5 px-4 text-right">{isBn ? 'প্রদেয়' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-semibold text-emerald-800">{sale.receiptNo}</td>
                    <td className="py-2.5 px-4 text-gray-700 truncate max-w-[120px]">{sale.customerName}</td>
                    <td className="py-2.5 px-4 uppercase text-gray-500">{sale.paymentMethod}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">{formatAmount(sale.totalPayable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">{t('dash_recentPurchases')}</h3>
            <button
              onClick={() => setActiveView('purchases')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {isBn ? 'সব ক্রয় দেখুন' : 'View all'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-4">{isBn ? 'চালান নং' : 'Invoice'}</th>
                  <th className="py-2.5 px-4">{isBn ? 'কোম্পানি' : 'Supplier'}</th>
                  <th className="py-2.5 px-4">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-2.5 px-4 text-right">{isBn ? 'চালান মূল্য' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.slice(0, 5).map((pur) => (
                  <tr key={pur.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-semibold text-teal-800">{pur.invoiceNo}</td>
                    <td className="py-2.5 px-4 text-gray-700 truncate max-w-[120px]">{pur.supplierName}</td>
                    <td className="py-2.5 px-4 text-gray-500">{pur.purchaseDate}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">{formatAmount(pur.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
