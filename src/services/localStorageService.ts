/**
 * LocalStorage Service - IndexedDB wrapper for offline data storage
 */

const DB_NAME = 'finance_pro_offline';
const DB_VERSION = 1;

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  timestamp: number;
  synced: boolean;
}

export class LocalStorageService {
  private static db: IDBDatabase | null = null;

  static async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Store for cached data
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentsStore.createIndex('collection', 'collection', { unique: false });
          documentsStore.createIndex('userId', 'userId', { unique: false });
          documentsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for pending operations (offline queue)
        if (!db.objectStoreNames.contains('operations')) {
          const operationsStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationsStore.createIndex('synced', 'synced', { unique: false });
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for metadata (last sync times, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Document operations
  static async saveDocument(collection: string, userId: string, doc: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');

      const document = {
        ...doc,
        collection,
        userId,
        timestamp: Date.now(),
      };

      const request = store.put(document);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getDocuments(collection: string, userId: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index('collection');
      const request = index.getAll(collection);

      request.onsuccess = () => {
        const docs = request.result.filter((doc) => doc.userId === userId);
        resolve(docs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getDocument(id: string): Promise<any | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteDocument(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async clearCollection(collection: string): Promise<void> {
    if (!this.db) await this.init();

    const docs = await this.getDocuments(collection, '');
    const transaction = this.db!.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');

    docs.forEach((doc) => {
      store.delete(doc.id);
    });
  }

  // Operation queue management
  static async addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    if (!this.db) await this.init();

    const op: OfflineOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.add(op);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getPendingOperations(): Promise<OfflineOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const request = store.getAll();

      request.onsuccess = () => {
        const allOperations = request.result;
        const pendingOperations = allOperations.filter((op: OfflineOperation) => !op.synced);
        resolve(pendingOperations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async markOperationSynced(operationId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.synced = true;
          const updateRequest = store.put(operation);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async deleteOperation(operationId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.delete(operationId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async clearSyncedOperations(): Promise<void> {
    if (!this.db) await this.init();

    const operations = await this.getPendingOperations();
    const transaction = this.db!.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');

    return new Promise((resolve, reject) => {
      const allRequest = store.getAll();
      allRequest.onsuccess = () => {
        const all = allRequest.result;
        const synced = all.filter((op) => op.synced);
        synced.forEach((op) => store.delete(op.id));
        resolve();
      };
      allRequest.onerror = () => reject(allRequest.error);
    });
  }

  // Metadata operations
  static async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}
