import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { InventoryBatch } from '../types/pharmacy';
import {
  Boxes,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Edit,
  CheckCircle2,
  X,
} from 'lucide-react';
import { isBatchExpired } from '../utils/calculations';

export const InventoryView: React.FC = () => {
  const {
    batches,
    medicines,
    store,
    adjustBatchStock,
    addBatch,
    suppliers,
    formatAmount,
    formatNum,
    language,
    t,
  } = usePharmacy();

  const isBn = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'low' | 'expiring' | 'expired'>('all');
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Stock count correction');
  const [adjustAction, setAdjustAction] = useState<'adjustment' | 'quarantine' | 'damage'>('adjustment');

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newMedicineId, setNewMedicineId] = useState(medicines[0]?.id || '');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('2028-12-31');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newCost, setNewCost] = useState(5.0);

  const nowTime = new Date().getTime();
  const alertDaysMs = store.expiryAlertDays * 24 * 60 * 60 * 1000;

  // Enriched batches with medicine details
  const enrichedBatches = useMemo(() => {
    return batches.map((b) => {
      const med = medicines.find((m) => m.id === b.medicineId);
      const expTime = new Date(b.expiryDate).getTime();
      const isExpired = b.status === 'expired' || expTime < nowTime;
      const isExpiringSoon = !isExpired && b.status === 'active' && expTime - nowTime <= alertDaysMs;
      const daysLeft = Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24));

      return {
        ...b,
        medicine: med,
        isExpired,
        isExpiringSoon,
        daysLeft,
      };
    });
  }, [batches, medicines, nowTime, alertDaysMs]);

  // Filtered
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return enrichedBatches.filter((b) => {
      const matchSearch =
        !q ||
        b.batchNumber.toLowerCase().includes(q) ||
        (b.medicine && b.medicine.brandName.toLowerCase().includes(q)) ||
        (b.medicine && b.medicine.genericName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterTab === 'low') {
        return b.status === 'active' && b.remainingQuantity <= (b.medicine?.minStockAlert || 20);
      }
      if (filterTab === 'expiring') {
        return b.isExpiringSoon;
      }
      if (filterTab === 'expired') {
        return b.isExpired || b.status === 'quarantined';
      }
      return true;
    });
  }, [enrichedBatches, searchTerm, filterTab]);

  const openAdjust = (batch: InventoryBatch) => {
    setSelectedBatch(batch);
    setAdjustQty(batch.remainingQuantity);
    setAdjustReason('Physical stock recount');
    setAdjustAction('adjustment');
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    adjustBatchStock(selectedBatch.id, adjustQty, adjustReason, adjustAction);
    setShowAdjustModal(false);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicineId || !newBatchNumber.trim()) return;

    addBatch({
      medicineId: newMedicineId,
      batchNumber: newBatchNumber,
      purchaseDate: new Date().toISOString().slice(0, 10),
      expiryDate: newExpiryDate,
      quantityReceived: newQuantity,
      remainingQuantity: newQuantity,
      purchaseCost: newCost,
      sellingPrice: 0,
      supplierId: suppliers[0]?.id || 'supp-square',
      status: isBatchExpired(newExpiryDate) ? 'expired' : 'active',
    });

    setShowAddBatchModal(false);
    setNewBatchNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_inventory')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(batches.length)} {isBn ? 'টি ব্যাচ নিবন্ধিত' : 'inventory batches tracked'} • FEFO Engine Active
          </p>
        </div>

        <button
          onClick={() => setShowAddBatchModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন ব্যাচ যুক্ত করুন' : 'Add Stock Batch'}</span>
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isBn ? 'সকল ব্যাচ' : 'All Batches'} ({formatNum(enrichedBatches.length)})
          </button>
          <button
            onClick={() => setFilterTab('low')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'low' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {t('dash_lowStock')}
          </button>
          <button
            onClick={() => setFilterTab('expiring')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'expiring' ? 'bg-orange-600 text-white shadow-xs' : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            {t('dash_approachingExpiry')}
          </button>
          <button
            onClick={() => setFilterTab('expired')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterTab === 'expired' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            {t('dash_expiredStock')}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={isBn ? 'ব্যাচ নং বা ওষুধ খুঁজুন...' : 'Search batch or drug...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{t('batch_number')}</th>
                <th className="py-3 px-4">{t('med_brandName')}</th>
                <th className="py-3 px-4">{t('batch_expiryDate')}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'মেয়াদ বাকি' : 'Days Left'}</th>
                <th className="py-3 px-4 text-right">{t('batch_remainingQty')}</th>
                <th className="py-3 px-4 text-right">{t('med_purchasePrice')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    {isBn ? 'কোনো ব্যাচ পাওয়া যায়নি।' : 'No batches match filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{b.batchNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900">{b.medicine?.brandName || 'Medicine'}</span>
                      <span className="text-gray-500 block text-[11px]">{b.medicine?.strength} • {b.medicine?.genericName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.expiryDate}</td>
                    <td className="py-3 px-4 text-center">
                      {b.isExpired ? (
                        <span className="font-bold text-rose-600 text-[11px]">
                          {isBn ? 'মেয়াদ শেষ!' : 'Expired'}
                        </span>
                      ) : (
                        <span
                          className={`font-semibold text-[11px] ${
                            b.isExpiringSoon ? 'text-orange-600' : 'text-gray-600'
                          }`}
                        >
                          {formatNum(b.daysLeft)} {isBn ? 'দিন' : 'days'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {formatNum(b.remainingQuantity)} {isBn ? 'পিস' : 'pcs'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatAmount(b.purchaseCost)}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.isExpired
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : b.status === 'quarantined'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : b.isExpiringSoon
                            ? 'bg-orange-100 text-orange-900 border border-orange-300'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAdjust(b)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        {t('batch_adjustStock')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust / Quarantine Modal */}
      {showAdjustModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
            <button onClick={() => setShowAdjustModal(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-gray-900 mb-1">{t('batch_adjustStock')}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Batch: <span className="font-mono font-bold text-gray-800">{selectedBatch.batchNumber}</span>
            </p>

            <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{isBn ? 'অ্যাকশন ধরন' : 'Action Type'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('adjustment')}
                    className={`py-1.5 rounded-lg font-bold text-center ${
                      adjustAction === 'adjustment' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isBn ? 'সমন্বয়' : 'Adjust'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('quarantine')}
                    className={`py-1.5 rounded-lg font-bold text-center ${
                      adjustAction === 'quarantine' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isBn ? 'কোয়ারেন্টাইন' : 'Quarantine'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('damage')}
                    className={`py-1.5 rounded-lg font-bold text-center ${
                      adjustAction === 'damage' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isBn ? 'ভাঙা / ক্ষতি' : 'Damaged'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{isBn ? 'নতুন অবশিষ্ট স্টক' : 'New Remaining Stock'} *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('batch_adjustReason')} *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Broken strips during handling, Physical count recount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
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

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
            <button onClick={() => setShowAddBatchModal(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-gray-900 mb-4">{isBn ? 'নতুন ব্যাচ যুক্ত করুন' : 'Add New Inventory Batch'}</h3>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('med_brandName')} *</label>
                <select
                  value={newMedicineId}
                  onChange={(e) => setNewMedicineId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brandName} ({m.strength}) - {m.manufacturer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('batch_number')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SQ-2027-B9"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('batch_expiryDate')} *</label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('quantity')} *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('med_purchasePrice')} (৳) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
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
