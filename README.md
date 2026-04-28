# Jade Land Registry - Frontend

A high-fidelity, role-based dashboard for the Hyperledger Fabric Land Record System.

## Features
- **9 Specialized Roles**: Test views for Revenue Admin, Collector, Auditor, Bank, and more.
- **On-Chain Mutations**: Sale, Gift, Inheritance, and Court Order workflows.
- **SideDB Support**: Private Data Collections (Owner, Legal, Financial) with decrypted view toggles.
- **L2 Anchoring**: Public verification layer integration with Polygon Amoy.
- **Jantri Valuation**: Dynamic land valuation and stamp duty calculator.
- **Audit Stream**: Immutable event logging for governance.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Switch Roles**:
   Use the **floating user icon** in the top-right corner to toggle between roles and test different permission levels and dashboard views.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Modules)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Design Pattern**: Glassmorphism / Dark Mode
