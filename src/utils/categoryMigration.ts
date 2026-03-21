import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';

const DEFAULT_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#a855f7',
  '#94a3b8',
  '#64748b',
  '#475569',
];

export async function ensureCategoriesHaveColors(userId: string): Promise<void> {
  if (!db) return;

  try {
    const q = query(collection(db, 'categories'), where('userId', '==', userId));
    const snap = await getDocs(q);

    const categoriesNeedingColors: { id: string; data: any }[] = [];
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.color || data.color === '#cbd5e1' || data.color === '') {
        categoriesNeedingColors.push({ id: docSnap.id, data });
      }
    });

    if (categoriesNeedingColors.length === 0) return;

    const batch = writeBatch(db);
    categoriesNeedingColors.forEach((cat, index) => {
      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const catRef = doc(db, 'categories', cat.id);
      batch.update(catRef, { color });
    });

    await batch.commit();
    console.log(`Updated ${categoriesNeedingColors.length} categories with colors`);
  } catch (err) {
    console.error('Error ensuring categories have colors:', err);
  }
}
