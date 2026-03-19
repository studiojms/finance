# GitHub Pages Deployment Setup

This repository is configured to automatically deploy to GitHub Pages when changes are pushed to the `main` branch.

## Initial Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

### 2. Configure Repository Secrets

Add the following secrets in **Settings** → **Secrets and variables** → **Actions**:

**Required Firebase Secrets:**endpoint

```
VITE_BACKEND=firebase
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
VITE_FIREBASE_DATABASE_ID=your_database_id (optional, if using named database)
```

**Alternative: Supabase Secrets:**

```
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Update Base Path in vite.config.ts

The `vite.config.ts` is already configured with a base path. Make sure to update the repository name:

```typescript
// Change 'finance-pro' to your actual repository name
base: process.env.GITHUB_PAGES === 'true' ? '/your-repo-name/' : '/',
```

### 4. Deploy

The deployment workflow (`.github/workflows/deploy.yml`) is configured for manual deployment only.

**Manual Deployment:**
Trigger deployments from the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.

## Accessing Your Site

After deployment, your site will be available at:

```
https://your-username.github.io/your-repo-name/
```

## Workflow Details

The workflow runs on:

- Manual trigger only via GitHub Actions UI

**Build Process:**

1. Checkout code
2. Setup Node.js 20 with Yarn cache
3. Install dependencies
4. Build with environment variables
5. Upload build artifacts
6. Deploy to GitHub Pages

## Troubleshooting

### Build Fails

- Check that all required secrets are configured
- Verify the secret names match exactly (case-sensitive)
- Check the Actions tab for detailed error logs

### 404 Page Not Found

- Ensure the base path in `vite.config.ts` matches your repository name
- Check that GitHub Pages source is set to "GitHub Actions"

### Firebase Auth Domain Error

- Add your GitHub Pages URL to Firebase Console:
  - Go to **Authentication** → **Settings** → **Authorized domains**
  - Add: `your-username.github.io`

## Local Testing with GitHub Pages Base Path

To test with the production base path locally:

```bash
GITHUB_PAGES=true yarn build
yarn preview
```

## Updating Deployment

To deploy a new version, manually trigger the workflow from the **Actions** tab. The deployment process typically takes 2-3 minutes.

## Monitoring

- View deployment status: **Actions** tab
- View live site: Navigate to the GitHub Pages URL
- Check deployment history: **Settings** → **Pages** → **View deployments**
