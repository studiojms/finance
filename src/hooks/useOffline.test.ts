import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOffline } from './useOffline';
import { ConnectionService } from '../services/connectionService';
import { SyncService } from '../services/syncService';
import { LocalStorageService } from '../services/localStorageService';

vi.mock('../services/connectionService');
vi.mock('../services/syncService');
vi.mock('../services/localStorageService');

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ConnectionService
    vi.mocked(ConnectionService.init).mockImplementation(() => {});
    vi.mocked(ConnectionService.isOnline).mockReturnValue(true);
    vi.mocked(ConnectionService.addListener).mockReturnValue(() => {});

    // Mock SyncService
    vi.mocked(SyncService.init).mockImplementation(() => {});
    vi.mocked(SyncService.setAutoSync).mockImplementation(() => {});
    vi.mocked(SyncService.addSyncCallback).mockReturnValue(() => {});
    vi.mocked(SyncService.syncPendingOperations).mockResolvedValue();
    vi.mocked(SyncService.getPendingOperationsCount).mockResolvedValue(0);

    // Mock LocalStorageService
    vi.mocked(LocalStorageService.init).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes services on mount', async () => {
      renderHook(() => useOffline());

      await waitFor(() => {
        expect(LocalStorageService.init).toHaveBeenCalled();
        expect(ConnectionService.init).toHaveBeenCalled();
        expect(SyncService.init).toHaveBeenCalled();
      });
    });

    it('sets up connection listener', () => {
      renderHook(() => useOffline());

      expect(ConnectionService.addListener).toHaveBeenCalled();
    });

    it('sets up sync callback', () => {
      renderHook(() => useOffline());

      expect(SyncService.addSyncCallback).toHaveBeenCalled();
    });
  });

  describe('offline state', () => {
    it('returns initial state with isOnline true', () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.syncProgress).toBe(0);
    });

    it('updates isOnline when connection changes', async () => {
      let connectionCallback: ((isOnline: boolean) => void) | null = null;
      
      vi.mocked(ConnectionService.addListener).mockImplementation((callback) => {
        connectionCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useOffline());

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      if (connectionCallback) {
        vi.mocked(ConnectionService.isOnline).mockReturnValue(false);
        connectionCallback(false);
      }

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('updates sync status when sync is in progress', async () => {
      let syncCallback: ((status: string, progress: number) => void) | null = null;
      
      vi.mocked(SyncService.addSyncCallback).mockImplementation((callback) => {
        syncCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useOffline());

      // Simulate syncing
      if (syncCallback) {
        syncCallback('syncing', 50);
      }

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
        expect(result.current.syncProgress).toBe(50);
      });
    });

    it('updates pending count after sync', async () => {
      let syncCallback: ((status: string, progress: number) => void) | null = null;
      
      vi.mocked(SyncService.addSyncCallback).mockImplementation((callback) => {
        syncCallback = callback;
        return () => {};
      });

      vi.mocked(SyncService.getPendingOperationsCount).mockResolvedValue(5);

      const { result } = renderHook(() => useOffline());

      // Simulate sync complete
      if (syncCallback) {
        syncCallback('synced', 100);
      }

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(5);
        expect(result.current.isSyncing).toBe(false);
      });
    });
  });

  describe('manualSync', () => {
    it('calls SyncService.syncPendingOperations', async () => {
      const { result } = renderHook(() => useOffline());

      await result.current.manualSync();

      expect(SyncService.syncPendingOperations).toHaveBeenCalled();
    });

    it('handles sync errors gracefully', async () => {
      vi.mocked(SyncService.syncPendingOperations).mockRejectedValue(
        new Error('Sync failed')
      );

      const { result } = renderHook(() => useOffline());

      // Should not throw
      await expect(result.current.manualSync()).resolves.toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('unsubscribes from listeners on unmount', () => {
      const connectionUnsubscribe = vi.fn();
      const syncUnsubscribe = vi.fn();

      vi.mocked(ConnectionService.addListener).mockReturnValue(connectionUnsubscribe);
      vi.mocked(SyncService.addSyncCallback).mockReturnValue(syncUnsubscribe);

      const { unmount } = renderHook(() => useOffline());

      unmount();

      expect(connectionUnsubscribe).toHaveBeenCalled();
      expect(syncUnsubscribe).toHaveBeenCalled();
    });

    it('enables auto-sync on mount', () => {
      renderHook(() => useOffline());

      expect(SyncService.setAutoSync).toHaveBeenCalledWith(true);
    });
  });
});
