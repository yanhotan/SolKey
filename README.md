# SolSecure: Wallet-Based End-to-End Encrypted Secret Management

SolSecure is a secure end-to-end encrypted secret management system built with Solana wallet authentication. It uses client-side encryption, Solana wallet signatures, and on-chain permission verification to ensure that sensitive information remains protected and properly shared.

## Architecture Overview

SolSecure uses a modern, secure architecture:
![E2EE Flow](./images/Architecture_FlowChart.png)

- **Frontend**: Next.js application with Solana wallet integration
- **Backend**: Express.js server with Supabase database
- **Smart Contract**: Solana program for permission management
- **Security**: End-to-end encryption using WebCrypto API
- **Authentication**: Solana wallet signatures

### Security Model

1. **End-to-End Encryption**: All secrets are encrypted in the browser before being sent to the server
2. **Wallet-Based Authentication**: User identity is verified through Solana wallet signatures
3. **On-Chain Permissions**: Access control managed through Solana smart contract
4. **Zero Knowledge Design**: The backend never sees plaintext secrets

## Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- A compatible Solana wallet (Phantom, Solflare, etc.)
- Modern browser with WebCrypto support (Chrome, Firefox, Edge, Safari)

## Project Structure

```
solsecure/
├── frontend/          # Next.js frontend application
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks for wallet integration
│   │   ├── use-secret-decryption.ts  # Secret decryption logic
│   │   ├── use-secret-encryption.ts  # Secret encryption logic
│   │   └── use-wallet-encryption.ts  # Wallet-based key management
│   ├── lib/           # Utility functions
│   │   ├── api.ts         # Backend API client
│   │   ├── crypto.ts      # WebCrypto wrapper functions
│   │   └── wallet-auth.ts # Wallet authentication
│   └── app/           # Next.js app directory
│
├── backend/          # Express.js backend server
│   ├── lib/          # Backend utilities
│   │   ├── crypto.js     # Crypto operations (key management)
│   │   └── supabase.js   # Database connection
│   ├── routes/       # API routes
│   │   ├── secrets.js    # Secret management endpoints
│   │   └── projects.js   # Project management endpoints
│   └── index.js      # Server entry point
│
├── programs/         # Solana programs
│   └── permission_program/  # Permission management contract
│       ├── src/            # Program source code
│       │   ├── lib.rs      # Program entry point
│       │   ├── state.rs    # Program state definitions
│       │   └── error.rs    # Custom error types
│       └── Cargo.toml      # Rust dependencies
```

## Quick Start (Development)

### 1. Frontend Setup

```powershell
cd frontend
pnpm install
```

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

Start the development server:

```powershell
pnpm dev
```

The frontend will be available at `http://localhost:3000`.

### 2. Backend Setup

```powershell
cd backend
pnpm install
```

Create a `.env` file in the backend directory:

```env
PORT=3002
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=http://localhost:3000
```

Start the backend server:

```powershell
pnpm dev
```

The backend API will be available at `http://localhost:3002`.

## Key Features

### 1. Wallet-Based Authentication

SolSecure uses Solana wallets for authentication, eliminating the need for passwords:

- Connect your Solana wallet to access the application
- Sign messages to verify your identity
- Your wallet address serves as your unique identifier

### 2. On-Chain Permission Management

Access control is managed through a Solana smart contract:

- Project owners can add/remove members on-chain
- Permission verification is decentralized and transparent
- Members can only decrypt secrets they have permission to access
- Automatic permission revocation when removed from project

### 3. End-to-End Encryption

All sensitive data is encrypted in your browser before transmission:

- AES-256-GCM encryption using WebCrypto API
- Encryption keys derived from wallet signatures
- Backend only stores encrypted data

### 4. Secret Management

- Create and manage encrypted secrets
- Organize secrets by projects and environments
- Share secrets securely with verified project members
- Permission-based access control through smart contract

## Permission Program Flow

### 1. Project Initialization

1. Owner creates a new project on-chain
2. Program creates a PDA (Program Derived Address) for the project
3. Owner becomes the default administrator

### 2. Member Management

1. Owner adds members to project through smart contract
2. Each member's public key is stored in project state
3. Members can verify their access rights on-chain
4. Owner can remove members, instantly revoking access

### 3. Secret Sharing

1. When sharing a secret, the system verifies membership on-chain
2. Only verified members can receive encryption keys
3. Access is automatically revoked when removed from project
4. All permission checks are verified through the smart contract

## Encryption Flow

### 1. Key Derivation

1. User signs a message using their Solana wallet
2. The signature is used to derive an AES-256 encryption key using PBKDF2
3. This key is securely stored in browser localStorage for the session

### 2. Secret Encryption

1. User creates a new secret in the browser
2. The secret is encrypted using AES-256-GCM with the derived key
3. Only the encrypted data, along with IV, is sent to the backend
4. Backend stores this encrypted package in the Supabase database

### 3. Secret Decryption

1. User requests a secret from the backend
2. Backend verifies wallet signature and sends encrypted data
3. Frontend decrypts the data using the wallet-derived key
4. Decrypted data never leaves the user's browser

## API Routes

### Backend API

- `POST /secrets`: Create a new encrypted secret
- `GET /secrets/:id`: Get an encrypted secret
- `POST /secrets/:id/share`: Share a secret with another wallet
- `POST /secrets/:id/decrypt`: Client-side decryption endpoint

## Database Schema

SolSecure uses Supabase with the following tables:

- `projects`: Store project information
- `environments`: Different environments within projects (dev, staging, prod)
- `secrets`: Encrypted secret values with their metadata
- `secret_keys`: Wallet-specific encryption keys for shared secrets
- `users`: User profile information linked to wallet addresses
- `project_members`: Project access control

## Troubleshooting

### Common Issues

#### "Encryption key not available"

- Ensure your wallet is connected
- Click "Sign & Decrypt" to sign a message and generate the encryption key
- Check browser console for detailed error messages

#### Decryption Failures

- Clear browser localStorage and reconnect your wallet
- Ensure you're using the same wallet that encrypted the data
- Check browser console for detailed error information
- Run the diagnostic tool from the dashboard to verify WebCrypto compatibility

#### Wallet Connection Issues

- Ensure your wallet extension is installed and unlocked
- Try refreshing the page
- Check for wallet adapter compatibility

## Security Considerations

- The application uses industry-standard AES-256-GCM encryption
- Private keys never leave your wallet
- Wallet signatures are only used for authentication and key derivation
- Permission management is handled by secure on-chain program
- Member access is verified through Solana smart contract
- Consider using hardware wallets for additional security

## Development Guidelines

### Testing Encryption/Decryption

- Use the built-in verification tools in the dashboard
- Check browser console for detailed logs during encryption/decryption
- Test with different wallet adapters to ensure compatibility

### Adding New Features

- Maintain the end-to-end encryption model
- Keep sensitive operations client-side
- Avoid sending plaintext to the backend

## Deployment

For production deployment:

1. Set appropriate environment variables
2. Use HTTPS for all communications
3. Configure CORS settings for your domain
4. Use a production-ready Supabase project
5. Consider implementing rate limiting for API endpoints

## Contributing

Contributions are welcome! Please submit a pull request with your changes.
