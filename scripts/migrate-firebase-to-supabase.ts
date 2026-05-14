#!/usr/bin/env node

import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

async function getFirebaseServiceAccountPath(): Promise<string> {
  console.log('\n=== Firebase Service Account ===');
  console.log('You need a Firebase service account JSON key file.');
  console.log('Download it from: Firebase Console > Project Settings > Service Accounts');
  console.log('> Generate New Private Key\n');

  const path = await question('Path to service account JSON file: ');

  if (!fs.existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }

  return path;
}

async function getSupabaseConfig(): Promise<SupabaseConfig> {
  console.log('\n=== Supabase Configuration ===');
  return {
    url: await question('Supabase URL: '),
    serviceKey: await question('Supabase Service Role Key (not anon key): '),
  };
}

function transformAccountData(firebaseData: any, idMap: Map<string, string>, userIdMap: Map<string, string>): any {
  const newId = randomUUID();
  idMap.set(firebaseData.id, newId);

  // Map Firebase user ID to a UUID
  if (!userIdMap.has(firebaseData.userId)) {
    userIdMap.set(firebaseData.userId, randomUUID());
  }

  return {
    id: newId,
    name: firebaseData.name,
    type: firebaseData.type,
    balance: firebaseData.balance || 0,
    color: firebaseData.color,
    user_id: userIdMap.get(firebaseData.userId),
  };
}

function transformCategoryData(firebaseData: any, idMap: Map<string, string>, userIdMap: Map<string, string>): any {
  const newId = randomUUID();
  idMap.set(firebaseData.id, newId);

  // Map Firebase user ID to a UUID (if not a default category)
  if (firebaseData.userId) {
    if (!userIdMap.has(firebaseData.userId)) {
      userIdMap.set(firebaseData.userId, randomUUID());
    }
  }

  return {
    id: newId,
    name: firebaseData.name,
    icon: firebaseData.icon,
    color: firebaseData.color,
    type: firebaseData.type,
    user_id: firebaseData.userId ? userIdMap.get(firebaseData.userId) : null,
  };
}

function transformTransactionData(
  firebaseData: any,
  accountIdMap: Map<string, string>,
  categoryIdMap: Map<string, string>,
  userIdMap: Map<string, string>
): any {
  // Map Firebase user ID to a UUID
  if (!userIdMap.has(firebaseData.userId)) {
    userIdMap.set(firebaseData.userId, randomUUID());
  }

  return {
    id: randomUUID(),
    description: firebaseData.description,
    amount: firebaseData.amount,
    date: firebaseData.date,
    category_id: firebaseData.categoryId ? categoryIdMap.get(firebaseData.categoryId) : null,
    account_id: accountIdMap.get(firebaseData.accountId),
    type: firebaseData.type,
    is_consolidated: firebaseData.isConsolidated || false,
    user_id: userIdMap.get(firebaseData.userId),
    installment_id: firebaseData.installmentId || null,
    installment_number: firebaseData.installmentNumber || null,
    total_installments: firebaseData.totalInstallments || null,
    to_account_id: firebaseData.toAccountId ? accountIdMap.get(firebaseData.toAccountId) : null,
  };
}

async function exportFromFirebase(serviceAccountPath: string) {
  console.log('\n=== Exporting from Firebase ===');

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  const accounts: any[] = [];
  const categories: any[] = [];
  const transactions: any[] = [];

  console.log('Fetching accounts...');
  const accountsSnapshot = await db.collection('accounts').get();
  accountsSnapshot.forEach((doc) => {
    accounts.push({ id: doc.id, ...doc.data() });
  });
  console.log(`  Found ${accounts.length} accounts`);

  console.log('Fetching categories...');
  const categoriesSnapshot = await db.collection('categories').get();
  categoriesSnapshot.forEach((doc) => {
    categories.push({ id: doc.id, ...doc.data() });
  });
  console.log(`  Found ${categories.length} categories`);

  console.log('Fetching transactions...');
  const transactionsSnapshot = await db.collection('transactions').get();
  transactionsSnapshot.forEach((doc) => {
    transactions.push({ id: doc.id, ...doc.data() });
  });
  console.log(`  Found ${transactions.length} transactions`);

  return { accounts, categories, transactions };
}

async function importToSupabase(
  supabaseConfig: SupabaseConfig,
  data: { accounts: any[]; categories: any[]; transactions: any[] }
) {
  console.log('\n=== Importing to Supabase ===');
  console.log('\n⚠️  IMPORTANT: Before proceeding, run this SQL in Supabase SQL Editor:');
  console.log('');
  console.log('ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;');
  console.log('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;');
  console.log('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;');
  console.log('');

  const proceed = await question('Have you run the SQL above? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\nMigration cancelled. Please run the SQL first, then try again.');
    throw new Error('Foreign key constraints need to be dropped first');
  }

  const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceKey);

  // Create ID mappings for relationships
  const accountIdMap = new Map<string, string>();
  const categoryIdMap = new Map<string, string>();
  const userIdMap = new Map<string, string>();

  console.log('\nImporting accounts...');
  const transformedAccounts = data.accounts.map((account) => transformAccountData(account, accountIdMap, userIdMap));
  const { error: accountsError } = await supabase.from('accounts').upsert(transformedAccounts);
  if (accountsError) {
    console.error('Error importing accounts:', accountsError);
    throw accountsError;
  }
  console.log(`  Imported ${transformedAccounts.length} accounts`);

  console.log('Importing categories...');
  const transformedCategories = data.categories.map((category) =>
    transformCategoryData(category, categoryIdMap, userIdMap)
  );
  const { error: categoriesError } = await supabase.from('categories').upsert(transformedCategories);
  if (categoriesError) {
    console.error('Error importing categories:', categoriesError);
    throw categoriesError;
  }
  console.log(`  Imported ${transformedCategories.length} categories`);

  console.log('Importing transactions (in batches of 1000)...');
  const transformedTransactions = data.transactions.map((transaction) =>
    transformTransactionData(transaction, accountIdMap, categoryIdMap, userIdMap)
  );
  const batchSize = 1000;
  for (let i = 0; i < transformedTransactions.length; i += batchSize) {
    const batch = transformedTransactions.slice(i, i + batchSize);
    const { error: transactionsError } = await supabase.from('transactions').upsert(batch);
    if (transactionsError) {
      console.error('Error importing transactions batch:', transactionsError);
      throw transactionsError;
    }
    console.log(`  Imported batch ${Math.floor(i / batchSize) + 1} (${batch.length} transactions)`);
  }
  console.log(`  Total: ${transformedTransactions.length} transactions imported`);

  console.log('\n⚠️  Important Notes:');
  console.log(`  - ${userIdMap.size} unique user(s) were migrated`);
  console.log('  - User IDs were converted to UUIDs');
  console.log('  - Users will need to create new accounts in Supabase Auth');
  console.log('  - After users sign up, you will need to manually update user_id fields');
  console.log('  - Or remove the user_id foreign key constraints in your schema');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Finance Pro: Firebase to Supabase Migration Tool   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\nThis tool will migrate your data from Firebase to Supabase.');
  console.log('You will need:');
  console.log('  1. Firebase service account JSON key file');
  console.log('  2. Supabase credentials (URL and Service Role key)');
  console.log('\n⚠️  Make sure you have already run the Supabase migrations!');
  console.log('   Run: npx supabase migration up\n');

  const proceed = await question('Do you want to proceed? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('Migration cancelled.');
    rl.close();
    return;
  }

  try {
    const serviceAccountPath = await getFirebaseServiceAccountPath();
    const supabaseConfig = await getSupabaseConfig();

    const data = await exportFromFirebase(serviceAccountPath);

    console.log('\n=== Migration Summary ===');
    console.log(`  Accounts:     ${data.accounts.length}`);
    console.log(`  Categories:   ${data.categories.length}`);
    console.log(`  Transactions: ${data.transactions.length}`);

    const confirmImport = await question('\nProceed with import to Supabase? (yes/no): ');
    if (confirmImport.toLowerCase() !== 'yes' && confirmImport.toLowerCase() !== 'y') {
      console.log('Import cancelled. Data was not migrated.');
      rl.close();
      return;
    }

    await importToSupabase(supabaseConfig, data);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Update your .env file to set VITE_BACKEND=supabase');
    console.log('  2. Add your Supabase URL and anon key to .env');
    console.log('  3. Restart your application');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    rl.close();
  }
}

main();
