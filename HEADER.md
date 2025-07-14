# Global Header Implementation

## Overview

A comprehensive global header has been added to all pages in Donaria that shows the user's authentication status and provides navigation.

## Features

### 🔐 **Authentication Status**
- **Logged Out**: Shows "Log In" and "Get Started" buttons
- **Logged In**: Shows user avatar, wallet balance, and account menu

### 👤 **User Information Display**
- **Avatar**: User's profile picture or initials fallback
- **Name**: User's display name from social login or email
- **Email**: User's email address (when available)
- **Wallet Address**: Truncated Stellar public key
- **Balance**: Live XLM balance from Stellar account

### 🧭 **Navigation Menu**
- **Desktop**: Horizontal navigation with dropdown user menu
- **Mobile**: Hamburger menu with all options in side panel
- **Landing Links**: "How it Works" and "Impact" sections
- **Dashboard Links**: "Browse Needs" (Donor) and "My Reports" (Beneficiary)
- **Role Switching**: Link to role selection page

### 📱 **Responsive Design**
- **Desktop**: Full navigation bar with user dropdown
- **Mobile**: Collapsible hamburger menu with user info
- **Tablet**: Adaptive layout that works on all screen sizes

## Header Visibility

### ✅ **Shows On:**
- Landing page (`/`)
- Dashboard pages (`/dashboard/donor`, `/dashboard/beneficiary`)
- Role selection (`/role-selection`)
- All other pages by default

### ❌ **Hidden On:**
- Login page (`/login`)
- Auth callback pages (`/auth/*`)

## User Actions

### 🔑 **When Logged Out:**
- **Log In**: Redirects to `/login`
- **Get Started**: Also redirects to `/login`

### 👨‍💼 **When Logged In:**
- **Browse Needs**: Go to donor dashboard
- **My Reports**: Go to beneficiary dashboard  
- **Switch Role**: Return to role selection
- **Log Out**: Sign out and disconnect wallet

## Technical Implementation

### 📁 **File Location**
- `components/global-header.tsx` - Main header component
- `app/layout.tsx` - Added to root layout for all pages

### 🔌 **Dependencies**
- `useAuth()` - Authentication state from AuthContext
- `useWallet()` - Wallet state from WalletContext
- `usePathname()` - Current route detection
- ShadCN UI components (Avatar, DropdownMenu, Sheet, etc.)

### 🎨 **Styling**
- **Backdrop Blur**: Modern glassmorphism effect
- **Sticky Position**: Header stays at top when scrolling
- **Teal Accent**: Matches Donaria brand colors
- **Dark Mode**: Full dark mode support

## Mobile Navigation

The mobile menu includes:
- **Header Branding**: Donaria logo and name
- **User Profile**: Avatar, name, and email when logged in
- **Navigation Links**: All the same options as desktop
- **Action Buttons**: Login/logout with proper styling

## Live Wallet Integration

When a user has a connected wallet:
- **Balance Display**: Shows current XLM balance
- **Wallet Icon**: Indicates active blockchain connection
- **Account Info**: Displays truncated public key in dropdown
- **Auto-Refresh**: Balance updates when wallet state changes

## Usage

The header automatically handles all authentication states and provides appropriate navigation options based on whether the user is logged in and which role they've selected.

No additional setup is required - the header is globally available and fully integrated with the existing authentication system.