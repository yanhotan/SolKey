# README.md Content

# SolKey Backend

SolSecure is a secrets management platform that provides secure storage and management of sensitive information. This backend application is built using Node.js and Express, and it integrates with various services for authentication, payment processing, and project management.

## Features

- **Authentication**: Secure user authentication with wallet-based login.
- **Secrets Management**: Create, update, and retrieve secrets securely.
- **Project Management**: Manage projects with CRUD operations.
- **Payment Integration**: Process payments using Solana blockchain.
- **Team Management**: Invite team members and manage roles.

## Quick Start

1. Copy environment variables:
```bash
cp .env.example .env.local
```

2. Update the `.env.local` with your credentials:
- MongoDB connection string
- JWT secret
- OAuth credentials
- Solana configuration

3. Run with Docker:
```bash
docker-compose up --build
```

The application will be available at http://localhost:3000

## Development

### Prerequisites
- Docker and Docker Compose
- Node.js 20.x
- MongoDB Atlas account or local MongoDB instance

### Environment Variables

Required environment variables are documented in `.env.example`. Make sure to set all required variables in your `.env.local` file.

### Health Checks
- Backend API: http://localhost:3000/health
- MongoDB: Automatically checked by Docker healthcheck

### Available Scripts
- `docker-compose up --build`: Build and start all services
- `docker-compose down -v`: Stop all services and remove volumes
- `docker-compose logs -f`: Follow logs from all services

### Troubleshooting

If you encounter connection issues:
1. Ensure MongoDB URI is correct in your .env.local
2. Check if the MongoDB service is healthy: `docker-compose ps`
3. View logs: `docker-compose logs mongodb`

## Architecture

The backend follows a modular architecture:
- `/controllers`: Request handlers
- `/models`: MongoDB schemas
- `/routes`: API routes
- `/services`: Business logic
- `/middleware`: Express middleware
- `/utils`: Utility functions

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- Solana Wallet

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/solkey-backend.git
   ```
2. Navigate to the project directory:
   ```
   cd solkey-backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on the `.env.example` file and configure your environment variables.

### Running the Application

To start the server, run:
```
npm start
```

### API Documentation

Refer to the individual route files in the `src/routes` directory for detailed API documentation.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.