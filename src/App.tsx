import React, { useState } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { VoiceCommandModal } from './components/common/VoiceCommandModal';
import { InvoiceScannerModal } from './components/common/InvoiceScannerModal';

// Views
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { MedicinesView } from './views/MedicinesView';
import { InventoryView } from './views/InventoryView';
import { PurchasesView } from './views/PurchasesView';
import { SuppliersView } from './views/SuppliersView';
import { CustomersView } from './views/CustomersView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { ReturnsView } from './views/ReturnsView';
import { ExpensesView } from './views/ExpensesView';
import { AccountsView } from './views/AccountsView';
import { ReportsView } from './views/ReportsView';
import { AIAssistantView } from './views/AIAssistantView';
import { StaffView } from './views/StaffView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeView } = usePharmacy();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosView />;
      case 'medicines':
        return <MedicinesView />;
      case 'inventory':
        return <InventoryView />;
      case 'purchases':
        return <PurchasesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'customers':
        return <CustomersView />;
      case 'salesHistory':
        return <SalesHistoryView />;
      case 'returns':
        return <ReturnsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'accounts':
        return <AccountsView />;
      case 'reports':
        return <ReportsView />;
      case 'aiAssistant':
        return <AIAssistantView />;
      case 'staff':
        return <StaffView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenVoiceModal={() => setVoiceModalOpen(true)}
          onOpenScannerModal={() => setScannerModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderView()}
        </main>
      </div>

      {/* Modals */}
      <VoiceCommandModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
      <InvoiceScannerModal isOpen={scannerModalOpen} onClose={() => setScannerModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <MainLayout />
    </PharmacyProvider>
  );
}
