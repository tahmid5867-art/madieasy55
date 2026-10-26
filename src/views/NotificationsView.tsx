import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Bell, AlertTriangle, Clock, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationRead, clearAllNotifications, language, t, formatNum } = usePharmacy();
  const isBn = language === 'bn';

  const [filter, setFilter] = useState<'all' | 'unread' | 'stock' | 'expiry'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'stock') return n.type === 'low_stock';
    if (filter === 'expiry') return n.type === 'expiry_warning' || n.type === 'expired';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('nav_notifications')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatNum(notifications.filter((n) => !n.isRead).length)} {isBn ? 'টি অপঠিত সতর্কতা ও অ্যালার্ট' : 'unread smart notifications and alerts'}
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isBn ? 'সব মুছুন' : 'Clear All'}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isBn ? 'সকল বিজ্ঞপ্তি' : 'All'} ({formatNum(notifications.length)})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === 'unread' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isBn ? 'অপঠিত' : 'Unread'} ({formatNum(notifications.filter((n) => !n.isRead).length)})
        </button>
        <button
          onClick={() => setFilter('stock')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === 'stock' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
          }`}
        >
          {t('dash_lowStock')}
        </button>
        <button
          onClick={() => setFilter('expiry')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === 'expiry' ? 'bg-orange-600 text-white shadow-xs' : 'bg-orange-50 text-orange-900 hover:bg-orange-100'
          }`}
        >
          {t('dash_approachingExpiry')} / Expired
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>{isBn ? 'কোনো নতুন বিজ্ঞপ্তি নেই।' : 'No notifications found.'}</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                !n.isRead ? 'bg-emerald-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {n.type === 'low_stock' && (
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === 'expiry_warning' && (
                    <div className="p-2 rounded-xl bg-orange-100 text-orange-800">
                      <Clock className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === 'expired' && (
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === 'system' && (
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-gray-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
