# FreeLync Frontend

The frontend of FreeLync, a premium digital brokerage platform designed for high-trust commerce.

## 🚀 Key Features

*   **Premium User Experience**: Highly responsive, dark-mode first design powered by Tailwind CSS and Framer Motion.
*   **Dual-Nature Dashboards**:
    *   **Seller/Buyer Dashboard**: Manage listings, track transactions, view balances, and initiate payout requests.
    *   **Admin Control Panel**: Advanced platform governance including listing approval, user verification, and financial oversight.
*   **Advanced Transaction Flow**: Real-time escrow tracking, transaction timelines, and integrated payment gateways (Chapa, Telebirr, Bibit).
*   **Trust & Support Protocols**: Evidence-based dispute management and comprehensive document upload for KYC/Asset verification.
*   **Live Notification Matrix**: In-app toast alerts and persistent notification center for critical system events.

## 🛠️ Tech Stack

*   **Framework**: React 18 (with TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS & Radix UI
*   **Animation**: Framer Motion
*   **Form Management**: React Hook Form & Zod
*   **API Client**: Axios with interceptors
*   **Notifications**: Sonner

## 📦 Getting Started

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## 📁 Project Structure

*   `src/components`: Atomic UI components, shared layouts, and domain-specific modules.
*   `src/pages`: Feature-driven page views (Home, Marketplace, Dashboard, Admin).
*   `src/services`: Centralized API service layer with authentication and financial handlers.
*   `src/contexts`: Global state providers for Auth, Theme, and Notifications.
*   `src/hooks`: Custom React hooks for business logic reuse.
*   `src/types`: Centralized TypeScript definitions and enums.
*   `src/lib`: Configuration for Axios, utility functions, and library wrappers.

---

Built with ❤️ by the FreeLync Engineering Team.
