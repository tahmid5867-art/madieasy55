export type UserRole = 'owner' | 'manager' | 'pharmacist' | 'cashier' | 'inventory';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  storeId: string;
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  banglaName?: string;
  address: string;
  phone: string;
  drugLicenseNo: string;
  ownerUid: string;
  currency: string;
  lowStockThreshold: number;
  expiryAlertDays: number;
  useBanglaNumerals: boolean;
  returnPolicy: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  storeId: string;
  brandName: string;
  genericName: string;
  banglaName: string;
  manufacturer: string;
  strength: string;
  dosageForm: string; // Tablet, Capsule, Syrup, Suspension, Drop, Injection, Ointment, Inhaler
  packUnit: 'piece' | 'strip' | 'box';
  piecesPerPack: number;
  purchasePrice: number;
  sellingPrice: number;
  minStockAlert: number;
  barcode: string;
  storageNotes?: string;
  prescriptionRequired: boolean;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface InventoryBatch {
  id: string;
  storeId: string;
  medicineId: string;
  batchNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  quantityReceived: number;
  remainingQuantity: number;
  purchaseCost: number;
  sellingPrice: number;
  supplierId: string;
  status: 'active' | 'quarantined' | 'expired' | 'depleted';
  updatedAt: string;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
  unit: 'piece' | 'strip' | 'box';
  unitPrice: number;
  discount: number; // percentage or fixed
  selectedBatchId?: string;
  allocations: {
    batchId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchaseCost: number;
  }[];
  totalPrice: number;
}

export interface SaleLineItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchAllocations: {
    batchId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchaseCost: number;
  }[];
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  storeId: string;
  receiptNo: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  cashierUid: string;
  cashierName: string;
  items: SaleLineItem[];
  subtotal: number;
  discount: number;
  totalPayable: number;
  paidAmount: number;
  changeAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'due' | 'split';
  status: 'completed' | 'refunded' | 'cancelled';
  cogs: number; // Cost of goods sold for profit calculations
  createdAt: string;
}

export interface PurchaseLineItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  storeId: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  items: PurchaseLineItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  payableAmount: number;
  status: 'received' | 'partial' | 'returned';
  createdAt: string;
}

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address: string;
  currentPayable: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  address?: string;
  totalSpent: number;
  currentDue: number;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  note?: string;
  collectedBy: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  note?: string;
  paidBy: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  storeId: string;
  type: 'customer_return' | 'supplier_return' | 'damaged' | 'quarantine' | 'write_off';
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  reason: string;
  refundAmount: number;
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  storeId: string;
  title: string;
  amount: number;
  category: 'rent' | 'electricity' | 'salary' | 'transport' | 'packaging' | 'other';
  date: string;
  paymentMethod: string;
  note?: string;
  recordedBy: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  storeId: string;
  type: 'low_stock' | 'expiry_warning' | 'expired' | 'due_reminder' | 'system';
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  storeId: string;
  actorUid: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}
