# Skyline LTD - Celebrity Booking Platform

## Overview
Skyline LTD is a premium celebrity booking and campaign platform with a crypto-funded USD wallet system. The platform enables users to book celebrities for events and request brand campaign endorsements, funded through cryptocurrency deposits (BTC/ETH/USDT) that convert to USD wallet balance using live exchange rates from CoinGecko API.

## Key Features

### For Users
- **Celebrity Browsing**: Browse a directory of celebrities with filters by category
- **Booking System**: Book celebrities for events with wallet-funded payments
- **Campaign Requests**: Request custom marketing campaigns with celebrities
- **Crypto Wallet**: Deposit funds via BTC, ETH, or USDT with live exchange rates
- **Real-time Messaging**: Chat with agents about bookings and campaigns
- **Notifications**: Stay updated on booking status and deposits

### For Admins
- **Dashboard**: Overview of users, bookings, campaigns, and revenue
- **User Management**: View and manage all users, adjust balances
- **Celebrity Management**: CRUD operations for celebrities
- **Booking/Campaign Management**: Update statuses, manage requests
- **Deposit Management**: Approve/reject crypto deposits
- **Agent Messaging**: Respond to user inquiries with agent impersonation
- **Activity Logging**: Track all admin actions

## Tech Stack
- **Frontend**: React with TypeScript, TanStack Query, Wouter routing
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time**: WebSocket for chat messaging
- **External APIs**: CoinGecko for crypto prices

## Project Structure
```
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   │   ├── admin/      # Admin panel pages
│   │   └── dashboard/  # User dashboard pages
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and query client
├── server/
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database operations
│   ├── replitAuth.ts   # Authentication setup
│   └── db.ts           # Database connection
└── shared/
    └── schema.ts       # Database schema and types
```

## Brand Colors
- **Royal Navy Blue**: #0A1A2F (Primary dark)
- **Skyline Cyan**: #00B8D4 (Accent)
- **Luxury Gold**: #F5C542 (Highlights)

## API Endpoints

### Public
- `GET /api/celebrities` - List all celebrities
- `GET /api/celebrities/:id` - Get celebrity details
- `GET /api/crypto/prices` - Get live BTC/ETH/USDT prices
- `GET /api/settings/wallets` - Get deposit wallet addresses

### Authentication
- `GET /api/login` - Initiate OAuth login
- `GET /api/logout` - Log out user
- `GET /api/auth/user` - Get current user

### User (Authenticated)
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/campaigns` - Get user's campaigns
- `POST /api/campaigns` - Request new campaign
- `GET /api/deposits` - Get user's deposits
- `POST /api/deposits` - Create deposit request
- `GET /api/messages/:threadId` - Get messages in thread
- `POST /api/messages` - Send message
- `GET /api/notifications` - Get notifications

### Admin (Admin Role Required)
- `POST /api/celebrities` - Create celebrity
- `PATCH /api/celebrities/:id` - Update celebrity
- `DELETE /api/celebrities/:id` - Delete celebrity
- `PATCH /api/bookings/:id/status` - Update booking status
- `PATCH /api/campaigns/:id` - Update campaign
- `PATCH /api/deposits/:id/status` - Approve/reject deposit
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/balance` - Adjust user balance
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/settings` - Platform settings
- `POST /api/admin/settings` - Update settings

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit project ID (auto-provided)
- `ISSUER_URL` - OIDC issuer URL (auto-provided)

## Database Tables
- `users` - User accounts with wallet balance
- `celebrities` - Celebrity profiles and pricing
- `bookings` - Event booking requests
- `campaigns` - Marketing campaign requests
- `messages` - Chat messages
- `deposits` - Crypto deposit records
- `notifications` - User notifications
- `admin_logs` - Admin activity logs
- `settings` - Platform configuration
- `sessions` - Auth session storage

## Recent Changes (December 2025)
- Initial platform implementation
- Replit Auth integration
- WebSocket real-time chat
- CoinGecko crypto price integration
- PDF invoice generation
- Mobile-first responsive design
