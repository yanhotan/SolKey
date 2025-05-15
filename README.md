# SolSecure Project Setup Guide

This is a full-stack application with a Next.js frontend and Node.js backend. The project uses MongoDB for data storage and includes Solana wallet integration.

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- pnpm (recommended) or npm
- Docker and Docker Compose (optional, for containerized setup)

## Project Structure

```
solsecure/
├── frontend/          # Next.js frontend application
├── solkey-backend/    # Express.js backend server
├── scripts/          # Utility scripts
└── docker-compose.yml # Docker configuration
```

## Quick Start (Development)

### 1. Clone the Repository

```powershell
git clone <repository-url>
cd solsecure
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```powershell
cd frontend
pnpm install   # or npm install
```

Required frontend dependencies:
- Next.js and React dependencies
- Solana wallet integration:
  - @solana/web3.js
  - @solana/wallet-adapter-base
  - @solana/wallet-adapter-react
  - @solana/wallet-adapter-react-ui
  - @solana/wallet-adapter-wallets
- UI components:
  - @radix-ui/* components
  - class-variance-authority
  - clsx
  - tailwindcss
- Utilities:
  - @hookform/resolvers
  - @noble/hashes
  - bs58 (for wallet operations)

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Start the development server:

```powershell
pnpm dev   # or npm run dev
```

### 3. Backend Setup

Navigate to the backend directory and install dependencies:

```powershell
cd ../solkey-backend
pnpm install   # or npm install
```

Required backend dependencies:
- Core dependencies:
  - express
  - mongoose
  - cors
  - helmet
  - body-parser
  - dotenv
- Authentication:
  - jsonwebtoken
  - passport
  - passport-jwt
  - passport-google-oauth20
  - passport-github2
  - bcryptjs
- Solana integration:
  - @solana/web3.js
  - tweetnacl
  - bs58
- Development tools:
  - nodemon
  - jest
  - eslint
  - prettier

Create a `.env` file in the backend directory:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/solkey
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

Start the development server:

```powershell
pnpm dev   # or npm run dev
```

### 4. MongoDB Setup

#### Option 1: Local MongoDB

Install MongoDB locally and start the service:

```powershell
Start-Service MongoDB
```

#### Option 2: Docker (Recommended)

Use the provided Docker Compose file:

```powershell
docker-compose up -d
```

## Running Tests

### Backend Tests

```powershell
cd solkey-backend
pnpm test              # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:integration # Run integration tests
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/solkey
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Additional Setup

1. MongoDB Initialization
   - The application will create necessary collections on first run
   - Initial admin user can be created through the signup process

2. Wallet Configuration
   - Configure supported wallet adapters in `frontend/components/wallet-config.tsx`
   - Test wallet integration using the test-encryption page

## Common Issues & Solutions

1. MongoDB Connection Issues
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access if using Docker

2. Wallet Integration Issues
   - Clear localStorage if encryption initialization fails
   - Ensure correct network (devnet/mainnet) configuration
   - Check browser console for detailed error messages

## Development Workflow

1. Start MongoDB service or containers
2. Start backend server (`pnpm dev` in backend directory)
3. Start frontend development server (`pnpm dev` in frontend directory)
4. Access the application at `http://localhost:3000`

## Production Deployment

For production deployment instructions, see `DEPLOYMENT.md` (separate document)
