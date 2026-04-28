# Supabase Migration Guide

This guide will help you migrate your Finance Pro application from Firebase to Supabase.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setting Up Supabase](#setting-up-supabase)
- [Running Database Migrations](#running-database-migrations)
- [Migrating Existing Data](#migrating-existing-data)
- [Switching to Supabase](#switching-to-supabase)
- [Authentication](#authentication)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

Finance Pro now supports both Firebase and Supabase as backend providers. You can switch between them by changing the `VITE_BACKEND` environment variable.

### Why Supabase?

- **Open Source**: Supabase is open source and can be self-hosted
- **PostgreSQL**: Built on PostgreSQL, a robust and mature database
- **Cost-Effective**: More predictable pricing compared to Firebase
- **SQL**: Full SQL support for complex queries

## Prerequisites

Before starting the migration, ensure you have:

1. A Supabase account (sign up at https://supabase.com)
2. Node.js 18 or higher installed
3. Your Firebase credentials (if migrating existing data)
4. Backup of your current Firebase data (recommended)

## Setting Up Supabase

### 1. Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Enter a project name and database password
5. Select a region close to your users
6. Click "Create new project"

### 2. Get Your Supabase Credentials

Once your project is created:

1. Go to Project Settings > API
2. Copy the following:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (starts with `eyJhbG...`)
   - Service Role Key (for migration only - keep this secret!)

### 3. Update Environment Variables

Update your `.env` file:

```env
# Backend Selection
VITE_BACKEND=supabase

# Supabase Configuration
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running Database Migrations

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI:

   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:

   ```bash
   supabase login
   ```

3. Link your project:

   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open the migration file: `supabase/migrations/001_initial_schema.sql`
4. Copy the contents and paste into the SQL Editor
5. Click "Run" to execute the migration

## Migrating Existing Data

If you have existing data in Firebase, use our migration tool to transfer it to Supabase.

### Step 1: Prepare for Migration

1. Make sure you have run the database migrations (see above)
2. Backup your Firebase data (optional but recommended)
3. Have your Firebase credentials ready

### Step 2: Run the Migration Script

```bash
npm run migrate:firebase-to-supabase
```

The script will:

1. Prompt you for Firebase credentials
2. Export all accounts, categories, and transactions from Firebase
3. Prompt you for Supabase credentials
4. Transform the data to match Supabase schema
5. Import the data to Supabase

### What Gets Migrated?

- ✅ All user accounts
- ✅ All categories (including custom user categories)
- ✅ All transactions (including installments and transfers)
- ✅ Account balances
- ✅ User associations

### Field Name Transformations

The migration automatically converts Firebase field names to Supabase conventions:

| Firebase (camelCase) | Supabase (snake_case) |
| -------------------- | --------------------- |
| `userId`             | `user_id`             |
| `accountId`          | `account_id`          |
| `categoryId`         | `category_id`         |
| `isConsolidated`     | `is_consolidated`     |
| `installmentId`      | `installment_id`      |
| `installmentNumber`  | `installment_number`  |
| `totalInstallments`  | `total_installments`  |
| `toAccountId`        | `to_account_id`       |

## Switching to Supabase

Once your database is set up and data is migrated:

1. Update your `.env` file:

   ```env
   VITE_BACKEND=supabase
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Restart your development server:

   ```bash
   npm run dev
   ```

3. The application will automatically use Supabase for all operations

## Authentication

### Email/Password Authentication

Supabase authentication works automatically. Users can:

- Sign up with email and password
- Sign in with email and password
- Reset their password
- Sign out

### Google OAuth

To enable Google OAuth in Supabase:

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`

### User Migration

Users will need to create new accounts in Supabase. There is no automatic user migration from Firebase Auth to Supabase Auth due to password hashing differences.

**Recommended approach:**

1. Set up both Firebase and Supabase backends temporarily
2. Notify users about the migration
3. Have users sign up for new accounts in Supabase
4. Migrate their data using the migration script
5. Gradually phase out Firebase

## Testing

### Running Tests

The codebase includes comprehensive tests for both Firebase and Supabase:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test
```

### Manual Testing Checklist

Test the following features after migration:

- [ ] User sign up
- [ ] User sign in
- [ ] User sign out
- [ ] Create account
- [ ] Edit account
- [ ] Delete account
- [ ] Create transaction
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Toggle transaction consolidated status
- [ ] Create category
- [ ] Edit category
- [ ] Delete category
- [ ] CSV import
- [ ] Dashboard view
- [ ] Transactions view
- [ ] Accounts view
- [ ] Categories view
- [ ] Manage view
- [ ] Offline functionality
- [ ] Data sync when back online

## Troubleshooting

### Common Issues

#### 1. "No database backend configured"

**Cause:** Environment variables not set correctly

**Solution:**

- Check that `VITE_BACKEND=supabase` in your `.env` file
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart your development server

#### 2. "Row Level Security policy violation"

**Cause:** RLS policies are enforced but user is not authenticated

**Solution:**

- Make sure the user is signed in
- Check that the migration script ran successfully
- Verify RLS policies in Supabase dashboard

#### 3. Migration script fails with "Invalid credentials"

**Cause:** Incorrect Firebase or Supabase credentials

**Solution:**

- Double-check all credentials
- For Supabase, use the Service Role Key (not the anon key) during migration
- Make sure Firebase project has read permissions enabled

#### 4. Data not showing after migration

**Cause:** RLS policies or user ID mismatch

**Solution:**

- Check browser console for errors
- Verify user is signed in
- Check that `user_id` fields match the authenticated user's ID
- Review RLS policies in SQL Editor

#### 5. Tests failing after migration

**Cause:** Mock configurations need updating

**Solution:**

- Check that test files mock the correct services
- Verify `isFirebase()` and `isSupabase()` are mocked correctly
- Clear test cache: `npm test -- --clearCache`

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Check the Supabase dashboard > Logs for server-side errors
3. Review the RLS policies in SQL Editor
4. Check that all migrations ran successfully

## Performance Considerations

### Indexes

The migration creates indexes on commonly queried fields:

- `user_id` on all tables
- `account_id` on transactions
- `category_id` on transactions
- `date` on transactions
- `installment_id` on transactions

### Query Optimization

Supabase uses PostgreSQL, which handles complex queries efficiently. The DatabaseService includes query caching to improve performance.

### Offline Support

The application continues to work offline with both Firebase and Supabase. Operations are queued and synchronized when the connection is restored.

## Next Steps

After successfully migrating to Supabase:

1. Monitor your Supabase dashboard for usage and performance
2. Set up database backups (Supabase > Database > Backups)
3. Configure rate limiting if needed
4. Consider setting up a staging environment for testing
5. Review and optimize RLS policies for your use case

## Rollback Plan

If you need to rollback to Firebase:

1. Update `.env`:
   ```env
   VITE_BACKEND=firebase
   ```
2. Restore Firebase credentials in `.env`
3. Restart your application

The application will automatically switch back to Firebase.

---

**Need help?** Check the main [README.md](README.md) or create an issue in the repository.
