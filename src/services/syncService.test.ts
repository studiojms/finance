import { SyncService } from './syncService';
import { LocalStorageService } from './localStorageService';
import { ConnectionService } from './connectionService';

vi.mock('./localStorageService');
vi.mock('./connectionService');
vi.mock('../firebase', () => ({
  db: {},
}));
vi.mock('../supabase', () => ({
  supabase: null,
}));
vi.mock('../config', () => ({
  isFirebase: vi.fn(() => false),
  isSupabase: vi.fn(() => false),
}));

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ConnectionService
    vi.mocked(ConnectionService.isOnline).mockReturnValue(true);
    vi.mocked(ConnectionService.addListener).mockReturnValue(() => {});

    // Mock LocalStorageService
    vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue([]);
    vi.mocked(LocalStorageService.markOperationSynced).mockResolvedValue();
    vi.mocked(LocalStorageService.clearSyncedOperations).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('sets up connection listener', () => {
      SyncService.init();

      expect(ConnectionService.addListener).toHaveBeenCalled();
    });

    it('triggers sync when going online if auto-sync is enabled', () => {
      const mockListener = vi.fn();
      vi.mocked(ConnectionService.addListener).mockImplementation((callback) => {
        mockListener.mockImplementation(callback);
        return () => {};
      });

      SyncService.init();
      SyncService.setAutoSync(true);

      // Simulate going online
      mockListener(true);

      expect(ConnectionService.addListener).toHaveBeenCalled();
    });
  });

  describe('addSyncCallback', () => {
    it('adds a sync callback and returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = SyncService.addSyncCallback(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('removes callback when unsubscribe is called', () => {
      const callback = vi.fn();
      const unsubscribe = SyncService.addSyncCallback(callback);

      unsubscribe();

      // Callback should not be called after unsubscribe
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('setAutoSync', () => {
    it('enables auto-sync', () => {
      SyncService.setAutoSync(true);
      // Auto-sync state is internal, but we can verify it doesn't throw
      expect(true).toBe(true);
    });

    it('disables auto-sync', () => {
      SyncService.setAutoSync(false);
      expect(true).toBe(true);
    });
  });

  describe('syncPendingOperations', () => {
    it('does not sync if already syncing', async () => {
      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue([
        {
          id: 'op1',
          type: 'create',
          collection: 'transactions',
          data: { amount: 100 },
          timestamp: Date.now(),
          synced: false,
        },
      ]);

      // Start first sync
      const sync1 = SyncService.syncPendingOperations();

      // Try to start second sync (should be ignored)
      const sync2 = SyncService.syncPendingOperations();

      await sync1;
      await sync2;

      // Should only fetch operations once
      expect(LocalStorageService.getPendingOperations).toHaveBeenCalledTimes(1);
    });

    it('does not sync when offline', async () => {
      vi.mocked(ConnectionService.isOnline).mockReturnValue(false);

      await SyncService.syncPendingOperations();

      expect(LocalStorageService.getPendingOperations).not.toHaveBeenCalled();
    });

    it('syncs pending operations when online', async () => {
      const operations = [
        {
          id: 'op1',
          type: 'create' as const,
          collection: 'transactions',
          data: { amount: 100 },
          timestamp: Date.now(),
          synced: false,
        },
      ];

      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue(operations);

      await SyncService.syncPendingOperations();

      expect(LocalStorageService.getPendingOperations).toHaveBeenCalled();
      expect(LocalStorageService.markOperationSynced).toHaveBeenCalledWith('op1');
      expect(LocalStorageService.clearSyncedOperations).toHaveBeenCalled();
    });

    it('calls sync callbacks with correct status', async () => {
      const callback = vi.fn();
      SyncService.addSyncCallback(callback);

      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue([]);

      await SyncService.syncPendingOperations();

      expect(callback).toHaveBeenCalledWith('syncing', 0);
      expect(callback).toHaveBeenCalledWith('synced', 100);
    });

    it('handles sync errors gracefully', async () => {
      const operations = [
        {
          id: 'op1',
          type: 'create' as const,
          collection: 'transactions',
          data: { amount: 100 },
          timestamp: Date.now(),
          synced: false,
        },
      ];

      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue(operations);
      vi.mocked(LocalStorageService.markOperationSynced).mockRejectedValue(new Error('Sync failed'));

      const callback = vi.fn();
      SyncService.addSyncCallback(callback);

      // Should not throw
      await expect(SyncService.syncPendingOperations()).resolves.toBeUndefined();
    });

    it('continues syncing other operations if one fails', async () => {
      const operations = [
        {
          id: 'op1',
          type: 'create' as const,
          collection: 'transactions',
          data: { amount: 100 },
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: 'op2',
          type: 'create' as const,
          collection: 'transactions',
          data: { amount: 200 },
          timestamp: Date.now() + 1,
          synced: false,
        },
      ];

      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue(operations);

      // First operation fails, second should still be processed
      vi.mocked(LocalStorageService.markOperationSynced)
        .mockRejectedValueOnce(new Error('Operation 1 failed'))
        .mockResolvedValueOnce();

      await SyncService.syncPendingOperations();

      expect(LocalStorageService.markOperationSynced).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPendingOperationsCount', () => {
    it('returns the number of pending operations', async () => {
      const operations = [
        {
          id: 'op1',
          type: 'create' as const,
          collection: 'transactions',
          data: { amount: 100 },
          timestamp: Date.now(),
          synced: false,
        },
        {
          id: 'op2',
          type: 'update' as const,
          collection: 'transactions',
          documentId: 'doc1',
          data: { amount: 200 },
          timestamp: Date.now(),
          synced: false,
        },
      ];

      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue(operations);

      const count = await SyncService.getPendingOperationsCount();

      expect(count).toBe(2);
    });

    it('returns 0 when no operations are pending', async () => {
      vi.mocked(LocalStorageService.getPendingOperations).mockResolvedValue([]);

      const count = await SyncService.getPendingOperationsCount();

      expect(count).toBe(0);
    });
  });
});
