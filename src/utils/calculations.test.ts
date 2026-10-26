import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateBatchesFEFO,
  computeAccountingSummary,
  calculatePaymentSplits,
  convertUnits,
  toBanglaNumber,
  formatCurrencyBDT,
  isBatchExpired,
  InventoryBatchRecord
} from './calculations';

test('isBatchExpired correctly identifies expired vs valid batch', () => {
  const ref = '2026-10-25';
  assert.equal(isBatchExpired('2026-05-01', ref), true);
  assert.equal(isBatchExpired('2027-01-01', ref), false);
});

test('FEFO batch allocation picks earliest expiring active batches first', () => {
  const sampleBatches: InventoryBatchRecord[] = [
    {
      id: 'b3',
      medicineId: 'med-1',
      batchNumber: 'B-2027',
      expiryDate: '2027-12-31',
      remainingQuantity: 50,
      purchaseCost: 8,
      sellingPrice: 12,
      status: 'active',
    },
    {
      id: 'b1',
      medicineId: 'med-1',
      batchNumber: 'B-2026-NOV',
      expiryDate: '2026-11-30',
      remainingQuantity: 20,
      purchaseCost: 7.5,
      sellingPrice: 12,
      status: 'active',
    },
    {
      id: 'b2',
      medicineId: 'med-1',
      batchNumber: 'B-QUARANTINED',
      expiryDate: '2026-10-30',
      remainingQuantity: 100,
      purchaseCost: 7,
      sellingPrice: 12,
      status: 'quarantined', // Must not be picked
    },
    {
      id: 'b0',
      medicineId: 'med-1',
      batchNumber: 'B-EXPIRED',
      expiryDate: '2025-01-01',
      remainingQuantity: 10,
      purchaseCost: 6,
      sellingPrice: 12,
      status: 'active', // But expired!
    },
  ];

  const result = allocateBatchesFEFO(sampleBatches, 35, '2026-10-25');
  assert.equal(result.unfulfilledQuantity, 0);
  assert.equal(result.allocations.length, 2);
  // First allocation should be b1 (20 pcs @ 7.50)
  assert.equal(result.allocations[0].batchId, 'b1');
  assert.equal(result.allocations[0].quantity, 20);
  // Second allocation should be b3 (15 pcs @ 8.00)
  assert.equal(result.allocations[1].batchId, 'b3');
  assert.equal(result.allocations[1].quantity, 15);
  // Total purchase cost = (20 * 7.5) + (15 * 8) = 150 + 120 = 270
  assert.equal(result.totalCost, 270);
});

test('Accounting summary accounts for discounts, refunds, COGS and expenses accurately', () => {
  const summary = computeAccountingSummary({
    grossSales: 10000,
    discounts: 500,
    refunds: 200,
    cogs: 6500,
    expenses: 1200,
  });

  // Net sales = 10000 - 500 - 200 = 9300
  assert.equal(summary.netSales, 9300);
  // Gross profit = 9300 - 6500 = 2800
  assert.equal(summary.grossProfit, 2800);
  // Net operating profit = 2800 - 1200 = 1600
  assert.equal(summary.netOperatingProfit, 1600);
  // Margin = (1600 / 9300) * 100 = 17.20%
  assert.equal(summary.profitMarginPercent, 17.20);
});

test('calculatePaymentSplits accurately computes customer change or dues', () => {
  const payment1 = calculatePaymentSplits(1450, 1500);
  assert.equal(payment1.change, 50);
  assert.equal(payment1.due, 0);

  const payment2 = calculatePaymentSplits(2000, 1500);
  assert.equal(payment2.change, 0);
  assert.equal(payment2.due, 500);
});

test('convertUnits correctly converts box and strip to piece', () => {
  // 2 boxes, 10 strips per box, 10 tablets per strip = 200 tablets
  assert.equal(convertUnits(2, 'box', 10, 10), 200);
  // 3 strips, 10 tablets per strip = 30 tablets
  assert.equal(convertUnits(3, 'strip', 10, 10), 30);
  // 5 pieces = 5 pieces
  assert.equal(convertUnits(5, 'piece', 10, 10), 5);
});

test('Bangla number and currency formatting', () => {
  assert.equal(toBanglaNumber(1250), '১২৫০');
  assert.equal(formatCurrencyBDT(1250.50, false), '৳ 1,250.50');
  assert.equal(formatCurrencyBDT(1250.50, true), '৳ ১,২৫০.৫০');
});
