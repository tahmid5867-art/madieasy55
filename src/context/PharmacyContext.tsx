import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserRole,
  UserProfile,
  StoreSettings,
  Medicine,
  InventoryBatch,
  Sale,
  Purchase,
  Supplier,
  Customer,
  Expense,
  AppNotification,
  AuditLog,
  CartItem,
  ReturnRecord,
} from '../types/pharmacy';
import { Language, translations } from '../data/banglaDictionary';
import {
  INITIAL_STORE,
  INITIAL_MEDICINES,
  INITIAL_BATCHES,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialDemoData';
import {
  allocateBatchesFEFO,
  calculatePaymentSplits,
  formatCurrencyBDT,
  toBanglaNumber,
  isBatchExpired,
} from '../utils/calculations';
import { auth, db, googleProvider, testFirebaseConnection, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';

interface PharmacyContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  formatAmount: (amount: number) => string;
  formatNum: (num: number | string) => string;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;
  firebaseUser: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConnected: boolean;

  // State
  store: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  medicines: Medicine[];
  batches: InventoryBatch[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
  customers: Customer[];
  expenses: Expense[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  activeView: string;
  setActiveView: (view: string) => void;

  // Actions
  addMedicine: (med: Omit<Medicine, 'id' | 'storeId' | 'createdAt'>) => string;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  archiveMedicine: (id: string) => void;
  addBatch: (batch: Omit<InventoryBatch, 'id' | 'storeId' | 'updatedAt'>) => string;
  adjustBatchStock: (
    batchId: string,
    adjustedRemaining: number,
    reason: string,
    actionType: 'quarantine' | 'damage' | 'adjustment'
  ) => void;
  completeSale: (saleData: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    items: CartItem[];
    discount: number;
    paidAmount: number;
    paymentMethod: 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'due' | 'split';
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
  recordSupplierPurchase: (purchaseData: {
    invoiceNo: string;
    supplierId: string;
    supplierName: string;
    purchaseDate: string;
    items: {
      medicineId: string;
      medicineName: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
    }[];
    discount: number;
    paidAmount: number;
  }) => void;
  collectCustomerDue: (customerId: string, amount: number, paymentMethod: string, note?: string) => void;
  paySupplierDue: (supplierId: string, amount: number, paymentMethod: string, note?: string) => void;
  recordExpense: (expense: Omit<Expense, 'id' | 'storeId' | 'createdAt'>) => void;
  recordReturn: (returnRecord: Omit<ReturnRecord, 'id' | 'storeId' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDemoData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'medieasy_v1_';

function loadStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => loadStored('lang', 'bn'));
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // Core business collections initialized with persistent or initial demo data
  const [store, setStore] = useState<StoreSettings>(() => loadStored('store', INITIAL_STORE));
  const [medicines, setMedicines] = useState<Medicine[]>(() => loadStored('medicines', INITIAL_MEDICINES));
  const [batches, setBatches] = useState<InventoryBatch[]>(() => loadStored('batches', INITIAL_BATCHES));
  const [sales, setSales] = useState<Sale[]>(() => loadStored('sales', INITIAL_SALES));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStored('purchases', INITIAL_PURCHASES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('suppliers', INITIAL_SUPPLIERS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored('customers', INITIAL_CUSTOMERS));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', INITIAL_EXPENSES));
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStored('notifications', INITIAL_NOTIFICATIONS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('auditLogs', INITIAL_AUDIT_LOGS));

  // Current logged in user representation
  const currentUser: UserProfile = {
    uid: firebaseUser?.uid || 'user-demo-01',
    email: firebaseUser?.email || 'admin@medieasy.pharmacy',
    displayName: firebaseUser?.displayName || (currentRole === 'owner' ? 'Dr. Shahriar (Owner)' : `Staff (${currentRole})`),
    role: currentRole,
    storeId: store.id,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  // Test Firebase on initial boot
  useEffect(() => {
    testFirebaseConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setFirebaseUser(usr);
    });

    return () => unsubscribe();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveStored('lang', language);
  }, [language]);
  useEffect(() => {
    saveStored('store', store);
  }, [store]);
  useEffect(() => {
    saveStored('medicines', medicines);
  }, [medicines]);
  useEffect(() => {
    saveStored('batches', batches);
  }, [batches]);
  useEffect(() => {
    saveStored('sales', sales);
  }, [sales]);
  useEffect(() => {
    saveStored('purchases', purchases);
  }, [purchases]);
  useEffect(() => {
    saveStored('suppliers', suppliers);
  }, [suppliers]);
  useEffect(() => {
    saveStored('customers', customers);
  }, [customers]);
  useEffect(() => {
    saveStored('expenses', expenses);
  }, [expenses]);
  useEffect(() => {
    saveStored('notifications', notifications);
  }, [notifications]);
  useEffect(() => {
    saveStored('auditLogs', auditLogs);
  }, [auditLogs]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const formatNum = (num: number | string): string => {
    if (store.useBanglaNumerals || language === 'bn') {
      return toBanglaNumber(num);
    }
    return String(num);
  };

  const formatAmount = (amount: number): string => {
    return formatCurrencyBDT(amount, store.useBanglaNumerals || language === 'bn');
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Google Sign In Error:', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
    } catch (e) {
      console.error('Sign Out Error:', e);
    }
  };

  const logAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      storeId: store.id,
      actorUid: currentUser.uid,
      actorName: currentUser.displayName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Async sync to Firestore if signed in
    if (firebaseUser) {
      setDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(() => {});
    }
  };

  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStore((prev) => {
      const next = { ...prev, ...updates };
      logAudit('STORE_SETTINGS_UPDATED', `Updated store settings: ${Object.keys(updates).join(', ')}`);
      return next;
    });
  };

  const addMedicine = (medData: Omit<Medicine, 'id' | 'storeId' | 'createdAt'>): string => {
    const id = `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMed: Medicine = {
      ...medData,
      id,
      storeId: store.id,
      createdAt: new Date().toISOString(),
    };
    setMedicines((prev) => [newMed, ...prev]);
    logAudit('MEDICINE_CREATED', `Added medicine ${newMed.brandName} (${newMed.strength})`);

    if (firebaseUser) {
      setDoc(doc(db, 'medicines', id), newMed).catch(() => {});
    }
    return id;
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    logAudit('MEDICINE_UPDATED', `Updated medicine ID ${id}`);
    if (firebaseUser) {
      updateDoc(doc(db, 'medicines', id), updates).catch(() => {});
    }
  };

  const archiveMedicine = (id: string) => {
    updateMedicine(id, { status: 'archived' });
  };

  const addBatch = (batchData: Omit<InventoryBatch, 'id' | 'storeId' | 'updatedAt'>): string => {
    const id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBatch: InventoryBatch = {
      ...batchData,
      id,
      storeId: store.id,
      updatedAt: new Date().toISOString(),
    };
    setBatches((prev) => [newBatch, ...prev]);
    logAudit('BATCH_ADDED', `Added Batch ${newBatch.batchNumber} with ${newBatch.remainingQuantity} units`);
    if (firebaseUser) {
      setDoc(doc(db, 'batches', id), newBatch).catch(() => {});
    }
    return id;
  };

  const adjustBatchStock = (
    batchId: string,
    adjustedRemaining: number,
    reason: string,
    actionType: 'quarantine' | 'damage' | 'adjustment'
  ) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const oldQty = b.remainingQuantity;
          const status = actionType === 'quarantine' ? 'quarantined' : b.status;
          logAudit(
            'BATCH_STOCK_ADJUSTED',
            `Batch ${b.batchNumber} adjusted from ${oldQty} to ${adjustedRemaining}. Reason: ${reason} (${actionType})`
          );
          return {
            ...b,
            remainingQuantity: adjustedRemaining,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      })
    );
  };

  const completeSale = async (saleData: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    items: CartItem[];
    discount: number;
    paidAmount: number;
    paymentMethod: 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'due' | 'split';
  }): Promise<{ success: boolean; sale?: Sale; error?: string }> => {
    if (!saleData.items || saleData.items.length === 0) {
      return { success: false, error: 'Cart is empty.' };
    }

    // Step 1: Pre-validate FEFO allocation against current live batches
    let totalCogs = 0;
    let subtotal = 0;
    const saleLineItems: any[] = [];
    const batchDeductionPlan: { batchId: string; deductQty: number }[] = [];

    for (const item of saleData.items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;

      // Filter medicine's active batches
      const medBatches = batches.filter((b) => b.medicineId === item.medicine.id);
      const fefoResult = allocateBatchesFEFO(medBatches, item.quantity);

      if (fefoResult.unfulfilledQuantity > 0) {
        return {
          success: false,
          error: `Insufficient sellable stock for ${item.medicine.brandName}. Needed: ${item.quantity}, Available: ${item.quantity - fefoResult.unfulfilledQuantity}`,
        };
      }

      totalCogs += fefoResult.totalCost;
      saleLineItems.push({
        medicineId: item.medicine.id,
        medicineName: `${item.medicine.brandName} (${item.medicine.strength})`,
        genericName: item.medicine.genericName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        lineTotal: itemSubtotal,
        batchAllocations: fefoResult.allocations,
      });

      for (const alloc of fefoResult.allocations) {
        batchDeductionPlan.push({
          batchId: alloc.batchId,
          deductQty: alloc.quantity,
        });
      }
    }

    const totalPayable = Math.max(0, subtotal - (saleData.discount || 0));
    const splits = calculatePaymentSplits(totalPayable, saleData.paidAmount);

    // Step 2: Atomic-style state update for batches
    setBatches((prevBatches) => {
      const batchMap = new Map(prevBatches.map((b) => [b.id, { ...b }]));
      for (const plan of batchDeductionPlan) {
        const target = batchMap.get(plan.batchId);
        if (target) {
          target.remainingQuantity = Math.max(0, target.remainingQuantity - plan.deductQty);
          if (target.remainingQuantity === 0) {
            target.status = 'depleted';
          }
          target.updatedAt = new Date().toISOString();
        }
      }
      return Array.from(batchMap.values());
    });

    // Step 3: Create Sale Document
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `RCP-${dateStr}-${randNum}`;
    const saleId = `sale-${Date.now()}`;

    const newSale: Sale = {
      id: saleId,
      storeId: store.id,
      receiptNo,
      customerId: saleData.customerId,
      customerName: saleData.customerName || 'General Walk-in Customer',
      customerPhone: saleData.customerPhone,
      cashierUid: currentUser.uid,
      cashierName: currentUser.displayName,
      items: saleLineItems,
      subtotal,
      discount: saleData.discount || 0,
      totalPayable,
      paidAmount: saleData.paidAmount,
      changeAmount: splits.change,
      dueAmount: splits.due,
      paymentMethod: saleData.paymentMethod,
      status: 'completed',
      cogs: totalCogs,
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);

    // Update customer due if customer selected
    if (saleData.customerId && splits.due > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === saleData.customerId
            ? {
                ...c,
                totalSpent: c.totalSpent + saleData.paidAmount,
                currentDue: c.currentDue + splits.due,
              }
            : c
        )
      );
    } else if (saleData.customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === saleData.customerId
            ? {
                ...c,
                totalSpent: c.totalSpent + totalPayable,
              }
            : c
        )
      );
    }

    logAudit('SALE_COMPLETED', `Receipt ${receiptNo} for ${formatCurrencyBDT(totalPayable)} by ${currentUser.displayName}`);

    // Check low stock triggers
    for (const item of saleData.items) {
      const remainingTotal = batches
        .filter((b) => b.medicineId === item.medicine.id && b.status === 'active')
        .reduce((sum, b) => sum + b.remainingQuantity, 0) - item.quantity;

      if (remainingTotal <= item.medicine.minStockAlert) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}-${item.medicine.id}`,
          storeId: store.id,
          type: 'low_stock',
          title: `Low Stock Alert: ${item.medicine.brandName}`,
          message: `${item.medicine.brandName} is low on stock (${remainingTotal} pcs remaining, threshold: ${item.medicine.minStockAlert} pcs).`,
          referenceId: item.medicine.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    }

    if (firebaseUser) {
      setDoc(doc(db, 'sales', saleId), newSale).catch(() => {});
    }

    return { success: true, sale: newSale };
  };

  const recordSupplierPurchase = (purchaseData: {
    invoiceNo: string;
    supplierId: string;
    supplierName: string;
    purchaseDate: string;
    items: {
      medicineId: string;
      medicineName: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
    }[];
    discount: number;
    paidAmount: number;
  }) => {
    let subtotal = 0;
    const purchaseLineItems = purchaseData.items.map((i) => {
      const lineTotal = i.quantity * i.purchasePrice;
      subtotal += lineTotal;
      return {
        medicineId: i.medicineId,
        medicineName: i.medicineName,
        batchNumber: i.batchNumber,
        expiryDate: i.expiryDate,
        quantity: i.quantity,
        purchasePrice: i.purchasePrice,
        lineTotal,
      };
    });

    const totalAmount = Math.max(0, subtotal - (purchaseData.discount || 0));
    const payableAmount = Math.max(0, totalAmount - purchaseData.paidAmount);
    const purchaseId = `pur-${Date.now()}`;

    const newPurchase: Purchase = {
      id: purchaseId,
      storeId: store.id,
      invoiceNo: purchaseData.invoiceNo,
      supplierId: purchaseData.supplierId,
      supplierName: purchaseData.supplierName,
      purchaseDate: purchaseData.purchaseDate || new Date().toISOString().slice(0, 10),
      items: purchaseLineItems,
      subtotal,
      discount: purchaseData.discount || 0,
      totalAmount,
      paidAmount: purchaseData.paidAmount,
      payableAmount,
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // Create batches for received inventory
    purchaseData.items.forEach((item) => {
      addBatch({
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
        purchaseDate: purchaseData.purchaseDate,
        expiryDate: item.expiryDate,
        quantityReceived: item.quantity,
        remainingQuantity: item.quantity,
        purchaseCost: item.purchasePrice,
        sellingPrice: 0, // inherits from medicine sellingPrice
        supplierId: purchaseData.supplierId,
        status: isBatchExpired(item.expiryDate) ? 'expired' : 'active',
      });
    });

    // Update supplier payable
    if (payableAmount > 0) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === purchaseData.supplierId ? { ...s, currentPayable: s.currentPayable + payableAmount } : s))
      );
    }

    logAudit('PURCHASE_RECEIVED', `Received Invoice ${purchaseData.invoiceNo} from ${purchaseData.supplierName} for ${formatCurrencyBDT(totalAmount)}`);
  };

  const collectCustomerDue = (customerId: string, amount: number, paymentMethod: string, note?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDue = Math.max(0, c.currentDue - amount);
          return { ...c, currentDue: newDue };
        }
        return c;
      })
    );
    logAudit('CUSTOMER_DUE_COLLECTED', `Collected ${formatCurrencyBDT(amount)} from Customer ID ${customerId} via ${paymentMethod}`);
  };

  const paySupplierDue = (supplierId: string, amount: number, paymentMethod: string, note?: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const newPayable = Math.max(0, s.currentPayable - amount);
          return { ...s, currentPayable: newPayable };
        }
        return s;
      })
    );
    logAudit('SUPPLIER_PAYABLE_PAID', `Paid ${formatCurrencyBDT(amount)} to Supplier ID ${supplierId} via ${paymentMethod}`);
  };

  const recordExpense = (expenseData: Omit<Expense, 'id' | 'storeId' | 'createdAt'>) => {
    const id = `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id,
      storeId: store.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    logAudit('EXPENSE_RECORDED', `Expense ${newExp.title} (${formatCurrencyBDT(newExp.amount)}) recorded`);
  };

  const recordReturn = (returnRecord: Omit<ReturnRecord, 'id' | 'storeId' | 'createdAt'>) => {
    const id = `ret-${Date.now()}`;
    const newReturn: ReturnRecord = {
      ...returnRecord,
      id,
      storeId: store.id,
      createdAt: new Date().toISOString(),
    };
    logAudit('RETURN_RECORDED', `Return recorded for ${returnRecord.medicineName} (${returnRecord.quantity} pcs) - ${returnRecord.type}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const resetToDemoData = () => {
    setStore(INITIAL_STORE);
    setMedicines(INITIAL_MEDICINES);
    setBatches(INITIAL_BATCHES);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setExpenses(INITIAL_EXPENSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    logAudit('SYSTEM_RESET_DEMO', 'Database restored to initial Bangladesh demo dataset');
  };

  const exportDatabaseJson = (): string => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      store,
      medicines,
      batches,
      sales,
      purchases,
      suppliers,
      customers,
      expenses,
      notifications,
      auditLogs,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.store || !Array.isArray(data.medicines)) {
        throw new Error('Invalid MediEasy backup structure');
      }
      setStore(data.store);
      setMedicines(data.medicines || []);
      setBatches(data.batches || []);
      setSales(data.sales || []);
      setPurchases(data.purchases || []);
      setSuppliers(data.suppliers || []);
      setCustomers(data.customers || []);
      setExpenses(data.expenses || []);
      setNotifications(data.notifications || []);
      setAuditLogs(data.auditLogs || []);
      logAudit('SYSTEM_RESTORE_JSON', 'Database restored from valid JSON backup file');
      return true;
    } catch (e) {
      console.error('Import Error:', e);
      return false;
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatAmount,
        formatNum,
        currentRole,
        setCurrentRole,
        currentUser,
        firebaseUser,
        loginWithGoogle,
        logout,
        isFirebaseConnected,
        store,
        updateStoreSettings,
        medicines,
        batches,
        sales,
        purchases,
        suppliers,
        customers,
        expenses,
        notifications,
        auditLogs,
        activeView,
        setActiveView,
        addMedicine,
        updateMedicine,
        archiveMedicine,
        addBatch,
        adjustBatchStock,
        completeSale,
        recordSupplierPurchase,
        collectCustomerDue,
        paySupplierDue,
        recordExpense,
        recordReturn,
        markNotificationRead,
        clearAllNotifications,
        resetToDemoData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
