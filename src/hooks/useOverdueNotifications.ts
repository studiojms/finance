import { useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { NotificationService } from '../services/notificationService';

const NOTIFICATION_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const LAST_NOTIFICATION_KEY = 'lastOverdueNotificationDate';

export function useOverdueNotifications(transactions: Transaction[], enabled: boolean = true) {
  const lastCheckRef = useRef<Date | null>(null);
  const hasShownTodayRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !NotificationService.isSupported()) {
      return;
    }

    const checkAndNotify = () => {
      // Check if we've already shown a notification today
      const lastNotificationDate = localStorage.getItem(LAST_NOTIFICATION_KEY);
      const today = new Date().toDateString();

      if (lastNotificationDate === today) {
        hasShownTodayRef.current = true;
        return;
      }

      // Only check during business hours (8 AM - 8 PM)
      const currentHour = new Date().getHours();
      if (currentHour < 8 || currentHour >= 20) {
        return;
      }

      const overdueTransactions = NotificationService.checkOverdueTransactions(transactions);

      if (overdueTransactions.length > 0 && NotificationService.hasPermission()) {
        NotificationService.notifyOverdueTransactions(overdueTransactions);
        localStorage.setItem(LAST_NOTIFICATION_KEY, today);
        hasShownTodayRef.current = true;
      }
    };

    // Check immediately on mount (with delay to allow user to settle in)
    const initialTimeout = setTimeout(() => {
      if (!hasShownTodayRef.current) {
        checkAndNotify();
      }
    }, 5000); // Wait 5 seconds after app loads

    // Then check periodically
    const interval = setInterval(checkAndNotify, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [transactions, enabled]);

  const requestPermission = async (): Promise<void> => {
    const granted = await NotificationService.requestPermission();

    if (granted) {
      // Immediately check for overdue transactions after permission is granted
      const overdueTransactions = NotificationService.checkOverdueTransactions(transactions);
      if (overdueTransactions.length > 0) {
        NotificationService.notifyOverdueTransactions(overdueTransactions);
        localStorage.setItem(LAST_NOTIFICATION_KEY, new Date().toDateString());
        hasShownTodayRef.current = true;
      }
    }
  };

  const testNotification = () => {
    if (!NotificationService.hasPermission()) {
      console.warn('Notification permission not granted');
      return;
    }

    NotificationService.showNotification('Teste de Notificação', 'As notificações estão funcionando corretamente!');
  };

  return {
    requestPermission,
    testNotification,
    hasPermission: NotificationService.hasPermission(),
    isSupported: NotificationService.isSupported(),
  };
}
