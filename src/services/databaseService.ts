import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db as firebaseDb } from '../firebase';
import { supabase } from '../supabase';
import { isFirebase, isSupabase } from '../config';
import { LocalStorageService } from './localStorageService';
import { ConnectionService } from './connectionService';

export interface DatabaseDocument {
  id: string;
  [key: string]: any;
}

export class DatabaseService {
  static subscribeToCollection(
    collectionName: string,
    userId: string,
    constraints: any[],
    callback: (data: DatabaseDocument[]) => void
  ): () => void {
    // Load cached data first
    this.loadCachedData(collectionName, userId).then((cachedData) => {
      if (cachedData.length > 0) {
        callback(cachedData);
      }
    });

    if (isFirebase() && firebaseDb) {
      const q = query(collection(firebaseDb, collectionName), where('userId', '==', userId), ...constraints);

      return onSnapshot(q, async (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DatabaseDocument[];

        // Cache data locally
        for (const document of data) {
          await LocalStorageService.saveDocument(collectionName, userId, document);
        }

        callback(data);
      });
    } else if (isSupabase() && supabase) {
      let queryBuilder: any = supabase.from(collectionName).select('*').eq('user_id', userId);

      constraints.forEach((constraint: any) => {
        if (constraint.type === 'orderBy') {
          queryBuilder = queryBuilder.order(constraint.field, {
            ascending: constraint.direction === 'asc',
          });
        }
      });

      const subscription = supabase
        .channel(`${collectionName}_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: collectionName,
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryBuilder.then(async ({ data }: any) => {
              if (data) {
                const documents = data.map((item: any) => ({ id: item.id, ...item }));

                // Cache data locally
                for (const document of documents) {
                  await LocalStorageService.saveDocument(collectionName, userId, document);
                }

                callback(documents);
              }
            });
          }
        )
        .subscribe();

      queryBuilder.then(async ({ data }: any) => {
        if (data) {
          const documents = data.map((item: any) => ({ id: item.id, ...item }));

          // Cache data locally
          for (const document of documents) {
            await LocalStorageService.saveDocument(collectionName, userId, document);
          }

          callback(documents);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    return () => {};
  }

  private static async loadCachedData(collectionName: string, userId: string): Promise<DatabaseDocument[]> {
    try {
      const documents = await LocalStorageService.getDocuments(collectionName, userId);
      return documents.map((doc) => {
        const { collection, timestamp, ...rest } = doc;
        return rest as DatabaseDocument;
      });
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return [];
    }
  }

  static async addDocument(collectionName: string, data: any): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const documentWithId = { ...data, id: tempId };

    // Save to local storage immediately
    await LocalStorageService.saveDocument(collectionName, data.userId || '', documentWithId);

    if (!ConnectionService.isOnline()) {
      // Queue for later sync
      await LocalStorageService.addOperation({
        type: 'create',
        collection: collectionName,
        data,
      });
      return tempId;
    }

    try {
      if (isFirebase() && firebaseDb) {
        const docRef = await addDoc(collection(firebaseDb, collectionName), data);
        // Update local storage with real ID
        await LocalStorageService.deleteDocument(tempId);
        await LocalStorageService.saveDocument(collectionName, data.userId || '', {
          ...data,
          id: docRef.id,
        });
        return docRef.id;
      } else if (isSupabase() && supabase) {
        const { data: result, error } = await supabase.from(collectionName).insert([data]).select().single();
        if (error) throw error;
        // Update local storage with real ID
        await LocalStorageService.deleteDocument(tempId);
        await LocalStorageService.saveDocument(collectionName, data.userId || '', result);
        return result.id;
      }
    } catch (error) {
      console.error('Failed to add document online, queuing for sync:', error);
      // Queue for later sync
      await LocalStorageService.addOperation({
        type: 'create',
        collection: collectionName,
        data,
      });
      return tempId;
    }

    throw new Error('No database backend configured');
  }

  static async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    // Update local storage immediately
    const existingDoc = await LocalStorageService.getDocument(docId);
    if (existingDoc) {
      await LocalStorageService.saveDocument(collectionName, (existingDoc as { userId?: string }).userId || '', {
        ...existingDoc,
        ...data,
      } as Record<string, unknown>);
    }

    if (!ConnectionService.isOnline()) {
      // Queue for later sync
      await LocalStorageService.addOperation({
        type: 'update',
        collection: collectionName,
        documentId: docId,
        data,
      });
      return;
    }

    try {
      if (isFirebase() && firebaseDb) {
        await updateDoc(doc(firebaseDb, collectionName, docId), data);
      } else if (isSupabase() && supabase) {
        const { error } = await supabase.from(collectionName).update(data).eq('id', docId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to update document online, queuing for sync:', error);
      // Queue for later sync
      await LocalStorageService.addOperation({
        type: 'update',
        collection: collectionName,
        documentId: docId,
        data,
      });
    }
  }

  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    // Delete from local storage immediately
    await LocalStorageService.deleteDocument(docId);

    if (!ConnectionService.isOnline()) {
      // Queue for later sync
      await LocalStorageService.addOperation({
        type: 'delete',
        collection: collectionName,
        documentId: docId,
      });
      return;
    }

    try {
      if (isFirebase() && firebaseDb) {
        await deleteDoc(doc(firebaseDb, collectionName, docId));
      } else if (isSupabase() && supabase) {
        const { error } = await supabase.from(collectionName).delete().eq('id', docId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to delete document online, queuing for sync:', error);
      // Queue for later sync
      await LocalStorageService.addOperation({
        type: 'delete',
        collection: collectionName,
        documentId: docId,
      });
    }
  }

  static async getDocument(collectionName: string, docId: string): Promise<DatabaseDocument | null> {
    // Try local storage first
    const cachedDoc = await LocalStorageService.getDocument(docId);
    if (cachedDoc && !ConnectionService.isOnline()) {
      const { collection, timestamp, ...rest } = cachedDoc as Record<string, unknown> & {
        collection?: string;
        timestamp?: number;
      };
      return rest as DatabaseDocument;
    }

    if (isFirebase() && firebaseDb) {
      const docSnap = await getDoc(doc(firebaseDb, collectionName, docId));
      if (docSnap.exists()) {
        const document = { id: docSnap.id, ...docSnap.data() } as DatabaseDocument;
        // Cache it
        await LocalStorageService.saveDocument(collectionName, document.userId || '', document);
        return document;
      }
      return null;
    } else if (isSupabase() && supabase) {
      const { data, error } = await supabase.from(collectionName).select('*').eq('id', docId).single();
      if (error) throw error;
      const document = data ? { id: data.id, ...data } : null;
      if (document) {
        // Cache it
        await LocalStorageService.saveDocument(collectionName, document.user_id || '', document);
      }
      return document;
    }

    return cachedDoc ? (cachedDoc as DatabaseDocument) : null;
  }

  static async queryDocuments(collectionName: string, constraints: any[]): Promise<DatabaseDocument[]> {
    if (!ConnectionService.isOnline()) {
      // Return cached data when offline
      return this.loadCachedData(collectionName, '');
    }

    if (isFirebase() && firebaseDb) {
      const q = query(collection(firebaseDb, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DatabaseDocument[];

      // Cache documents
      for (const document of documents) {
        await LocalStorageService.saveDocument(collectionName, document.userId || '', document);
      }

      return documents;
    } else if (isSupabase() && supabase) {
      let queryBuilder: any = supabase.from(collectionName).select('*');

      constraints.forEach((constraint: any) => {
        if (constraint.type === 'where') {
          queryBuilder = queryBuilder.eq(constraint.field, constraint.value);
        } else if (constraint.type === 'orderBy') {
          queryBuilder = queryBuilder.order(constraint.field, {
            ascending: constraint.direction === 'asc',
          });
        }
      });

      const { data, error } = await queryBuilder;
      if (error) throw error;
      const documents = data?.map((item: any) => ({ id: item.id, ...item })) || [];

      // Cache documents
      for (const document of documents) {
        await LocalStorageService.saveDocument(collectionName, document.user_id || '', document);
      }

      return documents;
    }
    return [];
  }

  static async bulkDeleteUserDocuments(collectionName: string, userId: string): Promise<number> {
    let deletedCount = 0;

    if (!ConnectionService.isOnline()) {
      const cachedDocuments = await this.loadCachedData(collectionName, userId);
      for (const document of cachedDocuments) {
        await LocalStorageService.deleteDocument(document.id);
        await LocalStorageService.addOperation({
          type: 'delete',
          collection: collectionName,
          documentId: document.id,
        });
        deletedCount++;
      }
      return deletedCount;
    }

    if (isFirebase() && firebaseDb) {
      const q = query(collection(firebaseDb, collectionName), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const batchSize = 500;
      const batches: any[] = [];
      let currentBatch = writeBatch(firebaseDb);
      let operationCount = 0;

      snapshot.docs.forEach((docSnapshot) => {
        currentBatch.delete(docSnapshot.ref);
        operationCount++;
        deletedCount++;

        if (operationCount >= batchSize) {
          batches.push(currentBatch);
          currentBatch = writeBatch(firebaseDb);
          operationCount = 0;
        }
      });

      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      await Promise.all(batches.map((batch) => batch.commit()));

      for (const docSnapshot of snapshot.docs) {
        await LocalStorageService.deleteDocument(docSnapshot.id);
      }
    } else if (isSupabase() && supabase) {
      const { data, error } = await supabase.from(collectionName).delete().eq('user_id', userId).select();
      if (error) throw error;
      deletedCount = data?.length || 0;

      if (data) {
        for (const document of data) {
          await LocalStorageService.deleteDocument(document.id);
        }
      }
    }

    return deletedCount;
  }

  static createTimestamp(date?: Date): any {
    if (isFirebase()) {
      return date ? Timestamp.fromDate(date) : Timestamp.now();
    } else if (isSupabase()) {
      return (date || new Date()).toISOString();
    }
    return new Date();
  }

  /**
   * Execute a batch write operation with offline support
   * When offline, operations are queued and data is saved to local storage
   */
  static async executeBatchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      documentId?: string;
      data?: any;
    }>
  ): Promise<void> {
    // Save to local storage immediately (optimistic update)
    for (const operation of operations) {
      const { type, collection: collectionName, documentId, data } = operation;

      if (type === 'create' && data) {
        const tempId = documentId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await LocalStorageService.saveDocument(collectionName, data.userId || '', { ...data, id: tempId });
      } else if (type === 'update' && documentId && data) {
        const existingDoc = await LocalStorageService.getDocument(documentId);
        if (existingDoc) {
          await LocalStorageService.saveDocument(collectionName, (existingDoc as any).userId || '', {
            ...existingDoc,
            ...data,
          });
        }
      } else if (type === 'delete' && documentId) {
        await LocalStorageService.deleteDocument(documentId);
      }
    }

    // If offline, queue for later sync
    if (!ConnectionService.isOnline()) {
      for (const operation of operations) {
        await LocalStorageService.addOperation(operation);
      }
      return;
    }

    // Execute online
    try {
      if (isFirebase() && firebaseDb) {
        const batch = writeBatch(firebaseDb);

        for (const operation of operations) {
          const { type, collection: collectionName, documentId, data } = operation;

          if (type === 'create' && data) {
            const docRef = documentId
              ? doc(firebaseDb, collectionName, documentId)
              : doc(collection(firebaseDb, collectionName));
            batch.set(docRef, data);
          } else if (type === 'update' && documentId && data) {
            const docRef = doc(firebaseDb, collectionName, documentId);
            batch.update(docRef, data);
          } else if (type === 'delete' && documentId) {
            const docRef = doc(firebaseDb, collectionName, documentId);
            batch.delete(docRef);
          }
        }

        await batch.commit();
      } else if (isSupabase() && supabase) {
        // Supabase doesn't have batch operations, execute sequentially
        for (const operation of operations) {
          const { type, collection: collectionName, documentId, data } = operation;

          if (type === 'create') {
            await supabase.from(collectionName).insert([data]);
          } else if (type === 'update' && documentId) {
            await supabase.from(collectionName).update(data).eq('id', documentId);
          } else if (type === 'delete' && documentId) {
            await supabase.from(collectionName).delete().eq('id', documentId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to execute batch online, queuing for sync:', error);
      // Queue for later sync on error
      for (const operation of operations) {
        await LocalStorageService.addOperation(operation);
      }
      throw error; // Re-throw so caller knows it failed
    }
  }

  static timestampToDate(timestamp: any): Date {
    if (isFirebase()) {
      return timestamp?.toDate?.() || new Date(timestamp);
    } else if (isSupabase()) {
      return new Date(timestamp);
    }
    return new Date(timestamp);
  }
}
