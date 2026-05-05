import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { APP_CONFIG } from './config';
import { NotificationService } from './services/notificationService';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

if (APP_CONFIG.backend === 'firebase' && APP_CONFIG.firebase.apiKey) {
  app = initializeApp(APP_CONFIG.firebase);

  // Connect to named database if specified, otherwise use default
  if (APP_CONFIG.firebase.databaseId) {
    db = getFirestore(app, APP_CONFIG.firebase.databaseId);
  } else {
    db = getFirestore(app);
  }

  auth = getAuth(app);

  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore multi-tab persistence failed: Another tab may already have persistence enabled');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence is not available in this browser');
      } else {
        console.warn('Failed to enable Firestore persistence:', err);
      }
    });

    if (APP_CONFIG.firebase.measurementId) {
      analytics = getAnalytics(app);
    }

    // Initialize push notifications
    NotificationService.initialize(app).catch((err) => {
      console.warn('Failed to initialize push notifications:', err);
    });
  }
}

export { db, auth, analytics, logEvent, app };
