import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Updates userId field on all accounts, transactions, and categories
 * to match the current logged-in user.
 *
 * USE WITH CAUTION: This will update ALL documents in the collections.
 */
export async function updateAllUserIds(newUserId: string) {
  if (!db) {
    console.error('Database not initialized');
    return;
  }

  const confirmed = window.confirm(
    `⚠️ ATENÇÃO!\n\nVocê está prestes a atualizar TODOS os registros no banco de dados para o userId:\n${newUserId}\n\nEsta ação afetará:\n- Todas as contas\n- Todas as transações\n- Todas as categorias\n\nDeseja continuar?`
  );

  if (!confirmed) {
    console.log('Migration cancelled by user');
    return;
  }

  try {
    console.log('[Migration] Starting userId update to:', newUserId);

    // Update accounts
    const accountsSnapshot = await getDocs(collection(db, 'accounts'));
    console.log('[Migration] Found accounts:', accountsSnapshot.size);

    const accountBatch = writeBatch(db);
    let accountCount = 0;
    accountsSnapshot.docs.forEach((docSnap) => {
      accountBatch.update(docSnap.ref, { userId: newUserId });
      accountCount++;
    });

    if (accountCount > 0) {
      await accountBatch.commit();
      console.log('[Migration] Updated', accountCount, 'accounts');
    }

    // Update transactions
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    console.log('[Migration] Found transactions:', transactionsSnapshot.size);

    let transactionBatch = writeBatch(db);
    let transactionCount = 0;
    let batchCount = 0;

    for (const docSnap of transactionsSnapshot.docs) {
      transactionBatch.update(docSnap.ref, { userId: newUserId });
      transactionCount++;
      batchCount++;

      // Firestore has a limit of 500 operations per batch
      if (batchCount === 500) {
        await transactionBatch.commit();
        console.log('[Migration] Committed batch of 500 transactions');
        transactionBatch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await transactionBatch.commit();
      console.log('[Migration] Updated', transactionCount, 'transactions');
    }

    // Update categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    console.log('[Migration] Found categories:', categoriesSnapshot.size);

    const categoryBatch = writeBatch(db);
    let categoryCount = 0;
    categoriesSnapshot.docs.forEach((docSnap) => {
      categoryBatch.update(docSnap.ref, { userId: newUserId });
      categoryCount++;
    });

    if (categoryCount > 0) {
      await categoryBatch.commit();
      console.log('[Migration] Updated', categoryCount, 'categories');
    }

    alert(
      `✅ Migração concluída!\n\n${accountCount} contas\n${transactionCount} transações\n${categoryCount} categorias\n\nTodos os registros agora pertencem ao usuário: ${newUserId}`
    );

    console.log('[Migration] Complete! Reloading page...');
    window.location.reload();
  } catch (error) {
    console.error('[Migration] Error:', error);
    alert('❌ Erro durante a migração. Verifique o console para mais detalhes.');
  }
}

// Add this to window for easy access in console
if (typeof window !== 'undefined') {
  (window as any).updateAllUserIds = updateAllUserIds;
}
