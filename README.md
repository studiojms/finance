# Finanças Pro 💰

A modern, comprehensive personal finance management application built with React, TypeScript, with support for Firebase and Supabase. Track your accounts, manage transactions, visualize spending patterns, and maintain full control of your financial life.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.0-blue)
![Vite](https://img.shields.io/badge/Vite-6.2-purple)

## Features ✨

- **Account Management**: Create and manage multiple accounts (checking, savings, credit cards, cash, investments)
- **Transaction Tracking**: Record income, expenses, and transfers between accounts
- **Categories & Filters**: Organize transactions with customizable categories and powerful filtering
- **Dashboard**: Real-time overview of your financial status with charts and summaries
- **Recurring Transactions**: Set up recurring income/expenses with various frequencies
- **Installment Payments**: Split purchases into installments with automatic tracking
- **Data Visualization**: Interactive charts to understand spending patterns
- **Multiple Backends**: Choose between Firebase or Supabase for authentication and database
- **Local Database**: PostgreSQL for local development with Docker
- **Offline Mode**: Full offline support with automatic data synchronization
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **PWA Support**: Install as a Progressive Web App for offline access

## Tech Stack 🛠️

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Motion (Framer Motion)
- **Backend Options**:
  - Firebase (Firestore, Authentication)
  - Supabase (PostgreSQL, Authentication)
  - Local PostgreSQL (Docker)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Testing**: Vitest, React Testing Library
- **Containerization**: Docker, Docker Compose

## Prerequisites 📋

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker & Docker Compose** (for local database and containerized deployment)

## Architecture 🏗️

This application supports two different backends:

### Firebase

- Authentication: Firebase Auth (Google OAuth, Email/Password)
- Database: Firestore (NoSQL)
- Ideal for: Quick deployment, automatic scalability

### Supabase

- Authentication: Supabase Auth (OAuth, Email/Password)
- Database: PostgreSQL (SQL)
- Ideal for: Full control, complex queries, local development

## Local Environment Setup 🚀

### 1. Clone the Repository

```bash
git clone <repository-url>
cd finance-pro
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment Variables

Copy the example file and configure:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and choose your backend:

#### Option A: Firebase (Default)

```env
# Choose the backend
VITE_BACKEND=firebase

# Configure your Firebase credentials
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Firebase Setup:**

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password and Google)
3. Create a **Firestore Database**
4. Copy the configuration to `.env.local`

#### Option B: Supabase

```env
# Choose the backend
VITE_BACKEND=supabase

# For Supabase Cloud
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OR for Local Supabase (Docker)
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

**Supabase Cloud Setup:**

1. Create a project at [Supabase](https://supabase.com/)
2. Copy the project URL and anon key
3. Run the schema migrations (SQL in `docker/init.sql`)

**Local Supabase Setup:**

1. Uncomment Supabase services in `docker-compose.yml`
2. Configure `JWT_SECRET` in `.env.local`
3. Run `docker-compose up -d`

### 4. Run with Docker (Recommended) 🐳

Docker Compose already includes a local PostgreSQL database:

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (cleans the database)
docker-compose down -v
```

The application will be available at `http://localhost:3000`

PostgreSQL will be at `localhost:5432` with:

- Database: `finance_pro`
- User: `postgres`
- Password: `postgres`

### 5. Run Locally (Development)

```bash
# Start only the database
docker-compose up -d postgres

# In another terminal, run the application
yarn dev
```

The application will be available at `http://localhost:3000`

## Available Scripts 📜

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn preview          # Preview production build

# Tests
yarn test             # Run tests
yarn test:ui          # Visual test interface
yarn test:coverage    # Tests with coverage

# Code quality
yarn lint             # Type checking with TypeScript

# Docker
docker-compose up -d                  # Start all services
docker-compose up -d postgres         # Database only
docker-compose logs -f finance-pro    # Application logs
docker-compose exec postgres psql -U postgres -d finance_pro  # Access PostgreSQL
```

## Database Schema 🗄️

The PostgreSQL schema is defined in [`docker/init.sql`](docker/init.sql) and includes:

- **users**: Application users
- **accounts**: Financial accounts (checking, savings, etc.)
- **transactions**: Financial transactions
- **budgets**: Budgets by category

The schema is automatically created when you start PostgreSQL via Docker.

## Project Structure 📁

```
finance-pro/
├── docker/
│   └── init.sql              # PostgreSQL schema
├── src/
│   ├── components/           # React components
│   ├── services/             # Services (auth, database)
│   │   ├── authService.ts    # Authentication abstraction
│   │   ├── databaseService.ts # Database abstraction
│   │   └── errorService.ts
│   ├── config.ts             # Backend configuration
│   ├── firebase.ts           # Firebase setup
│   ├── supabase.ts           # Supabase setup
│   └── App.tsx               # Main component
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Application build
└── .env.local.example        # Environment variables example
```

## Backend Services 🔧

### AuthService

Unified abstraction for authentication:

```typescript
import { AuthService } from './services/authService';

// Login
await AuthService.signInWithEmail(email, password);
await AuthService.signInWithGoogle();

// Register
await AuthService.signUpWithEmail(email, password, displayName);

// Logout
await AuthService.signOut();

// Listen to auth changes
AuthService.onAuthStateChanged((user) => {
  console.log('User:', user);
});
```

### DatabaseService

Unified abstraction for database:

```typescript
import { DatabaseService } from './services/databaseService';

// Add document
await DatabaseService.addDocument('transactions', { ...data });

// Update document
await DatabaseService.updateDocument('transactions', id, { ...data });

// Delete document
await DatabaseService.deleteDocument('transactions', id);

// Subscribe to collection in real-time
const unsubscribe = DatabaseService.subscribeToCollection('transactions', userId, [orderBy('date', 'desc')], (data) =>
  console.log(data)
);
```

## Deployment 🚢

### Docker Production

```bash
# Build image
docker build -t finance-pro .

# Run in production
docker-compose -f docker-compose.yml up -d
```

### Production Environment Variables

Configure the same variables from `.env.local` in your production environment (Vercel, Railway, etc.)

## Security 🔒

- Never commit the `.env.local` file
- Use environment variables for sensitive data
- Configure Firestore/Supabase security rules correctly
- Use HTTPS in production

## Troubleshooting 🔍

### Database connection error

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Veja os logs
docker-compose logs postgres
```

### Authentication error

- Check if credentials in `.env.local` are correct
- Confirm that `VITE_BACKEND` is configured correctly (`firebase` or `supabase`)
- Check browser logs for more details

## Offline Mode 🔄

Finance Pro works seamlessly offline with automatic data synchronization:

- **Full offline support** - All CRUD operations work without internet
- **Automatic caching** - Data is cached locally using IndexedDB
- **Smart sync** - Automatic synchronization when connection is restored
- **Optimistic UI** - Instant feedback for all user actions
- **Conflict resolution** - Last-write-wins strategy for simplicity

### Quick Start

The offline functionality works automatically. Just use the app normally:

```typescript
// Add the OfflineIndicator component to your App
import { OfflineIndicator } from './components/OfflineIndicator';

function App() {
  return (
    <>
      {/* Your app components */}
      <OfflineIndicator />
    </>
  );
}
```

### Monitor Offline State

```typescript
import { useOffline } from './hooks/useOffline';

function MyComponent() {
  const { isOnline, isSyncing, pendingOperations, manualSync } = useOffline();

  return (
    <div>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      {pendingOperations > 0 && (
        <button onClick={manualSync}>
          Sync {pendingOperations} changes
        </button>
      )}
    </div>
  );
}
```

**📖 Full documentation:** See [OFFLINE.md](OFFLINE.md) for detailed information about:

- Architecture and data flow
- API reference
- Testing offline mode
- Troubleshooting
- Best practices

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

The application will be available at `http://localhost:3000`

## Available Scripts 📜

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build
- **`npm run lint`** - Run TypeScript type checking
- **`npm test`** - Run tests in watch mode
- **`npm run test:ui`** - Run tests with UI
- **`npm run test:coverage`** - Generate test coverage report
- **`npm run clean`** - Remove build directory

## Testing 🧪

The project uses Vitest and React Testing Library for comprehensive testing.

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

All components have corresponding test files following React Testing Library best practices.

## Continuous Integration 🔄

The project uses GitHub Actions for CI/CD with automated workflows:

### CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main` and `develop` branches:

- **Lint Check**: TypeScript type checking (`npm run lint`)
- **Tests**: Run all unit tests (`npm test`)
- **Build**: Verify production build succeeds (`npm run build`)
- **Docker**: Build Docker image to ensure containerization works
- **Matrix Testing**: Tests run on Node.js 18.x and 20.x

### Coverage Reporting

The coverage workflow (`.github/workflows/coverage.yml`) generates test coverage reports:

- Runs on pushes to `main` and pull requests
- Generates coverage reports with `npm run test:coverage`
- Uploads coverage artifacts for review

### Triggering CI

CI automatically runs when you:

- Push commits to `main` or `develop` branches
- Create or update pull requests
- Manually trigger workflows from GitHub Actions tab

## Docker Support 🐳

### Using Docker

Build and run the application in a Docker container:

```bash
# Build the image
docker build -t finance-pro .

# Run the container
docker run -p 3000:3000 finance-pro
```

### Using Docker Compose

For a complete setup with all dependencies:

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

The application will be available at `http://localhost:3000`

## Project Structure 📁

```
finance-pro/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── modals/     # Modal components
│   │   └── views/      # View components
│   ├── services/        # Service layer
│   ├── test/           # Test configuration
│   ├── App.tsx         # Main app component
│   ├── firebase.ts     # Firebase configuration
│   ├── supabase.ts     # Supabase configuration
│   ├── types.ts        # TypeScript types
│   ├── utils.ts        # Utility functions
│   └── constants.ts    # App constants
├── .env.local          # Environment variables (create this)
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── vitest.config.ts    # Vitest configuration
└── vite.config.ts      # Vite configuration
```

## Features in Detail 📝

### Account Management

- Create multiple accounts with different types
- Set initial balance and date
- Customize account colors and icons
- Real-time balance updates

### Transaction Management

- Create income, expense, and transfer transactions
- Add descriptions and categories
- Set transaction dates
- Mark transactions as consolidated
- Auto-complete suggestions based on history

### Recurring Transactions

- Set up recurring income/expenses
- Multiple frequency options (daily, weekly, monthly, etc.)
- Automatic generation of future transactions

### Installments

- Split purchases into installments
- Track installment progress
- Edit future installments

### Data Visualization

- Pie charts for category breakdown
- Bar charts for monthly trends
- Summary cards for quick insights
- Filtering and date range selection

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License.

## Support 💬

For support, please open an issue in the GitHub repository.

## Acknowledgments 🙏

- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern fintech applications
- Built with love using React and TypeScript
