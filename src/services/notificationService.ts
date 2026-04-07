import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { Transaction } from '../types';
import { isBefore, startOfToday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

let messaging: Messaging | null = null;
let notificationPermission: NotificationPermission = 'default';

export const NotificationService = {
  async initialize(app: any): Promise<boolean> {
    if (!app) return false;

    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      messaging = getMessaging(app);
      notificationPermission = Notification.permission;

      if (notificationPermission === 'granted') {
        await this.registerServiceWorker();
        await this.setupMessageListener();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  },

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      notificationPermission = permission;

      if (permission === 'granted') {
        await this.registerServiceWorker();
        await this.setupMessageListener();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  },

  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  },

  async setupMessageListener(): Promise<void> {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);

      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'Notification',
          payload.notification.body || '',
          payload.notification.icon
        );
      }
    });
  },

  async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn('Messaging not initialized');
      return null;
    }

    try {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.warn('VAPID key not configured');
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  },

  showNotification(title: string, body: string, icon?: string): void {
    if (notificationPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: icon || '/finance-128.png',
        badge: '/finance-128.png',
        tag: 'overdue-transaction',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  },

  checkOverdueTransactions(transactions: Transaction[]): Transaction[] {
    const today = startOfToday();

    return transactions.filter((t) => !t.isConsolidated && isBefore(new Date(t.date), today));
  },

  notifyOverdueTransactions(overdueTransactions: Transaction[]): void {
    if (overdueTransactions.length === 0) return;

    const count = overdueTransactions.length;
    const title = count === 1 ? 'Transação Atrasada' : `${count} Transações Atrasadas`;

    let body: string;
    if (count === 1) {
      const transaction = overdueTransactions[0];
      const date = format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR });
      body = `${transaction.description} - ${date}`;
    } else {
      const totalAmount = overdueTransactions.reduce((sum, t) => {
        return sum + (t.type === 'expense' ? t.amount : 0);
      }, 0);

      body = `Você tem ${count} transações pendentes${
        totalAmount > 0 ? ` totalizando R$ ${totalAmount.toFixed(2)}` : ''
      }`;
    }

    this.showNotification(title, body);
  },

  hasPermission(): boolean {
    return notificationPermission === 'granted';
  },

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },
};
