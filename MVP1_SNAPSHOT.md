# MVP1 Snapshot - Khana Dabba

## Description
This snapshot represents the first stable version (MVP1) of the Khana Dabba application, a youth-friendly food ordering platform for managing monthly lunch selections.

## Key Features
- User Authentication
- Kid Profile Management
- Monthly Menu Management
- Lunch Selection System with Calendar Interface
- Support for Vegetarian and Non-Vegetarian Options
- Holiday Management

## Database Schema
- users
- kids
- monthly_menu_items
- lunch_selections
- selection_history
- holidays

## Technology Stack
- Frontend: React with shadcn/ui components
- Backend: Express.js
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js
- State Management: TanStack Query

## Key Files
1. Schema and Types: `shared/schema.ts`
2. Backend Routes: `server/routes.ts`
3. Frontend Pages:
   - `client/src/pages/kids-page.tsx`
   - `client/src/pages/lunch-selection-page.tsx`
   - Other supporting pages

## Environment Requirements
- Node.js
- PostgreSQL Database
- Required Environment Variables:
  - DATABASE_URL
  - SESSION_SECRET

## Snapshot Notes
- Date: February 17, 2025
- State: All core features working
- Last Verified Changes: Kid profile creation and lunch selection functionality

## Recovery Instructions
To restore to this version:
1. Ensure all code matches the files in the repository
2. Verify the database schema matches the Drizzle schema
3. Confirm all environment variables are set
4. Run the application and verify core functionalities
