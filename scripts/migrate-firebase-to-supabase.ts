#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

async function getFirebaseConfig(): Promise<FirebaseConfig> {
  console.log('\n=== Firebase Configuration ===');
  return {
    apiKey: await question('Firebase API Key: '),
    authDomain: await question('Firebase Auth Domain: '),
    projectId: await question('Firebase Project ID: '),
    storageBucket: await question('Firebase Storage Bucket: '),
    messagingSenderId: await question('Firebase Messaging Sender ID: '),
    appId: await question('Firebase App ID: '),
  };
}

async function getSupabaseConfig(): Promise<SupabaseConfig> {
  console.log('\n=== Supabase Configuration ===');
  return {
    url: await question('Supabase URL: '),
    serviceKey: await question('Supabase Service Role Key (not anon key): '),
  };
}

function transformAccountData(firebaseData: any): any {
  return {
    id: firebaseData.id,
    name: firebaseData.name,
    type: firebaseData.type,
    balance: firebaseData.balance || 0,
    color: firebaseData.color,
    user_id: firebaseData.userId,
  };
}

function transformCategoryData(firebaseData: any): any {
  return {
    id: firebaseData.id,
    name: firebaseData.name,
    icon: firebaseData.icon,
    color: firebaseData.color,
    type: firebaseData.type,
    user_id: firebaseData.userId,
  };
}

function transformTransactionData(firebaseData: any): any {
  return {
    id: firebaseData.id,
    description: firebaseData.description,
    amount: firebaseData.amount,
    date: firebaseData.date,
    category_id: firebaseData.categoryId,
    account_id: firebaseData.accountId,
    type: firebaseData.type,
    is_consolidated: firebaseData.isConsolidated || false,
    user_id: firebaseData.userId,
    installment_id: firebaseData.installmentId || null,
    installment_number: firebaseData.installmentNumber || null,
    total_installments: firebaseData.totalInstallments || null,
    to_account_id: firebaseData.toAccountId || null,
  };
}

async function exportFromFirebase(firebaseConfig: FirebaseConfig) {
  console.log('\n=== Exporting from Firebase ===');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const accounts: any[] = [];
  const categories: any[] = [];
  const transactions: any[] = [];

  console.log('Fetching accounts...');
  const accountsSnapshot = await getDocs(collection(db, 'accounts'));
  accountsSnapshot.forEach((doc) => {
    accounts.push({ id: doc.id, ...doc.data() });
  });
  console.log(`  Found ${accounts.length} accounts`);

  console.log('Fetching categories...');
  const categoriesSnapshot = await getDocs(collection(db, 'categories'));
  categoriesSnapshot.forEach((doc) => {
    categories.push({ id: doc.id, ...doc.data() });
  });
  console.log(`  Found ${categories.length} categories`);

  console.log('Fetching transactions...');
  const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
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

  const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceKey);

  console.log('Importing accounts...');
  const transformedAccounts = data.accounts.map(transformAccountData);
  const { error: accountsError } = await supabase.from('accounts').upsert(transformedAccounts);
  if (accountsError) {
    console.error('Error importing accounts:', accountsError);
    throw accountsError;
  }
  console.log(`  Imported ${transformedAccounts.length} accounts`);

  console.log('Importing categories...');
  const transformedCategories = data.categories.map(transformCategoryData);
  const { error: categoriesError } = await supabase.from('categories').upsert(transformedCategories);
  if (categoriesError) {
    console.error('Error importing categories:', categoriesError);
    throw categoriesError;
  }
  console.log(`  Imported ${transformedCategories.length} categories`);

  console.log('Importing transactions (in batches of 1000)...');
  const transformedTransactions = data.transactions.map(transformTransactionData);
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
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Finance Pro: Firebase to Supabase Migration Tool   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\nThis tool will migrate your data from Firebase to Supabase.');
  console.log('You will need:');
  console.log('  1. Firebase credentials (API key, project ID, etc.)');
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
    const firebaseConfig = await getFirebaseConfig();
    const supabaseConfig = await getSupabaseConfig();

    const data = await exportFromFirebase(firebaseConfig);

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
