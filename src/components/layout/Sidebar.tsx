import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Boxes,
  FileText,
  Truck,
  Users,
  History,
  RotateCcw,
  Receipt,
  CreditCard,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Bell,
  Settings,
  X,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../../types/pharmacy';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  labelKey: any;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeView, setActiveView, t, currentRole, batches, notifications, store } = usePharmacy();

  // Low stock & expired count for badges
  const lowStockCount = batches.filter((b) => b.status === 'active' && b.remainingQuantity <= store.lowStockThreshold).length;
  const expiredCount = batches.filter((b) => b.status === 'expired').length;
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      labelKey: 'nav_dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'manager', 'pharmacist', 'cashier', 'inventory'],
    },
    {
      id: 'pos',
      labelKey: 'nav_pos',
      icon: ShoppingCart,
      roles: ['owner', 'manager', 'pharmacist', 'cashier'],
    },
    {
      id: 'medicines',
      labelKey: 'nav_medicines',
      icon: Pill,
      roles: ['owner', 'manager', 'pharmacist', 'inventory'],
    },
    {
      id: 'inventory',
      labelKey: 'nav_inventory',
      icon: Boxes,
      roles: ['owner', 'manager', 'pharmacist', 'inventory'],
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'purchases',
      labelKey: 'nav_purchases',
      icon: FileText,
      roles: ['owner', 'manager', 'inventory'],
    },
    {
      id: 'suppliers',
      labelKey: 'nav_suppliers',
      icon: Truck,
      roles: ['owner', 'manager', 'inventory'],
    },
    {
      id: 'customers',
      labelKey: 'nav_customers',
      icon: Users,
      roles: ['owner', 'manager', 'pharmacist', 'cashier'],
    },
    {
      id: 'salesHistory',
      labelKey: 'nav_salesHistory',
      icon: History,
      roles: ['owner', 'manager', 'pharmacist', 'cashier'],
    },
    {
      id: 'returns',
      labelKey: 'nav_returns',
      icon: RotateCcw,
      roles: ['owner', 'manager', 'pharmacist', 'inventory'],
      badge: expiredCount > 0 ? expiredCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'expenses',
      labelKey: 'nav_expenses',
      icon: Receipt,
      roles: ['owner', 'manager'],
    },
    {
      id: 'accounts',
      labelKey: 'nav_accounts',
      icon: CreditCard,
      roles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'reports',
      labelKey: 'nav_reports',
      icon: BarChart3,
      roles: ['owner', 'manager'],
    },
    {
      id: 'aiAssistant',
      labelKey: 'nav_aiAssistant',
      icon: Sparkles,
      roles: ['owner', 'manager', 'pharmacist'],
      badge: 'Gemini',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'staff',
      labelKey: 'nav_staff',
      icon: ShieldCheck,
      roles: ['owner'],
    },
    {
      id: 'notifications',
      labelKey: 'nav_notifications',
      icon: Bell,
      roles: ['owner', 'manager', 'pharmacist', 'cashier', 'inventory'],
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'settings',
      labelKey: 'nav_settings',
      icon: Settings,
      roles: ['owner', 'manager'],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white text-sm">
              M+
            </div>
            <span className="font-bold text-base text-white">MediEasy</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Title in Desktop Sidebar */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-xs">
            M+
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white tracking-wide truncate">MediEasy</h2>
            <p className="text-[11px] text-emerald-400 font-medium truncate">Bangladesh Pharmacy</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="tracking-wide">{t(item.labelKey)}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      item.badgeColor || 'bg-slate-700 text-slate-200 border-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Quick Status & Drug License info */}
        <div className="p-3 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">DGDA Approved</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[11px] text-slate-200 font-semibold truncate">{store.name}</p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{store.drugLicenseNo}</p>
        </div>
      </aside>
    </>
  );
};
