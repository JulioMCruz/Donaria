# Donaria - Transparent Humanitarian Aid Platform

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by Stellar](https://img.shields.io/badge/Powered%20by-Stellar-blue?style=for-the-badge&logo=stellar)](https://stellar.org)
[![Firebase](https://img.shields.io/badge/Firebase-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)

## Overview

Donaria is a revolutionary humanitarian aid platform that transforms how emergency relief reaches those in need. By leveraging blockchain technology and social verification, we create a direct bridge between verified donors and beneficiaries in crisis situations, eliminating intermediaries and ensuring maximum transparency.

### 🎯 Mission Statement

**"Building a bridge of trust between those who need help and those who can provide it."**

Donaria addresses critical challenges in humanitarian aid:
- **Lack of Transparency**: Traditional aid often lacks visibility into fund allocation
- **High Overhead Costs**: Multiple intermediaries reduce the impact of donations
- **Verification Issues**: Difficulty in verifying legitimate needs and beneficiaries
- **Slow Distribution**: Bureaucratic processes delay critical aid delivery
- **Geographic Barriers**: Cross-border donations face regulatory and technical hurdles

### 🌍 Global Impact Vision

Our platform serves diverse crisis scenarios:
- **Natural Disasters**: Earthquake, flood, hurricane, and wildfire relief
- **Medical Emergencies**: Life-saving treatments, surgeries, and medications
- **Educational Support**: School fees, supplies, and emergency student aid
- **Food Security**: Emergency nutrition and sustainable food programs
- **Refugee Assistance**: Immediate shelter, clothing, and basic necessities
- **Community Rebuilding**: Infrastructure repair and economic recovery

### 🌟 Key Features

#### 🔐 Trust & Transparency
- **Immutable Records**: All donations permanently recorded on Stellar blockchain
- **Public Verification**: Anyone can verify transactions via blockchain explorers
- **Zero Hidden Fees**: Complete visibility into all platform costs and transactions
- **Audit Trail**: Full history from donation initiation to beneficiary receipt

#### 🚀 User Experience
- **One-Click Social Login**: Google, X (Twitter), Instagram, email, or phone authentication
- **Instant Wallet Creation**: Automated Stellar wallet generation with PIN security
- **Auto-Funding**: New users receive 1 XLM to start participating immediately
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Multi-Language Support**: Accessible to global communities (coming soon)

#### 💰 Financial Innovation
- **Micro-Donations**: Support causes with as little as $0.01 equivalent
- **Cross-Border Payments**: Send aid anywhere in seconds, not days
- **Low Transaction Costs**: ~$0.00001 per transaction vs traditional remittance fees
- **Real-Time Settlement**: Instant delivery to beneficiary wallets
- **Multi-Currency Support**: XLM, USDC, and other Stellar assets

#### 🛡️ Security & Privacy
- **PIN-Based Encryption**: Private keys encrypted locally with user-controlled PINs
- **Non-Custodial**: Users maintain full control of their funds
- **Identity Verification**: Multi-step beneficiary verification process
- **Fraud Prevention**: Smart contract-based validation and community reporting
- **GDPR Compliant**: Privacy-first data handling and user rights protection

## Technology Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **TailwindCSS** + ShadCN UI components
- **Stellar SDK** for blockchain operations

### Backend & Services
- **Firebase Authentication** (Google, Twitter, Instagram, Email, Phone)
- **Firebase Firestore** for user data persistence
- **Stellar Network** (Testnet/Mainnet) for transactions
- **CryptoJS** for client-side encryption

### Key Security Features
- PIN-based private key encryption
- Server-side automatic wallet funding
- Firebase Admin SDK for secure operations
- Client-side wallet management

## Architecture

```mermaid
flowchart TB
    subgraph Frontend [Frontend Layer]
        UI[Next.js 15 App]
        AUTH[Firebase Auth]
        WALLET[Stellar Wallet]
    end
    
    subgraph AuthProviders [Authentication Providers]
        GOOGLE[Google OAuth]
        TWITTER[X/Twitter OAuth]
        INSTAGRAM[Instagram OAuth]
        EMAIL[Email/Password]
        PHONE[Phone/SMS]
    end
    
    subgraph Blockchain [Blockchain Layer]
        STELLAR[Stellar Network]
        HORIZON[Horizon API]
        ACCOUNT[User Accounts]
    end
    
    subgraph Database [Database Layer]
        FIRESTORE[(Firebase Firestore)]
        USERDATA[User Profiles]
        WALLETDATA[Encrypted Wallets]
    end
    
    subgraph API [API Layer]
        FUNDING[/api/funding]
        USERS[/api/users]
        INSTA_AUTH[/api/auth/instagram]
    end
    
    UI --> AUTH
    AUTH --> GOOGLE
    AUTH --> TWITTER
    AUTH --> INSTAGRAM
    AUTH --> EMAIL
    AUTH --> PHONE
    
    UI --> WALLET
    WALLET --> STELLAR
    STELLAR --> HORIZON
    HORIZON --> ACCOUNT
    
    UI --> API
    API --> FIRESTORE
    FIRESTORE --> USERDATA
    FIRESTORE --> WALLETDATA
    
    FUNDING --> STELLAR
    USERS --> FIRESTORE
```

## Donation Workflow

```mermaid
sequenceDiagram
    participant D as Donor
    participant DA as Donaria App
    participant FB as Firebase
    participant ST as Stellar Network
    participant B as Beneficiary
    
    Note over D,B: User Registration & Wallet Creation
    D->>DA: Register/Login (Social/Email)
    DA->>FB: Authenticate User
    FB-->>DA: User Credentials
    DA->>DA: Generate Stellar Keypair
    DA->>DA: Encrypt Private Key with PIN
    DA->>FB: Store Encrypted Wallet
    DA->>ST: Fund Account with 1 XLM
    ST-->>DA: Account Created & Funded
    DA-->>D: Wallet Ready
    
    Note over D,B: Beneficiary Need Registration
    B->>DA: Register Need Request
    DA->>FB: Store Need Details
    DA->>DA: Verify Beneficiary Identity
    DA-->>B: Need Published
    
    Note over D,B: Donation Process
    D->>DA: Browse Available Needs
    DA->>FB: Fetch Active Needs
    FB-->>DA: Needs List
    DA-->>D: Display Needs
    
    D->>DA: Select Need & Amount
    DA->>D: Request PIN for Wallet Unlock
    D->>DA: Enter PIN
    DA->>DA: Decrypt Private Key
    DA->>ST: Create Payment Transaction
    ST->>ST: Process Payment
    ST->>B: Transfer Funds to Beneficiary
    ST-->>DA: Transaction Confirmed
    DA->>FB: Record Donation
    DA-->>D: Donation Success Notification
    DA-->>B: Funds Received Notification
    
    Note over D,B: Impact Tracking
    D->>DA: Check Donation Impact
    DA->>ST: Query Transaction History
    ST-->>DA: Transaction Details
    DA->>FB: Fetch Impact Reports
    FB-->>DA: Impact Data
    DA-->>D: Impact Dashboard
```

## Needs Management Workflow

```mermaid
sequenceDiagram
    participant B as Beneficiary
    participant DA as Donaria App
    participant FB as Firebase
    participant ST as Stellar Network
    participant V as Verification System
    participant D as Donors
    
    Note over B,D: Need Creation & Verification
    B->>DA: Create Need Request
    DA->>B: Request Documentation
    B->>DA: Submit Identity & Need Proof
    DA->>FB: Store Need Data
    DA->>V: Queue for Verification
    V->>V: Review Documentation
    V->>FB: Update Verification Status
    FB-->>DA: Verification Complete
    DA-->>B: Need Approved & Published
    
    Note over B,D: Need Visibility & Discovery
    DA->>FB: Publish to Needs Feed
    D->>DA: Browse Needs
    DA->>FB: Fetch Verified Needs
    FB-->>DA: Active Needs List
    DA-->>D: Display Available Needs
    
    Note over B,D: Donation Reception & Tracking
    D->>ST: Send Donation
    ST->>B: Receive Funds
    ST-->>DA: Transaction Event
    DA->>FB: Update Need Progress
    DA->>B: Notify Funds Received
    DA->>DA: Calculate Remaining Need
    
    alt Need Fully Funded
        DA->>FB: Mark Need as Complete
        DA->>B: Notify Goal Achieved
        DA->>D: Notify Impact Success
    else Need Partially Funded
        DA->>FB: Update Progress
        DA->>DA: Continue Showing Need
    end
    
    Note over B,D: Reporting & Transparency
    B->>DA: Submit Impact Report
    DA->>FB: Store Impact Data
    DA->>D: Share Impact Updates
    DA->>ST: Link to Blockchain Records
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled
- Stellar account for funding operations
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Donaria
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.local` with:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # Firebase Admin (Server-side)
   FIREBASE_ADMIN_PRIVATE_KEY=your_admin_private_key
   FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_email
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   
   # Stellar Configuration
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   STELLAR_FUNDING_SECRET=your_funding_account_secret
   
   # Social Authentication
   INSTAGRAM_CLIENT_ID=your_instagram_client_id
   INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
   NEXT_PUBLIC_APP_URL=https://www.donaria.xyz
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

## User Roles & Capabilities

### 🤝 Donors - "Be the Change"

**Discovery & Research**
- Browse verified emergency needs with detailed stories and documentation
- Filter by crisis type, location, urgency level, and funding progress
- View beneficiary verification status and community endorsements
- Access impact reports from previously funded campaigns

**Donation Process**
- Contribute any amount starting from $0.01 equivalent
- Choose between one-time donations or recurring monthly support
- Add personal messages of encouragement to beneficiaries
- Donate anonymously or publicly with profile attribution

**Impact Tracking**
- Real-time updates on how funds are being used
- Photo and video updates from beneficiaries showing progress
- Blockchain-verified transaction history with timestamps
- Community feedback and testimonials from recipients
- Tax-deductible receipt generation (where applicable)

**Community Engagement**
- Join donor circles for coordinated giving campaigns
- Share successful stories on social media to amplify reach
- Participate in platform governance and feature voting
- Access exclusive donor events and impact webinars

### 🙏 Beneficiaries - "Share Your Story"

**Need Registration**
- Create detailed emergency requests with photos and documentation
- Submit identity verification through government ID or community endorsement
- Set funding goals with transparent breakdown of expenses
- Categorize needs (medical, education, disaster relief, etc.)

**Documentation & Verification**
- Upload supporting documents (medical bills, school fees, damage assessments)
- Provide emergency contact information and location details
- Complete identity verification through multi-step process
- Obtain community endorsements from local leaders or organizations

**Fund Management**
- Receive donations directly to personal Stellar wallet
- Convert received XLM/USDC to local currency via partner exchanges
- Track funding progress with visual indicators and milestones
- Access emergency disbursement for urgent medical situations

**Community Reporting**
- Provide regular updates on how donations are being used
- Share photos and videos showing progress and impact
- Send thank-you messages to donors and supporters
- Report completion of funded goals with final documentation

### 🏛️ Platform Governance

**Community Moderation**
- Volunteer moderators review and verify beneficiary requests
- Community voting on disputed cases and policy changes
- Transparent appeals process for rejected applications
- Regular platform updates based on user feedback

**Trust & Safety**
- Machine learning algorithms detect potential fraud patterns
- Community reporting system for suspicious activities
- Regular audits of high-value transactions and beneficiaries
- Partnership with local verification organizations globally

## Security & Trust Framework

### 🔐 Technical Security

**Blockchain Foundation**
- **Immutable Ledger**: All transactions permanently recorded on Stellar network
- **Public Verification**: Anyone can verify donations using blockchain explorers
- **Decentralized Network**: No single point of failure or control
- **Smart Contract Validation**: Automated verification of transaction parameters

**Wallet Security**
- **Non-Custodial Architecture**: Users control their private keys at all times
- **PIN-Based Encryption**: AES-256 encryption with user-generated PINs
- **Local Key Storage**: Private keys never transmitted or stored on servers
- **Backup & Recovery**: Secure seed phrase generation for wallet restoration

**Data Protection**
- **GDPR Compliance**: Full compliance with European data protection regulations
- **End-to-End Encryption**: Sensitive communications encrypted in transit
- **Minimal Data Collection**: Only essential information stored
- **Right to be Forgotten**: Complete data deletion on user request

### 🛡️ Trust & Verification

**Beneficiary Verification**
- **Multi-Step Identity Verification**: Government ID, phone, and document verification
- **Community Endorsement**: Local leaders and organizations can vouch for beneficiaries
- **Geo-Location Verification**: GPS and address confirmation for emergency situations
- **Social Media Cross-Reference**: Optional social media account verification

**Community Trust Building**
- **Reputation System**: Track record of successful donations and beneficiary outcomes
- **Peer Review Process**: Community members can review and rate beneficiary requests
- **Transparency Reports**: Regular publication of platform statistics and outcomes
- **Impact Verification**: Third-party validation of funded project outcomes

### ⚖️ Regulatory Compliance

**Financial Regulations**
- **AML/KYC Compliance**: Anti-money laundering and know-your-customer procedures
- **Cross-Border Compliance**: Adherence to international remittance regulations
- **Tax Reporting**: Integration with tax reporting systems where required
- **Sanctions Screening**: Automated screening against global sanctions lists

**Platform Governance**
- **Terms of Service**: Clear guidelines for platform usage and acceptable behavior
- **Dispute Resolution**: Fair and transparent process for handling conflicts
- **Appeal Mechanisms**: Multi-tier appeal process for beneficiary application rejections
- **Community Guidelines**: Standards for appropriate content and behavior

### 📊 Risk Management

**Fraud Prevention**
- **AI-Powered Detection**: Machine learning algorithms identify suspicious patterns
- **Transaction Monitoring**: Real-time analysis of donation flows and beneficiary behavior
- **Community Reporting**: Easy reporting mechanisms for suspicious activities
- **Rapid Response Team**: 24/7 team for handling security incidents and fraud reports

**Financial Risk Mitigation**
- **Multi-Signature Controls**: Critical operations require multiple approvals
- **Rate Limiting**: Protection against donation manipulation and spam
- **Insurance Coverage**: Platform insurance for technical failures and security breaches
- **Emergency Funds**: Reserve funds for critical security incidents and beneficiary emergencies

## Contributing

We welcome contributions to make humanitarian aid more transparent and accessible. Please read our contributing guidelines and submit pull requests for improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Live Platform

🌐 **Visit Donaria**: [https://www.donaria.xyz](https://www.donaria.xyz)

## Support

For support and questions:
- 📧 Email: support@donaria.xyz
- 💬 Discord: [Join our community]
- 📖 Documentation: [docs.donaria.xyz]

---

**Building a bridge of trust between those who need help and those who can provide it.** 🌍❤️