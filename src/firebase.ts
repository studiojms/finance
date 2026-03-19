import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { APP_CONFIG } from './config';

let app: any = null;
let db: any = null;
let auth: any = null;

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
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed-precondition');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence unimplemented');
      }
    });
  }
}

export { db, auth };
