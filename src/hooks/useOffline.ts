/**
 * useOffline Hook - React hook for managing offline state and sync
 */

import { useState, useEffect } from 'react';
import { ConnectionService } from '../services/connectionService';
import { SyncService } from '../services/syncService';
import { LocalStorageService } from '../services/localStorageService';

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  pendingOperations: number;
  lastSyncTime: Date | null;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isSyncing: false,
    syncProgress: 0,
    pendingOperations: 0,
    lastSyncTime: null,
  });

  useEffect(() => {
    // Initialize services
    LocalStorageService.init().catch(console.error);
    ConnectionService.init();
    SyncService.init();

    // Listen to connection changes
    const unsubscribeConnection = ConnectionService.addListener((isOnline) => {
      setState((prev) => ({ ...prev, isOnline }));
    });

    // Listen to sync status
    const unsubscribeSync = SyncService.addSyncCallback((status, progress = 0) => {
      setState((prev) => ({
        ...prev,
        isSyncing: status === 'syncing',
        syncProgress: progress,
        lastSyncTime: status === 'synced' ? new Date() : prev.lastSyncTime,
      }));
    });

    // Update pending operations count
    const updatePendingCount = async () => {
      const count = await SyncService.getPendingOperationsCount();
      setState((prev) => ({ ...prev, pendingOperations: count }));
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    // Initial state
    setState((prev) => ({
      ...prev,
      isOnline: ConnectionService.isOnline(),
    }));

    return () => {
      unsubscribeConnection();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const manualSync = async () => {
    if (state.isOnline && !state.isSyncing) {
      await SyncService.syncPendingOperations();
    }
  };

  return {
    ...state,
    manualSync,
  };
}
