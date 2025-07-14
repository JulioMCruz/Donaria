# Donaria Soroban Smart Contracts

This directory contains the Soroban smart contracts for the Donaria humanitarian aid platform.

## Contracts

### Need Reports Contract
- **Purpose**: Manages beneficiary need reports with transparency and immutability
- **Features**: 
  - Create, read, update need reports
  - Transparent change logging
  - User authentication and authorization
  - Integration with Firebase Storage for images
  - Unique report ID generation

## Development Setup

1. Install Soroban CLI and Rust toolchain
2. Navigate to contract directory: `cd need-reports`
3. Build contracts: `stellar contract build`
4. Deploy to testnet: `stellar contract deploy`

## Network Configuration

- **Testnet RPC**: `https://soroban-testnet.stellar.org:443`
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **Explorer**: `https://stellar.expert/explorer/testnet`

## Integration

These contracts integrate with the Donaria Next.js application through:
- API routes in `/app/api/soroban/`
- Service layer in `/lib/soroban-contract.ts`
- UI components for beneficiary needs management