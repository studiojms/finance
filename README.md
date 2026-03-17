# Finanças Pro 💰

A modern, comprehensive personal finance management application built with React, TypeScript, Firebase, and Supabase. Track your accounts, manage transactions, visualize spending patterns, and maintain full control of your financial life.

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
- **Firebase Authentication**: Secure login with Google or email/password
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **PWA Support**: Install as a Progressive Web App for offline access

## Tech Stack 🛠️

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Motion (Framer Motion)
- **Backend**: Firebase (Firestore, Authentication), Supabase
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **AI Integration**: Google Gemini API
- **Testing**: Vitest, React Testing Library

## Prerequisites 📋

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)

## Local Environment Setup 🚀

### 1. Clone the Repository

```bash
git clone <repository-url>
cd finance-pro
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API (Optional - for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with Email/Password and Google providers
3. Create a **Firestore Database** in production mode
4. Add your Firebase configuration to `.env.local`
5. Update Firestore security rules from `firestore.rules`

### 5. Supabase Setup (Optional)

1. Create a new project at [Supabase](https://supabase.com/)
2. Get your project URL and anon key
3. Add them to `.env.local`

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

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
