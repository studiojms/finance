import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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
