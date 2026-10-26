import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { computeAccountingSummary } from '../utils/calculations';

export const ReportsView: React.FC = () => {
  const { sales, expenses, batches, medicines, formatAmount, formatNum, language, t } = usePharmacy();
  const isBn = language === 'bn';

  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');

  // Compute accounting statement
  const statement = useMemo(() => {
    let grossSales = 0;
    let discounts = 0;
    let cogs = 0;

    sales.forEach((s) => {
      if (s.status === 'completed') {
        grossSales += s.subtotal;
        discounts += s.discount;
        cogs += s.cogs || 0;
      }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const summary = computeAccountingSummary({
      grossSales,
      discounts,
      refunds: 0,
      cogs,
      expenses: totalExpenses,
    });

    return {
      grossSales,
      discounts,
      netSales: summary.netSales,
      cogs,
      grossProfit: summary.grossProfit,
      expenses: totalExpenses,
      netProfit: summary.netOperatingProfit,
      margin: summary.profitMarginPercent,
    };
  }, [sales, expenses]);

  // Top selling medicines
  const topSelling = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) => {
      if (s.status === 'completed') {
        s.items.forEach((item) => {
          const current = map.get(item.medicineId) || { name: item.medicineName, qty: 0, revenue: 0 };
          current.qty += item.quantity;
          current.revenue += item.lineTotal;
          map.set(item.medicineId, current);
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  const handleExportCsv = () => {
    const headers = ['Metric,Amount (BDT)'];
    const rows = [
      `"Gross Sales",${statement.grossSales}`,
      `"Discounts",${statement.discounts}`,
      `"Net Sales",${statement.netSales}`,
      `"Cost of Goods Sold (COGS)",${statement.cogs}`,
      `"Gross Profit",${statement.grossProfit}`,
      `"Total Operating Expenses",${statement.expenses}`,
      `"Net Operating Profit",${statement.netProfit}`,
      `"Profit Margin (%)",${statement.margin}%`,
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medieasy_profit_loss_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_reports')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn ? 'লাভ-ক্ষতি বিবরণী, বিক্রয় বিশ্লেষণ এবং ওষুধ পারফরম্যান্স' : 'Profit & Loss Statement, sales analytics, and item velocity'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>

      {/* Profit & Loss Statement Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-gray-900">
              {isBn ? 'লাভ ও ক্ষতি হিসাব বিবরণী (Profit & Loss Statement)' : 'Income & Profit Statement'}
            </h3>
            <p className="text-xs text-gray-500">BD Pharmacy Financial Standard</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full">
            {isBn ? 'মার্জিন: ' : 'Net Margin: '} {formatNum(statement.margin)}%
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">{isBn ? '১. মোট বিক্রয় (Gross Sales)' : '1. Gross Revenue (Total Sales)'}</span>
            <span className="font-bold text-gray-900">{formatAmount(statement.grossSales)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 text-rose-600">
            <span>{isBn ? '২. বাদ: ডিসকাউন্ট ও রিফান্ড (Discounts)' : '2. Less: Order Discounts & Refunds'}</span>
            <span>-{formatAmount(statement.discounts)}</span>
          </div>

          <div className="flex justify-between py-2.5 bg-gray-50 px-3 rounded-lg font-bold text-gray-900">
            <span>{isBn ? '৩. প্রকৃত বিক্রয় (Net Sales = ১ - ২)' : '3. Net Sales Revenue (1 - 2)'}</span>
            <span className="text-emerald-800 text-sm">{formatAmount(statement.netSales)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
            <span>{isBn ? '৪. বিক্রিত পণ্যের ক্রয়মূল্য (COGS)' : '4. Cost of Goods Sold (Purchase Cost)'}</span>
            <span>-{formatAmount(statement.cogs)}</span>
          </div>

          <div className="flex justify-between py-2.5 bg-teal-50/70 px-3 rounded-lg font-bold text-teal-950">
            <span>{isBn ? '৫. মোট মুনাফা / লাভ (Gross Profit = ৩ - ৪)' : '5. Gross Profit (3 - 4)'}</span>
            <span className="text-teal-800 text-sm">{formatAmount(statement.grossProfit)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 text-amber-700">
            <span>{isBn ? '৬. পরিচালন ব্যয় (Operating Expenses - ভাড়া, বিদ্যুৎ, বেতন)' : '6. Operating Expenses (Rent, Utilities, Staff)'}</span>
            <span>-{formatAmount(statement.expenses)}</span>
          </div>

          <div className="flex justify-between py-3.5 bg-emerald-600 text-white px-4 rounded-xl font-extrabold text-sm shadow-xs">
            <span>{isBn ? '৭. নীট পরিচালনা মুনাফা (Net Operating Profit = ৫ - ৬)' : '7. Net Operating Profit (5 - 6)'}</span>
            <span className="text-base">{formatAmount(statement.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Top Selling Medicines */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-base text-gray-900">
            {isBn ? 'সর্বাধিক বিক্রিত ওষুধসমূহ (Top Selling Medicines)' : 'Top Selling Medicines by Revenue'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'ওষুধের নাম' : 'Medicine'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'বিক্রিত পরিমাণ' : 'Quantity Sold'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মোট বিক্রয় আয়' : 'Total Revenue'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topSelling.map((med, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">{med.name}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-800">
                    {formatNum(med.qty)} {isBn ? 'পিস' : 'pcs'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatAmount(med.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
