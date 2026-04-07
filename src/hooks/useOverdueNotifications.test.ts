import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOverdueNotifications } from './useOverdueNotifications';
import { Transaction } from '../types';
import { NotificationService } from '../services/notificationService';

vi.mock('../services/notificationService', () => ({
  NotificationService: {
    isSupported: vi.fn(() => true),
    hasPermission: vi.fn(() => false),
    requestPermission: vi.fn(),
    checkOverdueTransactions: vi.fn(() => []),
    notifyOverdueTransactions: vi.fn(),
    showNotification: vi.fn(),
  },
}));

describe('useOverdueNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Test transaction',
      amount: 100,
      date: new Date().toISOString(),
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: false,
      userId: 'user1',
    },
  ];

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useOverdueNotifications(mockTransactions));

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(typeof result.current.requestPermission).toBe('function');
    expect(typeof result.current.testNotification).toBe('function');
  });

  it('does not check for notifications when disabled', () => {
    renderHook(() => useOverdueNotifications(mockTransactions, false));

    vi.advanceTimersByTime(6000);

    expect(NotificationService.checkOverdueTransactions).not.toHaveBeenCalled();
  });

  it('does not check for notifications when not supported', () => {
    vi.mocked(NotificationService.isSupported).mockReturnValue(false);

    renderHook(() => useOverdueNotifications(mockTransactions));

    vi.advanceTimersByTime(6000);

    expect(NotificationService.checkOverdueTransactions).not.toHaveBeenCalled();
  });

  it('calls requestPermission when permission is requested', async () => {
    vi.mocked(NotificationService.requestPermission).mockResolvedValue(true);
    vi.mocked(NotificationService.checkOverdueTransactions).mockReturnValue([]);

    const { result } = renderHook(() => useOverdueNotifications(mockTransactions));

    await result.current.requestPermission();

    expect(NotificationService.requestPermission).toHaveBeenCalled();
  });

  it('calls testNotification when test is triggered', () => {
    vi.mocked(NotificationService.hasPermission).mockReturnValue(true);

    const { result } = renderHook(() => useOverdueNotifications(mockTransactions));

    result.current.testNotification();

    expect(NotificationService.showNotification).toHaveBeenCalledWith(
      'Teste de Notificação',
      'As notificações estão funcionando corretamente!'
    );
  });

  it('does not show notification if permission not granted', () => {
    vi.mocked(NotificationService.hasPermission).mockReturnValue(false);

    const { result } = renderHook(() => useOverdueNotifications(mockTransactions));

    result.current.testNotification();

    expect(NotificationService.showNotification).not.toHaveBeenCalled();
  });
});
