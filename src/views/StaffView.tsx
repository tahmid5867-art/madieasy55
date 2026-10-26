import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { ShieldCheck, UserCheck, Shield, Key, History, Plus, X } from 'lucide-react';
import { UserRole } from '../types/pharmacy';

export const StaffView: React.FC = () => {
  const { currentRole, setCurrentRole, auditLogs, language, t, formatNum } = usePharmacy();
  const isBn = language === 'bn';

  const [staffList, setStaffList] = useState([
    {
      id: 'staff-01',
      name: 'Dr. Shahriar (Owner)',
      email: 'owner@medieasy.pharmacy',
      role: 'owner' as UserRole,
      phone: '01711-000001',
    },
    {
      id: 'staff-02',
      name: 'Kazi Moinul Islam',
      email: 'manager@medieasy.pharmacy',
      role: 'manager' as UserRole,
      phone: '01812-000002',
    },
    {
      id: 'staff-03',
      name: 'Salma Akhter (B.Pharm)',
      email: 'pharmacist@medieasy.pharmacy',
      role: 'pharmacist' as UserRole,
      phone: '01913-000003',
    },
    {
      id: 'staff-04',
      name: 'Tanveer Ahmed',
      email: 'cashier@medieasy.pharmacy',
      role: 'cashier' as UserRole,
      phone: '01714-000004',
    },
    {
      id: 'staff-05',
      name: 'Biplob Mia',
      email: 'inventory@medieasy.pharmacy',
      role: 'inventory' as UserRole,
      phone: '01615-000005',
    },
  ]);

  const permissionMatrix = [
    { module: 'Dashboard & KPIs', owner: true, manager: true, pharmacist: true, cashier: true, inventory: true },
    { module: 'Point of Sale (POS)', owner: true, manager: true, pharmacist: true, cashier: true, inventory: false },
    { module: 'Medicine Catalog', owner: true, manager: true, pharmacist: true, cashier: false, inventory: true },
    { module: 'Inventory Batches & FEFO', owner: true, manager: true, pharmacist: true, cashier: false, inventory: true },
    { module: 'Stock Procurement & Purchases', owner: true, manager: true, pharmacist: false, cashier: false, inventory: true },
    { module: 'Customers & Due Collection', owner: true, manager: true, pharmacist: true, cashier: true, inventory: false },
    { module: 'Expenses & Accounting', owner: true, manager: true, pharmacist: false, cashier: false, inventory: false },
    { module: 'Financial & Profit Reports', owner: true, manager: true, pharmacist: false, cashier: false, inventory: false },
    { module: 'Store Settings & Backup', owner: true, manager: false, pharmacist: false, cashier: false, inventory: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_staff')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn ? 'স্টাফ অ্যাকাউন্ট, রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) এবং অডিট লগ' : 'Staff profiles, Role-Based Access Control (RBAC), and security audit logs'}
          </p>
        </div>
      </div>

      {/* Staff Members List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
          <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
            {isBn ? 'ফার্মেসি স্টাফ ও ব্যবহারকারী' : 'Pharmacy Staff Members'}
          </span>
          <span className="text-xs font-semibold text-emerald-800">
            {isBn ? 'বর্তমান সক্রিয় রোল: ' : 'Your Active Role: '} <strong className="uppercase">{currentRole}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'নাম' : 'Name'}</th>
                <th className="py-3 px-4">{isBn ? 'ইমেইল' : 'Email'}</th>
                <th className="py-3 px-4">{isBn ? 'ফোন' : 'Phone'}</th>
                <th className="py-3 px-4">{isBn ? 'রোল' : 'Role'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'সুইচ করুন' : 'Test as Role'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-4 font-bold text-gray-900">{st.name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">{st.email}</td>
                  <td className="py-3 px-4 text-gray-500">{st.phone}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {st.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setCurrentRole(st.role)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        currentRole === st.role
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {currentRole === st.role ? (isBn ? 'সক্রিয়' : 'Active') : isBn ? 'সুইচ' : 'Switch'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-sm text-gray-900">
            {isBn ? 'রোল পারমিশন ম্যাট্রিক্স (RBAC Matrix)' : 'Role-Based Access Control (RBAC) Matrix'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100/70 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'মডিউল' : 'Module'}</th>
                <th className="py-3 px-4 text-center">Owner</th>
                <th className="py-3 px-4 text-center">Manager</th>
                <th className="py-3 px-4 text-center">Pharmacist</th>
                <th className="py-3 px-4 text-center">Cashier</th>
                <th className="py-3 px-4 text-center">Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permissionMatrix.map((pm, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-semibold text-gray-800">{pm.module}</td>
                  <td className="py-2.5 px-4 text-center">{pm.owner ? '✅' : '❌'}</td>
                  <td className="py-2.5 px-4 text-center">{pm.manager ? '✅' : '❌'}</td>
                  <td className="py-2.5 px-4 text-center">{pm.pharmacist ? '✅' : '❌'}</td>
                  <td className="py-2.5 px-4 text-center">{pm.cashier ? '✅' : '❌'}</td>
                  <td className="py-2.5 px-4 text-center">{pm.inventory ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Trail */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {isBn ? 'নিরাপত্তা ও কার্যক্রম অডিট ট্রেইল' : 'Immutable Security Audit Logs'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {formatNum(auditLogs.length)} {isBn ? 'টি ইভেন্ট' : 'logged events'}
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 text-xs font-mono">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 hover:bg-gray-50 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-emerald-800 uppercase text-[11px] mr-2">[{log.action}]</span>
                <span className="text-gray-800">{log.details}</span>
                <span className="text-gray-400 block text-[10px] mt-0.5">By: {log.actorName}</span>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
