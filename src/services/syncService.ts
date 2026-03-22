/**
 * Sync Service - Handle synchronization of offline data
 */

import { LocalStorageService, OfflineOperation } from './localStorageService';
import { ConnectionService } from './connectionService';
import { isFirebase, isSupabase } from '../config';
import { db as firebaseDb } from '../firebase';
import { supabase } from '../supabase';
import { addDoc, collection, updateDoc, deleteDoc, doc } from 'firebase/firestore';

type SyncCallback = (status: 'syncing' | 'synced' | 'error', progress?: number) => void;

export class SyncService {
  private static isSyncing = false;
  private static syncCallbacks: SyncCallback[] = [];
  private static autoSyncEnabled = true;

  static init(): void {
    // Listen for connection changes
    ConnectionService.addListener((isOnline) => {
      if (isOnline && this.autoSyncEnabled) {
        this.syncPendingOperations();
      }
    });

    // Attempt sync on app start if online
    if (ConnectionService.isOnline()) {
      setTimeout(() => this.syncPendingOperations(), 2000);
    }
  }

  static addSyncCallback(callback: SyncCallback): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  private static notifyCallbacks(status: 'syncing' | 'synced' | 'error', progress?: number): void {
    this.syncCallbacks.forEach((callback) => callback(status, progress));
  }

  static setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  static async syncPendingOperations(): Promise<void> {
    if (this.isSyncing) return;
    if (!ConnectionService.isOnline()) return;

    this.isSyncing = true;
    this.notifyCallbacks('syncing', 0);

    try {
      const operations = await LocalStorageService.getPendingOperations();

      if (operations.length === 0) {
        this.isSyncing = false;
        this.notifyCallbacks('synced', 100);
        return;
      }

      console.log(`Syncing ${operations.length} pending operations...`);

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        const progress = ((i + 1) / operations.length) * 100;

        try {
          await this.executeOperation(operation);
          await LocalStorageService.markOperationSynced(operation.id);
          this.notifyCallbacks('syncing', progress);
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);
          // Continue with other operations even if one fails
        }
      }

      // Clean up synced operations
      await LocalStorageService.clearSyncedOperations();

      this.isSyncing = false;
      this.notifyCallbacks('synced', 100);
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.isSyncing = false;
      this.notifyCallbacks('error');
    }
  }

  private static async executeOperation(operation: OfflineOperation): Promise<void> {
    const { type, collection: collectionName, documentId, data } = operation;

    if (isFirebase() && firebaseDb) {
      await this.executeFirebaseOperation(type, collectionName, documentId, data);
    } else if (isSupabase() && supabase) {
      await this.executeSupabaseOperation(type, collectionName, documentId, data);
    }
  }

  private static async executeFirebaseOperation(
    type: string,
    collectionName: string,
    documentId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    switch (type) {
      case 'create':
        await addDoc(collection(firebaseDb!, collectionName), data);
        break;
      case 'update':
        if (documentId) {
          await updateDoc(doc(firebaseDb!, collectionName, documentId), data);
        }
        break;
      case 'delete':
        if (documentId) {
          await deleteDoc(doc(firebaseDb!, collectionName, documentId));
        }
        break;
    }
  }

  private static async executeSupabaseOperation(
    type: string,
    collectionName: string,
    documentId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    switch (type) {
      case 'create':
        const { error: createError } = await supabase!.from(collectionName).insert([data]);
        if (createError) throw createError;
        break;
      case 'update':
        if (documentId) {
          const { error: updateError } = await supabase!.from(collectionName).update(data).eq('id', documentId);
          if (updateError) throw updateError;
        }
        break;
      case 'delete':
        if (documentId) {
          const { error: deleteError } = await supabase!.from(collectionName).delete().eq('id', documentId);
          if (deleteError) throw deleteError;
        }
        break;
    }
  }

  static async getPendingOperationsCount(): Promise<number> {
    const operations = await LocalStorageService.getPendingOperations();
    return operations.length;
  }
}
