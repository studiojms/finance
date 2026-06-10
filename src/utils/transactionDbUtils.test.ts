import { describe, expect, it, vi } from 'vitest';

describe('formatTransactionForDb', () => {
  it('keeps transfer category id on firebase', async () => {
    vi.doMock('../config', () => ({
      isFirebase: vi.fn(() => true),
      isSupabase: vi.fn(() => false),
    }));

    const { formatTransactionForDb, TRANSFER_CATEGORY_ID } = await import('./transactionDbUtils');

    const data = formatTransactionForDb({
      description: 'Transfer',
      amount: 100,
      date: '2026-06-10T12:00:00.000Z',
      accountId: 'acc-1',
      categoryId: TRANSFER_CATEGORY_ID,
      type: 'expense',
      isConsolidated: true,
      userId: 'user-1',
      transferId: 'transfer-1',
    });

    expect(data.categoryId).toBe(TRANSFER_CATEGORY_ID);
  });

  it('uses null category id for transfers on supabase', async () => {
    vi.resetModules();
    vi.doMock('../config', () => ({
      isFirebase: vi.fn(() => false),
      isSupabase: vi.fn(() => true),
    }));

    const { formatTransactionForDb, TRANSFER_CATEGORY_ID } = await import('./transactionDbUtils');

    const data = formatTransactionForDb({
      description: 'Transfer',
      amount: 100,
      date: '2026-06-10T12:00:00.000Z',
      accountId: 'acc-1',
      categoryId: TRANSFER_CATEGORY_ID,
      type: 'expense',
      isConsolidated: true,
      userId: 'user-1',
      transferId: 'transfer-1',
    });

    expect(data.category_id).toBeNull();
    expect(data.transfer_id).toBe('transfer-1');
  });
});
