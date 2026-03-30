import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from './databaseService';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db as firebaseDb } from '../firebase';
import { supabase } from '../supabase';
import { LocalStorageService } from './localStorageService';
import { ConnectionService } from './connectionService';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
}));

vi.mock('../firebase', () => ({
  db: {},
  analytics: null,
  logEvent: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: null,
}));

vi.mock('../config', () => ({
  isFirebase: vi.fn(() => true),
  isSupabase: vi.fn(() => false),
}));

vi.mock('./localStorageService', () => ({
  LocalStorageService: {
    saveDocument: vi.fn(),
    getDocument: vi.fn(),
    getDocuments: vi.fn(() => Promise.resolve([])),
    deleteDocument: vi.fn(),
    addOperation: vi.fn(),
  },
}));

vi.mock('./connectionService', () => ({
  ConnectionService: {
    isOnline: vi.fn(() => true),
  },
}));

describe('DatabaseService - bulkDeleteUserDocuments', () => {
  const mockUserId = 'test-user-123';
  const otherUserId = 'other-user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    (ConnectionService.isOnline as any).mockReturnValue(true);
  });

  it('only deletes documents for the specified user in Firebase', async () => {
    const mockDocs = [
      { id: 'doc1', ref: { path: 'transactions/doc1' }, data: () => ({ userId: mockUserId }) },
      { id: 'doc2', ref: { path: 'transactions/doc2' }, data: () => ({ userId: mockUserId }) },
      { id: 'doc3', ref: { path: 'transactions/doc3' }, data: () => ({ userId: mockUserId }) },
    ];

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };

    (writeBatch as any).mockReturnValue(mockBatch);
    (getDocs as any).mockResolvedValue({ docs: mockDocs });
    (query as any).mockReturnValue({});
    (collection as any).mockReturnValue({});
    (where as any).mockReturnValue({});

    const deletedCount = await DatabaseService.bulkDeleteUserDocuments('transactions', mockUserId);

    expect(query).toHaveBeenCalledWith(expect.anything(), expect.anything());
    expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
    expect(mockBatch.delete).toHaveBeenCalledTimes(3);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    expect(deletedCount).toBe(3);
  });

  it('handles large batches (more than 500 documents) in Firebase', async () => {
    const mockDocs = Array.from({ length: 1200 }, (_, i) => ({
      id: `doc${i}`,
      ref: { path: `transactions/doc${i}` },
      data: () => ({ userId: mockUserId }),
    }));

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };

    (writeBatch as any).mockReturnValue(mockBatch);
    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    const deletedCount = await DatabaseService.bulkDeleteUserDocuments('transactions', mockUserId);

    expect(writeBatch).toHaveBeenCalledTimes(3);
    expect(mockBatch.delete).toHaveBeenCalledTimes(1200);
    expect(mockBatch.commit).toHaveBeenCalledTimes(3);
    expect(deletedCount).toBe(1200);
  });

  it('deletes from local storage after Firebase deletion', async () => {
    const mockDocs = [{ id: 'doc1', ref: { path: 'transactions/doc1' }, data: () => ({ userId: mockUserId }) }];

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };

    (writeBatch as any).mockReturnValue(mockBatch);
    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    await DatabaseService.bulkDeleteUserDocuments('transactions', mockUserId);

    expect(LocalStorageService.deleteDocument).toHaveBeenCalledWith('doc1');
  });

  it('works offline by using cached data', async () => {
    (ConnectionService.isOnline as any).mockReturnValue(false);

    const cachedDocs = [
      { id: 'doc1', userId: mockUserId },
      { id: 'doc2', userId: mockUserId },
    ];

    (LocalStorageService.getDocuments as any).mockResolvedValue(cachedDocs);

    const deletedCount = await DatabaseService.bulkDeleteUserDocuments('transactions', mockUserId);

    expect(LocalStorageService.deleteDocument).toHaveBeenCalledWith('doc1');
    expect(LocalStorageService.deleteDocument).toHaveBeenCalledWith('doc2');
    expect(LocalStorageService.addOperation).toHaveBeenCalledTimes(2);
    expect(deletedCount).toBe(2);
  });

  it('returns 0 when no documents match the user', async () => {
    vi.clearAllMocks();
    (ConnectionService.isOnline as any).mockReturnValue(true);

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };

    (writeBatch as any).mockReturnValue(mockBatch);
    (getDocs as any).mockClear().mockResolvedValue({ docs: [] });
    (query as any).mockClear().mockReturnValue({});
    (collection as any).mockClear().mockReturnValue({});
    (where as any).mockClear().mockReturnValue({});

    const deletedCount = await DatabaseService.bulkDeleteUserDocuments('transactions', mockUserId);

    expect(mockBatch.delete).not.toHaveBeenCalled();
    expect(deletedCount).toBe(0);
  });

  it('filters by userId to prevent cross-user deletion', async () => {
    vi.clearAllMocks();
    (ConnectionService.isOnline as any).mockReturnValue(true);

    const mockDocsForUser = [
      { id: 'doc1', ref: { path: 'transactions/doc1' }, data: () => ({ userId: mockUserId }) },
      { id: 'doc3', ref: { path: 'transactions/doc3' }, data: () => ({ userId: mockUserId }) },
    ];

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };

    (writeBatch as any).mockReturnValue(mockBatch);
    (getDocs as any).mockClear().mockResolvedValue({ docs: mockDocsForUser });
    (query as any).mockClear().mockReturnValue({});
    (collection as any).mockClear().mockReturnValue({});
    (where as any).mockClear().mockReturnValue({});

    const deletedCount = await DatabaseService.bulkDeleteUserDocuments('transactions', mockUserId);

    expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
    expect(mockBatch.delete).toHaveBeenCalledTimes(2);
    expect(deletedCount).toBe(2);
  });
});
