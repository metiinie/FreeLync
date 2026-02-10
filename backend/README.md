# FreeLync Backend

The backend server for FreeLync, providing a robust API for property and vehicle brokerage, financial orchestration, and trust management.

## 🚀 Key Features

*   **RESTful API**: Comprehensive API endpoints for frontend integration.
*   **Authentication**: Secure user authentication and session management with Passport & JWT.
*   **Financial Engine**: Immutable ledger system, automated commission calculation, and payout orchestrator.
*   **Trust & Verification**: Multi-step document verification (KYC/KYB) and asset ownership validation.
*   **Dispute Management Center**: Evidence-based adjudication system for transaction conflicts.
*   **Escrow Logic**: Secure transaction management and fund holding features.
*   **Notification Engine**: Real-time delivery via in-app, email, and priority-based channels.
*   **Admin Control Layer**: Extensive RBAC and detailed audit logs for platform governance.

## 🛠️ Tech Stack

*   **Framework**: NestJS (Enterprise Node.js)
*   **Language**: TypeScript
*   **ORM**: Prisma
*   **Database**: PostgreSQL (Neon)
*   **Authentication**: JWT & Passport (Argon2/Bcrypt)

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

# Sync Database Schema
npx prisma db push
```

## 📁 Project Structure

*   `src/auth`: Security, strategies, and session management.
*   `src/users`: User profiles, roles, and preferences.
*   `src/listings`: Property and vehicle listing lifecycle.
*   `src/transactions`: Escrow states and transaction timelines.
*   `src/financial`: Ledger, balance tracking, commissions, and payouts.
*   `src/disputes`: Conflict resolution, evidence, and admin adjudication.
*   `src/verifications`: Identity and documentation verification workflows.
*   `src/notifications`: Multi-channel notification dispatch.
*   `src/common`: Middleware, interceptors, and shared utilities.

---

Built with ❤️ by the FreeLync Engineering Team.
