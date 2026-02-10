# FreeLync - Premium Digital Brokerage & Financial Infrastructure

FreeLync is a state-of-the-art digital brokerage platform engineered for secure, high-value trading of properties and vehicles. By integrating a multi-tiered trust protocol with a production-grade financial engine, FreeLync ensures that every transaction is verified, every payment is secured via escrow, and every payout is accurate.

## 🌟 The FreeLync Ecosystem

FreeLync goes beyond a simple marketplace. it is a complete financial and administrative infrastructure for digital commerce.

### 1. Digital Marketplace Engine
*   **Omni-Category Trading**: Specialized workflows for Properties (Houses, Land, Commercial) and Vehicles.
*   **Verified Listings**: A rigorous multi-step verification process ensuring "What You See Is What You Get."
*   **Dynamic Search & Discovery**: High-performance filtering by location, price, type (Rent/Sale), and specific attributes.

### 2. Trust & Security Protocol
*   **Escrow Hold System**: Funds are held in a secure state until transaction milestones are met and verified.
*   **Document Verification (KYC/KYB)**: Integrated system for verifying user identity and asset ownership documents.
*   **Dispute Resolution Center**: A dedicated module for opening, managing, and resolving transaction conflicts with evidence-based adjudication.

### 3. Financial Management & Payout Engine
*   **Immutable Ledger**: A double-entry accounting system with balance snapshots for 100% financial auditability.
*   **Automated Commission Engine**: Tiered platform fee calculation integrated directly into the transaction flow.
*   **Payout Orchestrator**: Secure withdrawal workflow for sellers with admin approval gates and provider integration (Chapa, Telebirr, Bibit).
*   **Financial Reporting**: On-demand generation of tax reports, seller statements, and platform reconciliation logs.

### 4. Administrative Governance (Control Layer)
*   **Granular RBAC**: Role-based access control for Admins, Finance Teams, Support, and Compliance officers.
*   **Audit Trail**: Every administrative action is logged with IP tracking, reason codes, and state-change snapshots.
*   **Platform Orchestration**: Centralized management of listings, users, disputes, and financial health.

---

## 🛠️ Technology Stack

FreeLync is built on a modern, scalable, and type-safe architecture.

### **Backend (Infrastructure)**
*   **Framework**: [NestJS](https://nestjs.com/) (Node.js Enterprise Framework)
*   **Database**: PostgreSQL via [Neon](https://neon.tech/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Authentication**: Passport.js with JWT Strategy
*   **Security**: Argon2/Bcrypt hashing, Role-based Guards, Middleware-based Identity Layer

### **Frontend (Experience)**
*   **Framework**: [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **State & Forms**: React Hook Form, Zod Validation, Axios
*   **UI Components**: Premium custom-built components with Radix UI primitives

---

## 📦 Getting Started

### Prerequisites
*   Node.js 18.x or higher
*   PostgreSQL (or Neon Cloud account)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-repo/freelync.git
    cd freelync
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    # Copy env and configure
    cp .env.example .env 
    # Initialize Database
    npx prisma generate
    npx prisma db push
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

*   **Development Mode**:
    ```bash
    # In backend folder
    npm run start:dev
    
    # In frontend folder
    npm run dev
    ```

---

## ⚙️ Environment Configuration

### Backend `.env`
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection String | - |
| `JWT_SECRET` | Secret key for token signing | - |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `PORT` | API Server Port | `3000` |

---

## 🛡️ Trust and Security
FreeLync prioritizes financial integrity above all. Our **Immutable Ledger** system means that money never move without a record. We avoid the "rookie mistake" of instant payouts by implementing a decoupled Approval -> Process flow, giving our finance team the oversight needed to prevent fraud and ensure platform stability.

---

Built with ❤️ by the FreeLync Engineering Team.
