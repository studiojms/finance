import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

function installMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? (data.get(key) ?? null) : null;
    },
    setItem(key: string, value: string) {
      data.set(key, String(value));
    },
    removeItem(key: string) {
      data.delete(key);
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
  };
}

function ensureWorkingStorage(name: 'localStorage' | 'sessionStorage') {
  const candidate = globalThis[name];
  if (!candidate || typeof candidate.getItem !== 'function') {
    const storage = installMemoryStorage();
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: storage,
    });
  }
}

ensureWorkingStorage('localStorage');
ensureWorkingStorage('sessionStorage');

// Mock indexedDB for tests
const mockIndexedDB = {
  open: vi.fn(() => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(),
          get: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          delete: vi.fn(),
          getAll: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
        })),
      })),
      createObjectStore: vi.fn(),
    },
  })),
};

global.indexedDB = mockIndexedDB as any;

afterEach(() => {
  cleanup();
});
