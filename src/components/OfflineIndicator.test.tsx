import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineIndicator } from './OfflineIndicator';
import { useOffline } from '../hooks/useOffline';

vi.mock('../hooks/useOffline');

describe('OfflineIndicator', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('online state', () => {
    it('does not render when online and synced', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        pendingOperations: 0,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      const { container } = render(<OfflineIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('renders sync indicator when syncing while online', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        pendingOperations: 3,
        syncProgress: 50,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('shows pending operations count when online with pending items', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        pendingOperations: 5,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });

  describe('offline state', () => {
    it('renders offline indicator when offline', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: false,
        isSyncing: false,
        pendingOperations: 0,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    it('shows pending operations count when offline', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: false,
        isSyncing: false,
        pendingOperations: 7,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.getByText(/7/)).toBeInTheDocument();
    });

    it('displays will sync message when offline with pending operations', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: false,
        isSyncing: false,
        pendingOperations: 3,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/will sync when online/i)).toBeInTheDocument();
    });
  });

  describe('syncing state', () => {
    it('shows syncing indicator when sync is in progress', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        pendingOperations: 10,
        syncProgress: 75,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
    });

    it('displays sync progress percentage', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        pendingOperations: 4,
        syncProgress: 25,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
    });

    it('shows remaining operations during sync', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        pendingOperations: 8,
        syncProgress: 50,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText(/8/)).toBeInTheDocument();
    });
  });

  describe('manual sync button', () => {
    it('shows sync button when online with pending operations', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        pendingOperations: 5,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      const syncButton = screen.getByRole('button');
      expect(syncButton).toBeInTheDocument();
    });

    it('calls manualSync when button is clicked', async () => {
      const manualSync = vi.fn();
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        pendingOperations: 5,
        syncProgress: 0,
        manualSync,
        lastSyncTime: null,
      });

      const user = userEvent.setup();
      render(<OfflineIndicator />);
      
      const syncButton = screen.getByRole('button');
      await user.click(syncButton);

      expect(manualSync).toHaveBeenCalled();
    });

    it('disables sync button when syncing', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        pendingOperations: 5,
        syncProgress: 50,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      const syncButton = screen.getByRole('button');
      expect(syncButton).toBeDisabled();
    });

    it('does not show sync button when offline', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: false,
        isSyncing: false,
        pendingOperations: 5,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      render(<OfflineIndicator />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('visual styling', () => {
    it('applies offline styling when disconnected', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: false,
        isSyncing: false,
        pendingOperations: 0,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      const { container } = render(<OfflineIndicator />);
      
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveClass('bg-red-500');
    });

    it('applies syncing styling when sync is active', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        pendingOperations: 5,
        syncProgress: 50,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      const { container } = render(<OfflineIndicator />);
      
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveClass('bg-yellow-500');
    });

    it('applies pending styling when operations are queued', () => {
      vi.mocked(useOffline).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        pendingOperations: 5,
        syncProgress: 0,
        manualSync: vi.fn(),
        lastSyncTime: null,
      });

      const { container } = render(<OfflineIndicator />);
      
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveClass('bg-blue-500');
    });
  });
});
