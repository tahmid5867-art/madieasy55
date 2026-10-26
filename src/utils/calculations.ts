/**
 * Pure pharmacy business calculation rules, unit conversions, and accounting formulas
 */

export interface CartItemBatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseCost: number;
  sellingPrice: number;
}

export interface InventoryBatchRecord {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  remainingQuantity: number;
  purchaseCost: number;
  sellingPrice: number;
  status: 'active' | 'quarantined' | 'expired' | 'depleted';
}

/**
 * Check if a batch is expired relative to a target date (YYYY-MM-DD)
 */
export function isBatchExpired(expiryDateStr: string, referenceDateStr?: string): boolean {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const expiryDate = new Date(expiryDateStr);
  return expiryDate.getTime() < refDate.getTime();
}

/**
 * First-Expiry-First-Out (FEFO) allocation algorithm.
 * Filters out quarantined, expired, and depleted batches.
 * Allocates required quantity across earliest expiring batches.
 */
export function allocateBatchesFEFO(
  batches: InventoryBatchRecord[],
  requestedQuantity: number,
  referenceDateStr?: string
): {
  allocations: CartItemBatchAllocation[];
  unfulfilledQuantity: number;
  totalCost: number;
} {
  if (requestedQuantity <= 0) {
    return { allocations: [], unfulfilledQuantity: 0, totalCost: 0 };
  }

  // Filter valid batches: active, remainingQuantity > 0, not expired
  const validBatches = batches
    .filter((b) => b.status === 'active' && b.remainingQuantity > 0 && !isBatchExpired(b.expiryDate, referenceDateStr))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  let remainingToAllocate = requestedQuantity;
  const allocations: CartItemBatchAllocation[] = [];
  let totalCost = 0;

  for (const batch of validBatches) {
    if (remainingToAllocate <= 0) break;
    const qtyFromThisBatch = Math.min(batch.remainingQuantity, remainingToAllocate);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: qtyFromThisBatch,
      purchaseCost: batch.purchaseCost,
      sellingPrice: batch.sellingPrice,
    });
    totalCost += qtyFromThisBatch * batch.purchaseCost;
    remainingToAllocate -= qtyFromThisBatch;
  }

  return {
    allocations,
    unfulfilledQuantity: remainingToAllocate,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * Standard pharmacy accounting formula
 */
export interface AccountingSummaryInput {
  grossSales: number;
  discounts: number;
  refunds: number;
  cogs: number; // Cost of Goods Sold
  expenses: number;
}

export interface AccountingSummaryOutput {
  netSales: number;
  grossProfit: number;
  netOperatingProfit: number;
  profitMarginPercent: number;
}

export function computeAccountingSummary(input: AccountingSummaryInput): AccountingSummaryOutput {
  const grossSales = Math.max(0, input.grossSales);
  const discounts = Math.max(0, input.discounts);
  const refunds = Math.max(0, input.refunds);
  const cogs = Math.max(0, input.cogs);
  const expenses = Math.max(0, input.expenses);

  const netSales = Number(Math.max(0, grossSales - discounts - refunds).toFixed(2));
  const grossProfit = Number((netSales - cogs).toFixed(2));
  const netOperatingProfit = Number((grossProfit - expenses).toFixed(2));
  const profitMarginPercent = netSales > 0 ? Number(((netOperatingProfit / netSales) * 100).toFixed(2)) : 0;

  return {
    netSales,
    grossProfit,
    netOperatingProfit,
    profitMarginPercent,
  };
}

/**
 * Cash payment calculation: change return and customer due
 */
export function calculatePaymentSplits(totalPayable: number, paidAmount: number): { change: number; due: number } {
  const total = Number(totalPayable.toFixed(2));
  const paid = Number(paidAmount.toFixed(2));
  if (paid >= total) {
    return {
      change: Number((paid - total).toFixed(2)),
      due: 0,
    };
  } else {
    return {
      change: 0,
      due: Number((total - paid).toFixed(2)),
    };
  }
}

/**
 * Unit conversion helper
 * e.g. Pack = 10 strips, each strip = 10 tablets -> 1 pack = 100 tablets
 */
export function convertUnits(
  quantity: number,
  fromUnit: 'piece' | 'strip' | 'box',
  piecesPerStrip: number = 10,
  stripsPerBox: number = 10
): number {
  const piecesPerBox = piecesPerStrip * stripsPerBox;
  if (fromUnit === 'box') {
    return quantity * piecesPerBox;
  }
  if (fromUnit === 'strip') {
    return quantity * piecesPerStrip;
  }
  return quantity;
}

/**
 * Bengali numeral converter
 */
const EN_TO_BN_MAP: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
  '.': '.',
};

const BN_TO_EN_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function toBanglaNumber(value: number | string): string {
  const str = String(value);
  return str.split('').map((char) => EN_TO_BN_MAP[char] || char).join('');
}

export function toEnglishNumber(value: string): string {
  return value.split('').map((char) => BN_TO_EN_MAP[char] || char).join('');
}

export function formatCurrencyBDT(amount: number, isBangla: boolean = false): string {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (isBangla) {
    return `৳ ${toBanglaNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
}
