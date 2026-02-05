# FreeLync Backend

The backend server for FreeLync, providing a robust API for property and vehicle brokerage.

## 🚀 Key Features

*   **RESTful API**: Comprehensive API endpoints for frontend integration.
*   **Authentication**: Secure user authentication and session management.
*   **Database Management**: PostgreSQL with Prisma ORM for efficient data handling.
*   **Escrow Logic**: Secure transaction management and fund holding features.
*   **Listing Verification**: Robust workflow for admin approval of user listings.
*   **Notification Engine**: Real-time and persistent notification delivery.
*   **File Handling**: Secure upload and management of documents and images.

## 🛠️ Tech Stack

*   **Framework**: NestJS
*   **Language**: TypeScript
*   **ORM**: Prisma
*   **Database**: PostgreSQL
*   **Authentication**: JWT & Passport

## 📦 Getting Started

### Installation

```bash
npm install
```

### Running Locally

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

### Database Management

The project uses Prisma to manage the database schema.

```bash
# Generate Prisma Client
npx prisma generate
```

## 📁 Project Structure

*   `src/users`: User management and authentication.
*   `src/listings`: Property and vehicle listing management.
*   `src/transactions`: Payment and escrow transaction processing.
*   `src/notifications`: System and user notification logic.
*   `src/common`: Shared utilities, decorators, and interceptors.

---

Built with ❤️ by the FreeLync Team.
