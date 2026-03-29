/**
 * Connection Service - Monitor online/offline status
 */

type ConnectionCallback = (isOnline: boolean) => void;

export class ConnectionService {
  private static listeners: ConnectionCallback[] = [];
  private static isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  static init(): void {
    if (typeof window === 'undefined') return;

    // Update state from navigator on init
    this.isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;

    window.addEventListener('online', () => {
      this.isOnlineState = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnlineState = false;
      this.notifyListeners();
    });

    // Ping server to verify actual connectivity
    this.startPingCheck();
  }

  static isOnline(): boolean {
    return this.isOnlineState;
  }

  static addListener(callback: ConnectionCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.isOnlineState));
  }

  private static startPingCheck(): void {
    // Check connection every 30 seconds
    setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}ping.txt`, {
          method: 'HEAD',
          cache: 'no-cache',
        });
        const wasOnline = this.isOnlineState;
        this.isOnlineState = response.ok;
        if (wasOnline !== this.isOnlineState) {
          this.notifyListeners();
        }
      } catch {
        const wasOnline = this.isOnlineState;
        this.isOnlineState = false;
        if (wasOnline !== this.isOnlineState) {
          this.notifyListeners();
        }
      }
    }, 30000);
  }
}
