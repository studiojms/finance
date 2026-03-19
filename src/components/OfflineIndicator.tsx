/**
 * OfflineIndicator Component - Shows offline/sync status
 */

import React from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff, Cloud, CheckCircle2 } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline, isSyncing, syncProgress, pendingOperations, manualSync } = useOffline();

  if (isOnline && !isSyncing && pendingOperations === 0) {
    return null; // Don't show anything when everything is fine
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[280px] border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {!isOnline && <WifiOff className="w-6 h-6 text-orange-500" />}
            {isOnline && isSyncing && <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />}
            {isOnline && !isSyncing && pendingOperations > 0 && <CloudOff className="w-6 h-6 text-yellow-500" />}
          </div>

          {/* Status Text */}
          <div className="flex-1">
            {!isOnline && (
              <>
                <p className="font-semibold text-gray-900 dark:text-white">Offline Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingOperations > 0
                    ? `${pendingOperations} pending ${pendingOperations === 1 ? 'change' : 'changes'}`
                    : 'Changes will sync when online'}
                </p>
              </>
            )}

            {isOnline && isSyncing && (
              <>
                <p className="font-semibold text-gray-900 dark:text-white">Syncing...</p>
                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </>
            )}

            {isOnline && !isSyncing && pendingOperations > 0 && (
              <>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {pendingOperations} Pending {pendingOperations === 1 ? 'Change' : 'Changes'}
                </p>
                <button
                  onClick={manualSync}
                  className="mt-1 text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
