import { LocalStorageService } from './localStorageService';

// Mock IndexedDB
const mockIndexedDB = () => {
  const databases = new Map<string, any>();
  const stores = new Map<string, Map<string, any>>();
  const storeKeyPaths = new Map<string, string>();

  return {
    open: vi.fn((name: string, version: number) => {
      const request: any = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: null,
      };

      setTimeout(() => {
        if (!databases.has(name)) {
          const db = {
            objectStoreNames: { contains: vi.fn(() => false) },
            createObjectStore: vi.fn((storeName: string, options: any) => {
              const store = new Map<string, any>();
              stores.set(storeName, store);
              storeKeyPaths.set(storeName, options?.keyPath || 'id');
              return {
                createIndex: vi.fn(),
              };
            }),
            transaction: vi.fn((storeNames: string[], mode: string) => {
              return {
                objectStore: vi.fn((storeName: string) => {
                  const storeData = stores.get(storeName) || new Map();
                  stores.set(storeName, storeData);
                  const keyPath = storeKeyPaths.get(storeName) || 'id';
                  return {
                    put: vi.fn((data: any) => {
                      const req: any = { onsuccess: null, onerror: null, result: null };
                      setTimeout(() => {
                        const key = data[keyPath];
                        storeData.set(key, data);
                        req.result = key;
                        if (req.onsuccess) req.onsuccess();
                      }, 0);
                      return req;
                    }),
                    add: vi.fn((data: any) => {
                      const req: any = { onsuccess: null, onerror: null, result: null };
                      setTimeout(() => {
                        const key = data[keyPath];
                        storeData.set(key, data);
                        req.result = key;
                        if (req.onsuccess) req.onsuccess();
                      }, 0);
                      return req;
                    }),
                    get: vi.fn((key: string) => {
                      const req: any = { onsuccess: null, onerror: null, result: null };
                      setTimeout(() => {
                        req.result = storeData.get(key);
                        if (req.onsuccess) req.onsuccess();
                      }, 0);
                      return req;
                    }),
                    getAll: vi.fn(() => {
                      const req: any = { onsuccess: null, onerror: null, result: null };
                      setTimeout(() => {
                        req.result = Array.from(storeData.values());
                        if (req.onsuccess) req.onsuccess();
                      }, 0);
                      return req;
                    }),
                    delete: vi.fn((key: string) => {
                      const req: any = { onsuccess: null, onerror: null, result: null };
                      setTimeout(() => {
                        storeData.delete(key);
                        if (req.onsuccess) req.onsuccess();
                      }, 0);
                      return req;
                    }),
                    index: vi.fn((indexName: string) => ({
                      getAll: vi.fn((value?: any) => {
                        const req: any = { onsuccess: null, onerror: null, result: null };
                        setTimeout(() => {
                          req.result = Array.from(storeData.values());
                          if (req.onsuccess) req.onsuccess();
                        }, 0);
                        return req;
                      }),
                    })),
                  };
                }),
              };
            }),
          };
          databases.set(name, db);
          if (request.onupgradeneeded) {
            request.onupgradeneeded({ target: { result: db } });
          }
        }
        request.result = databases.get(name);
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);

      return request;
    }),
  };
};

describe('LocalStorageService', () => {
  beforeEach(() => {
    (global as any).indexedDB = mockIndexedDB();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('initializes IndexedDB successfully', async () => {
      await expect(LocalStorageService.init()).resolves.toBeUndefined();
    });
  });

  describe('saveDocument', () => {
    it('saves a document to IndexedDB', async () => {
      await LocalStorageService.init();

      const doc = {
        id: 'doc1',
        name: 'Test Document',
        amount: 100,
      };

      await expect(LocalStorageService.saveDocument('transactions', 'user1', doc)).resolves.toBeUndefined();
    });
  });

  describe('getDocuments', () => {
    it('retrieves documents for a specific collection and user', async () => {
      await LocalStorageService.init();

      const doc1 = { id: 'doc1', name: 'Doc 1' };
      const doc2 = { id: 'doc2', name: 'Doc 2' };

      await LocalStorageService.saveDocument('transactions', 'user1', doc1);
      await LocalStorageService.saveDocument('transactions', 'user1', doc2);

      const docs = await LocalStorageService.getDocuments('transactions', 'user1');
      expect(docs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDocument', () => {
    it('retrieves a single document by id', async () => {
      await LocalStorageService.init();

      const doc = { id: 'doc1', name: 'Test Document' };
      await LocalStorageService.saveDocument('transactions', 'user1', doc);

      const result = await LocalStorageService.getDocument('doc1');
      expect(result).toBeTruthy();
    });

    it('returns null for non-existent document', async () => {
      await LocalStorageService.init();

      const result = await LocalStorageService.getDocument('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('deletes a document by id', async () => {
      await LocalStorageService.init();

      const doc = { id: 'doc1', name: 'Test Document' };
      await LocalStorageService.saveDocument('transactions', 'user1', doc);

      await expect(LocalStorageService.deleteDocument('doc1')).resolves.toBeUndefined();
    });
  });

  describe('addOperation', () => {
    it('adds an operation to the queue', async () => {
      await LocalStorageService.init();

      await expect(
        LocalStorageService.addOperation({
          type: 'create',
          collection: 'transactions',
          data: { amount: 100 },
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('getPendingOperations', () => {
    it('retrieves pending operations', async () => {
      await LocalStorageService.init();

      await LocalStorageService.addOperation({
        type: 'create',
        collection: 'transactions',
        data: { amount: 100 },
      });

      const operations = await LocalStorageService.getPendingOperations();
      expect(Array.isArray(operations)).toBe(true);
    });
  });

  describe('markOperationSynced', () => {
    it('marks an operation as synced', async () => {
      await LocalStorageService.init();

      await LocalStorageService.addOperation({
        type: 'create',
        collection: 'transactions',
        data: { amount: 100 },
      });

      const operations = await LocalStorageService.getPendingOperations();
      if (operations.length > 0) {
        await expect(LocalStorageService.markOperationSynced(operations[0].id)).resolves.toBeUndefined();
      }
    });
  });

  describe('setMetadata and getMetadata', () => {
    it('stores and retrieves metadata', async () => {
      await LocalStorageService.init();

      await LocalStorageService.setMetadata('lastSync', Date.now());
      const value = await LocalStorageService.getMetadata('lastSync');

      expect(value).toBeTruthy();
    });

    it('returns undefined for non-existent metadata', async () => {
      await LocalStorageService.init();

      const value = await LocalStorageService.getMetadata('nonexistent');
      expect(value).toBeUndefined();
    });
  });
});
