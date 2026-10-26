import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Search,
  Mic,
  Camera,
  Bell,
  Globe,
  UserCheck,
  Shield,
  LogIn,
  LogOut,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { UserRole } from '../../types/pharmacy';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenVoiceModal: () => void;
  onOpenScannerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenVoiceModal,
  onOpenScannerModal,
}) => {
  const {
    language,
    setLanguage,
    t,
    store,
    currentRole,
    setCurrentRole,
    currentUser,
    firebaseUser,
    loginWithGoogle,
    logout,
    notifications,
    markNotificationRead,
    setActiveView,
    activeView,
    isFirebaseConnected,
  } = usePharmacy();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roles: { role: UserRole; label: string }[] = [
    { role: 'owner', label: t('role_owner') },
    { role: 'manager', label: t('role_manager') },
    { role: 'pharmacist', label: t('role_pharmacist') },
    { role: 'cashier', label: t('role_cashier') },
    { role: 'inventory', label: t('role_inventory') },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveView('medicines');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-emerald-100 shadow-xs">
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 rounded-lg lg:hidden hover:bg-emerald-50 focus:outline-hidden"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="flex items-center justify-center w-10 h-10 text-white rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-sm shadow-emerald-200">
              <span className="font-bold text-xl tracking-tight">M+</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-emerald-950 tracking-tight">
                  {language === 'bn' ? 'মেডিইজি' : 'MediEasy'}
                </span>
                <span className="hidden md:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {language === 'bn' ? 'ফার্মেসি ও পিওএস' : 'Pharmacy OS'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-xs font-medium">
                {store.name} • {store.drugLicenseNo}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Medicine Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-12 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-2 py-0.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
            >
              {language === 'bn' ? 'খুঁজুন' : 'Search'}
            </button>
          </form>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-emerald-200 bg-emerald-50/60">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                language === 'bn'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-900 hover:text-emerald-700'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-900 hover:text-emerald-700'
              }`}
            >
              EN
            </button>
          </div>

          {/* Voice Search Button */}
          <button
            onClick={onOpenVoiceModal}
            title={t('voiceSearch')}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">{t('voiceSearch')}</span>
          </button>

          {/* AI Invoice Scanner Button */}
          <button
            onClick={onOpenScannerModal}
            title={t('scanInvoice')}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-teal-600" />
            <span className="hidden lg:inline">{t('scanInvoice')}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold text-sm text-emerald-950">{t('notifications')}</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold bg-emerald-200 text-emerald-900 rounded-full">
                        {unreadCount} {language === 'bn' ? 'নতুন' : 'new'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setActiveView('notifications');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-emerald-700 hover:underline font-medium"
                  >
                    {language === 'bn' ? 'সব দেখুন' : 'View all'}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      {language === 'bn' ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No notifications'}
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                          !n.isRead ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === 'low_stock' && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                          {n.type === 'expiry_warning' && <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />}
                          {n.type === 'expired' && <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
                          {n.type === 'system' && <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />}
                          <div>
                            <p className="font-semibold text-gray-900">{n.title}</p>
                            <p className="text-gray-600 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role & Auth Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-lg border border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-gray-900 leading-tight">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] font-medium text-emerald-700 capitalize flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {t(`role_${currentRole}` as any)}
                </div>
              </div>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 text-xs">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">{currentUser.displayName}</p>
                  <p className="text-gray-500 text-[11px]">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {isFirebaseConnected ? 'Cloud Firestore Online' : 'Local Offline Persistent'}
                  </div>
                </div>

                <div className="py-2">
                  <div className="px-3 py-1 font-semibold text-[11px] text-gray-400 uppercase tracking-wider">
                    {t('switchRole')}
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setCurrentRole(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-md flex items-center justify-between ${
                        currentRole === r.role
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{r.label}</span>
                      {currentRole === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  {firebaseUser ? (
                    <button
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('signOut')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        loginWithGoogle();
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md font-medium"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {t('signInWithGoogle')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
