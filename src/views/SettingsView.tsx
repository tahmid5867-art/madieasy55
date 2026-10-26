import React, { useState, useRef } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  Settings,
  Store,
  Shield,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    store,
    updateStoreSettings,
    language,
    setLanguage,
    t,
    resetToDemoData,
    exportDatabaseJson,
    importDatabaseJson,
  } = usePharmacy();

  const isBn = language === 'bn';

  // Form State
  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address);
  const [phone, setPhone] = useState(store.phone);
  const [drugLicenseNo, setDrugLicenseNo] = useState(store.drugLicenseNo);
  const [lowStockThreshold, setLowStockThreshold] = useState(store.lowStockThreshold);
  const [expiryAlertDays, setExpiryAlertDays] = useState(store.expiryAlertDays);
  const [useBanglaNumerals, setUseBanglaNumerals] = useState(store.useBanglaNumerals);
  const [returnPolicy, setReturnPolicy] = useState(store.returnPolicy);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      name,
      address,
      phone,
      drugLicenseNo,
      lowStockThreshold: Number(lowStockThreshold),
      expiryAlertDays: Number(expiryAlertDays),
      useBanglaNumerals,
      returnPolicy,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medieasy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const success = importDatabaseJson(reader.result as string);
      if (success) {
        setRestoreMessage(
          isBn ? 'সফলভাবে ব্যাকআপ থেকে রিস্টোর সম্পন্ন হয়েছে!' : 'Database successfully restored from backup file!'
        );
      } else {
        setRestoreMessage(
          isBn ? 'ত্রুটি: ব্যাকআপ ফাইলটি সঠিক কাঠামোর নয়।' : 'Error: Invalid backup file format.'
        );
      }
      setTimeout(() => setRestoreMessage(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        isBn
          ? 'আপনি কি নিশ্চিত যে ডেমো ডেটা রিসেট করতে চান?'
          : 'Are you sure you want to reset all records to default demo data?'
      )
    ) {
      resetToDemoData();
      setName(store.name);
      setAddress(store.address);
      setPhone(store.phone);
      setDrugLicenseNo(store.drugLicenseNo);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_settings')}</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {isBn
            ? 'ফার্মেসির বিবরণ, ড্রাগ লাইসেন্স, থ্রেশহোল্ড এবং ডেটা ব্যাকআপ রিস্টোর'
            : 'Configure store profile, DGDA drug license, thresholds, and full database backups'}
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isBn ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings successfully saved!'}</span>
        </div>
      )}

      {/* Pharmacy Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Store className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-gray-900">{t('set_pharmacyProfile')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">{t('storeName')} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t('drugLicense')} *</label>
            <input
              type="text"
              required
              value={drugLicenseNo}
              onChange={(e) => setDrugLicenseNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 font-mono font-semibold text-emerald-800"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t('cust_phone')} *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t('cust_address')} *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              {isBn ? 'স্বল্প স্টক সতর্কতা সীমা (পিস)' : 'Low Stock Alert Threshold (pcs)'}
            </label>
            <input
              type="number"
              min={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              {isBn ? 'মেয়াদোত্তীর্ণ সতর্কতা সময়সীমা (দিন)' : 'Expiry Warning Window (days)'}
            </label>
            <input
              type="number"
              min={1}
              value={expiryAlertDays}
              onChange={(e) => setExpiryAlertDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">
              {isBn ? 'রসিদে মুদ্রিত ফেরত নীতি' : 'Return Policy printed on receipts'}
            </label>
            <input
              type="text"
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Localization & Numbers */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
            <input
              type="checkbox"
              checked={useBanglaNumerals}
              onChange={(e) => setUseBanglaNumerals(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span>{t('set_useBanglaNumerals')}</span>
          </label>

          <button
            type="submit"
            className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {t('save')}
          </button>
        </div>
      </form>

      {/* Backup and Restore Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-gray-900">{t('set_backupTitle')}</h3>
        </div>

        {restoreMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold">
            {restoreMessage}
          </div>
        )}

        <p className="text-gray-600 leading-relaxed">
          {isBn
            ? 'আপনার ফার্মেসির সমস্ত ওষুধ, ব্যাচ, বিক্রয়, খরচ, এবং গ্রাহক তথ্য একটি নিরাপদ JSON ফাইলে ব্যাকআপ নিন বা সংরক্ষণ থেকে পুনঃস্থাপন করুন।'
            : 'Download a complete JSON database backup file of all medicines, inventory batches, sales, and accounts, or restore from a previously exported backup file.'}
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('set_downloadBackup')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t('set_restoreBackup')}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileRestore} className="hidden" />

          <button
            onClick={handleResetDemo}
            className="flex items-center gap-2 px-4 py-2.5 font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('set_resetDemo')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
