import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Medicine } from '../types/pharmacy';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const MedicinesView: React.FC = () => {
  const {
    medicines,
    batches,
    addMedicine,
    updateMedicine,
    archiveMedicine,
    formatAmount,
    formatNum,
    language,
    t,
    suppliers,
  } = usePharmacy();

  const isBn = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterForm, setFilterForm] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Form State
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [banglaName, setBanglaName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [packUnit, setPackUnit] = useState<'piece' | 'strip' | 'box'>('box');
  const [piecesPerPack, setPiecesPerPack] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(20);
  const [barcode, setBarcode] = useState('');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [storageNotes, setStorageNotes] = useState('');

  const openAddModal = () => {
    setEditingMedicine(null);
    setBrandName('');
    setGenericName('');
    setBanglaName('');
    setManufacturer(suppliers[0]?.company || 'Square Pharmaceuticals Ltd.');
    setStrength('');
    setDosageForm('Tablet');
    setPackUnit('box');
    setPiecesPerPack(100);
    setPurchasePrice(5.0);
    setSellingPrice(7.0);
    setMinStockAlert(20);
    setBarcode(`${Date.now().toString().slice(-8)}`);
    setPrescriptionRequired(false);
    setStorageNotes('');
    setShowModal(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setBrandName(med.brandName);
    setGenericName(med.genericName);
    setBanglaName(med.banglaName || '');
    setManufacturer(med.manufacturer);
    setStrength(med.strength);
    setDosageForm(med.dosageForm);
    setPackUnit(med.packUnit);
    setPiecesPerPack(med.piecesPerPack);
    setPurchasePrice(med.purchasePrice);
    setSellingPrice(med.sellingPrice);
    setMinStockAlert(med.minStockAlert);
    setBarcode(med.barcode);
    setPrescriptionRequired(med.prescriptionRequired);
    setStorageNotes(med.storageNotes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || sellingPrice <= 0) return;

    if (editingMedicine) {
      updateMedicine(editingMedicine.id, {
        brandName,
        genericName,
        banglaName,
        manufacturer,
        strength,
        dosageForm,
        packUnit,
        piecesPerPack,
        purchasePrice,
        sellingPrice,
        minStockAlert,
        barcode,
        prescriptionRequired,
        storageNotes,
      });
    } else {
      addMedicine({
        brandName,
        genericName,
        banglaName,
        manufacturer,
        strength,
        dosageForm,
        packUnit,
        piecesPerPack,
        purchasePrice,
        sellingPrice,
        minStockAlert,
        barcode: barcode || `${Date.now().toString().slice(-8)}`,
        prescriptionRequired,
        storageNotes,
        status: 'active',
      });
    }
    setShowModal(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ID,Brand Name,Generic,Bangla Name,Manufacturer,Strength,Dosage,Purchase Price,Selling Price,Barcode'];
    const rows = medicines.map((m) =>
      `"${m.id}","${m.brandName}","${m.genericName}","${m.banglaName || ''}","${m.manufacturer}","${m.strength}","${m.dosageForm}",${m.purchasePrice},${m.sellingPrice},"${m.barcode}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medieasy_medicines_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered List
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return medicines.filter((m) => {
      const matchSearch =
        !q ||
        m.brandName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        (m.banglaName && m.banglaName.toLowerCase().includes(q)) ||
        m.barcode.includes(q) ||
        m.manufacturer.toLowerCase().includes(q);

      const matchForm = filterForm === 'all' || m.dosageForm.toLowerCase() === filterForm.toLowerCase();
      return matchSearch && matchForm;
    });
  }, [medicines, searchTerm, filterForm]);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_medicines')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(medicines.length)} {isBn ? 'টি ওষুধ নিবন্ধিত রয়েছে' : 'registered medicines in catalog'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('med_addTitle')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200"
          >
            <option value="all">{isBn ? 'সকল ধরন (ডোজ)' : 'All Dosage Forms'}</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Drop">Drop</option>
            <option value="Injection">Injection</option>
            <option value="Chewable Tablet">Chewable Tablet</option>
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{t('med_brandName')}</th>
                <th className="py-3 px-4">{t('med_genericName')}</th>
                <th className="py-3 px-4">{t('med_manufacturer')}</th>
                <th className="py-3 px-4">{t('med_dosageForm')}</th>
                <th className="py-3 px-4 text-right">{t('med_purchasePrice')}</th>
                <th className="py-3 px-4 text-right">{t('med_sellingPrice')}</th>
                <th className="py-3 px-4 text-center">{t('med_availableStock')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    {isBn ? 'কোনো ওষুধ পাওয়া যায়নি।' : 'No medicines found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((med) => {
                  const medBatches = batches.filter(
                    (b) => b.medicineId === med.id && b.status === 'active' && new Date(b.expiryDate).getTime() > Date.now()
                  );
                  const totalStock = medBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);

                  return (
                    <tr key={med.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{med.brandName}</span>
                          <span className="text-gray-500 font-normal">({med.strength})</span>
                          {med.prescriptionRequired && (
                            <span className="text-[10px] font-bold text-rose-600 px-1 border border-rose-200 rounded">
                              Rx
                            </span>
                          )}
                        </div>
                        {med.banglaName && (
                          <span className="text-[11px] text-gray-400 block">{med.banglaName}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{med.genericName}</td>
                      <td className="py-3 px-4 text-gray-500">{med.manufacturer}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                          {med.dosageForm}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatAmount(med.purchasePrice)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatAmount(med.sellingPrice)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            totalStock <= med.minStockAlert
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {formatNum(totalStock)} {isBn ? 'পিস' : 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(med)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => archiveMedicine(med.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
              <h3 className="font-bold text-base">
                {editingMedicine ? (isBn ? 'ওষুধ তথ্য সম্পাদন' : 'Edit Medicine') : t('med_addTitle')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-white/80 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_brandName')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Napa Extra, Seclo 20"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_genericName')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol + Caffeine"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_banglaName')}</label>
                  <input
                    type="text"
                    placeholder="যেমন: নাপা এক্সট্রা"
                    value={banglaName}
                    onChange={(e) => setBanglaName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_manufacturer')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Square Pharmaceuticals Ltd."
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_strength')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 20mg, 100ml"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_dosageForm')}</label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Drop">Drop</option>
                    <option value="Injection">Injection</option>
                    <option value="Chewable Tablet">Chewable Tablet</option>
                    <option value="Ointment">Ointment / Gel</option>
                    <option value="Sachet">Sachet / Powder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_purchasePrice')} (৳) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_sellingPrice')} (৳) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min={0.1}
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_minStockAlert')}</label>
                  <input
                    type="number"
                    min={1}
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('med_barcode')}</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={prescriptionRequired}
                    onChange={(e) => setPrescriptionRequired(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>{t('med_prescriptionRequired')}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
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
