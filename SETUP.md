# Donaria Setup Guide

This guide will help you set up the Donaria application with the integrated stellar-wallet authentication system.

## Prerequisites

1. **Firebase Project**: Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. **Stellar Account**: You'll need a Stellar account with some XLM for funding new wallets
3. **Social OAuth Apps** (optional): Set up Google, X (Twitter), and Instagram OAuth applications

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables:

### Firebase Configuration
- Go to Firebase Console → Project Settings → General → Your Apps
- Copy the config values to your `.env.local`

### Firebase Admin
- Go to Firebase Console → Project Settings → Service Accounts
- Generate a new private key (downloads a JSON file)
- Convert the JSON to base64: `base64 -i path/to/serviceAccountKey.json`
- Set the result as `FIREBASE_SERVICE_ACCOUNT_BASE64`

### Stellar Configuration
- Set `NEXT_PUBLIC_STELLAR_NETWORK=testnet` for development
- Create a funding account with XLM and set `STELLAR_FUNDING_SECRET`

### Social OAuth (Optional)
- **Google**: Firebase Console → Authentication → Sign-in method → Google
- **X (Twitter)**: [developer.twitter.com](https://developer.twitter.com) → Create App
- **Instagram**: [developers.facebook.com](https://developers.facebook.com) → Create App → Instagram Basic Display

## Installation

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Features

The integrated login system provides:

- **Social Authentication**: Google, X (Twitter), Instagram
- **Email/Password**: Traditional email authentication
- **Phone Authentication**: SMS verification
- **Encrypted Wallets**: PIN-based wallet encryption
- **Automatic Funding**: New wallets are funded automatically
- **Role Selection**: Users choose between Donor/Beneficiary after login

## Authentication Flow

1. User selects login method
2. Completes social/email/phone authentication
3. Creates 4-digit PIN for wallet encryption
4. Stellar wallet is generated and encrypted
5. User is redirected to role selection
6. User accesses appropriate dashboard (Donor/Beneficiary)

## Troubleshooting

- **Firebase Errors**: Check environment variables and Firebase project configuration
- **Build Warnings**: Stellar SDK warnings are normal and don't affect functionality
- **Dependency Conflicts**: Use `--legacy-peer-deps` flag when installing
- **SSL Issues**: Use `NODE_TLS_REJECT_UNAUTHORIZED=0` for development if needed

## Next Steps

After setup, customize:
- Add your own OAuth app credentials
- Configure Stellar mainnet for production
- Customize the role selection and dashboard flows
- Integrate with your donation/need tracking system