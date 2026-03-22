import { auth } from '../firebase';

export const handleFirestoreError = (error: unknown, operation: string, path: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errorMessage,
    operationType: operation,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
};
