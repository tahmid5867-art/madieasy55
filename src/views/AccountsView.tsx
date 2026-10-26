import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { CreditCard, DollarSign, Users, Truck, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { customers, suppliers, sales, expenses, formatAmount, formatNum, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'dues' | 'payables' | 'reconciliation'>('dues');

  // Total customer dues & supplier payables
  const totalCustomerDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
  }, [customers]);

  const totalSupplierPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.currentPayable || 0), 0);
  }, [suppliers]);

  // Cash reconciliation
  const cashSalesTotal = useMemo(() => {
    return sales
      .filter((s) => s.paymentMethod === 'cash' && s.status === 'completed')
      .reduce((sum, s) => sum + s.paidAmount, 0);
  }, [sales]);

  const cashExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const estimatedCashInDrawer = Math.max(0, cashSalesTotal - cashExpensesTotal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_accounts')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn
              ? 'গ্রাহক বকেয়া লেজার, সরবরাহকারী দেনা এবং দৈনিক ক্যাশ কাউন্টার রিকনসিলিয়েশন'
              : 'Customer credit ledger, supplier payables, and daily cash counter reconciliation'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('dues')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'dues' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isBn ? 'গ্রাহক বকেয়া' : 'Customer Dues'} ({formatAmount(totalCustomerDues)})
          </button>
          <button
            onClick={() => setActiveTab('payables')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'payables' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isBn ? 'কোম্পানি দেনা' : 'Supplier Payables'} ({formatAmount(totalSupplierPayables)})
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'reconciliation' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isBn ? 'দৈনিক ক্যাশ হিসাব' : 'Cash Reconciliation'}
          </button>
        </div>
      </div>

      {/* Tab 1: Customer Dues */}
      {activeTab === 'dues' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
            <span className="font-bold text-xs text-rose-950 uppercase tracking-wider">
              {isBn ? 'গ্রাহকদের কাছে বকেয়া তালিকা' : 'Outstanding Customer Receivables'}
            </span>
            <span className="font-extrabold text-sm text-rose-700">
              {isBn ? 'সর্বমোট বকেয়া: ' : 'Total: '} {formatAmount(totalCustomerDues)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">{t('cust_name')}</th>
                  <th className="py-3 px-4">{t('cust_phone')}</th>
                  <th className="py-3 px-4">{t('cust_address')}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'মোট কেনাকাটা' : 'Total Purchases'}</th>
                  <th className="py-3 px-4 text-right">{t('cust_currentDue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                    <td className="py-3 px-4 text-gray-500">{c.address || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">{formatAmount(c.totalSpent)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${c.currentDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatAmount(c.currentDue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Supplier Payables */}
      {activeTab === 'payables' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center justify-between">
            <span className="font-bold text-xs text-teal-950 uppercase tracking-wider">
              {isBn ? 'কোম্পানি সরবরাহকারীদের বকেয়া পাওনা' : 'Outstanding Supplier Payables'}
            </span>
            <span className="font-extrabold text-sm text-teal-800">
              {isBn ? 'সর্বমোট দেনা: ' : 'Total: '} {formatAmount(totalSupplierPayables)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">{isBn ? 'সরবরাহকারী' : 'Supplier'}</th>
                  <th className="py-3 px-4">{t('supp_company')}</th>
                  <th className="py-3 px-4">{t('cust_phone')}</th>
                  <th className="py-3 px-4">{t('cust_address')}</th>
                  <th className="py-3 px-4 text-right">{t('supp_payable')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{s.name}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-800">{s.company}</td>
                    <td className="py-3 px-4 text-gray-600">{s.phone}</td>
                    <td className="py-3 px-4 text-gray-500">{s.address}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatAmount(s.currentPayable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Cash Register Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              {isBn ? 'ক্যাশ কাউন্টার দৈনিক রিকনসিলিয়েশন' : 'Daily Cash Counter Summary'}
            </h3>
            <p className="text-xs text-gray-500">
              {isBn
                ? 'নগদ বিক্রয় ও নগদ খরচ হিসাব করে কাউন্টারে প্রাপ্তব্য মোট টাকার মিলন'
                : 'Calculates physical cash balance based on recorded cash inflows and outflows'}
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">{isBn ? 'ওপেনিং ক্যাশ ব্যালেন্স:' : 'Opening Cash Balance:'}</span>
                <span className="font-bold text-gray-900">{formatAmount(5000)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-50/70 rounded-xl text-emerald-900">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? '(+) নগদ বিক্রয় প্রাপ্তি:' : '(+) Cash Sales Collected:'}</span>
                </div>
                <span className="font-bold text-emerald-700">{formatAmount(cashSalesTotal)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-rose-50/70 rounded-xl text-rose-900">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <span>{isBn ? '(-) নগদ খরচ প্রদান:' : '(-) Cash Expenses Paid:'}</span>
                </div>
                <span className="font-bold text-rose-600">-{formatAmount(cashExpensesTotal)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm">
                <span>{isBn ? 'কাউন্টারে প্রত্যাশিত নগদ ব্যালেন্স:' : 'Expected Closing Cash in Drawer:'}</span>
                <span className="text-base">{formatAmount(5000 + estimatedCashInDrawer)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-base text-gray-900">{isBn ? 'অ্যাকাউন্টিং নিয়মাবলী' : 'Accounting Standards'}</h3>
            <div className="space-y-2 text-gray-600 leading-relaxed">
              <p>
                • <strong>{isBn ? 'প্রকৃত বিক্রয় (Net Sales):' : 'Net Sales:'}</strong> {isBn ? 'মোট বিক্রয় বিয়োগ ছাড় এবং রিফান্ড' : 'Gross Sales minus Discounts and Customer Refunds.'}
              </p>
              <p>
                • <strong>{isBn ? 'মোট লাভ (Gross Profit):' : 'Gross Profit:'}</strong> {isBn ? 'প্রকৃত বিক্রয় বিয়োগ বিক্রিত ওষুধের ক্রয় মূল্য (COGS)' : 'Net Sales minus Cost of Goods Sold (purchase cost).'}
              </p>
              <p>
                • <strong>{isBn ? 'প্রকৃত মুনাফা (Net Operating Profit):' : 'Net Profit:'}</strong> {isBn ? 'মোট লাভ বিয়োগ দোকান ভাড়া, বিদ্যুৎ ও পরিচালন ব্যয়' : 'Gross Profit minus operating expenses (Rent, Electricity, Salaries, Packaging).'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
