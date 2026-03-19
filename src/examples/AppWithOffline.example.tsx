/**
 * Example: How to integrate Offline Mode into your App
 *
 * Add this to your main App component to enable offline functionality
 */

import React from 'react';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { useOffline } from '../hooks/useOffline';

function App() {
  // Optional: Access offline state for custom UI
  const { isOnline, isSyncing, pendingOperations } = useOffline();

  return (
    <div className="app">
      {/* Your existing app components */}
      <div>{/* Your main content here */}</div>

      {/* Add the offline indicator - shows when offline or syncing */}
      <OfflineIndicator />

      {/* Optional: Custom offline UI */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-center">
          ⚠️ You're offline. Changes will sync when you're back online.
        </div>
      )}
    </div>
  );
}

/**
 * That's it! Offline mode is now fully integrated.
 *
 * Features that now work:
 * - All CRUD operations work offline
 * - Data is cached locally
 * - Automatic sync when connection resumes
 * - Visual indicators for offline/sync status
 * - Manual sync button when needed
 *
 * The DatabaseService automatically handles offline mode,
 * so no changes are needed to your existing database calls.
 */

export default App;
