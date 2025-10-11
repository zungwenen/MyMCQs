# Easyread IQ - MCQ Quiz Platform

## Overview
Easyread IQ is a mobile-first MCQ quiz web application built with React, Supabase, Zustand, and TanStack Query. The platform enables users to take quizzes on various subjects with WhatsApp/SMS OTP authentication and premium content access via Paystack payments.

## Recent Changes
- **2025-10-11**: Payment Error Message Improvement
  - Payment initialization now returns actual Paystack error messages
  - Helps debug split payment issues (invalid codes, authorization errors, etc.)
  - Previously showed generic "Payment initialization failed" message
  - Now displays specific Paystack errors for faster troubleshooting

- **2025-10-11**: Payment Settings Upsert Fix
  - Fixed payment settings update endpoint to work in production
  - Endpoint now uses upsert pattern (creates record if doesn't exist, updates if exists)
  - Resolves "Cannot read properties of undefined" error in fresh production databases
  - No longer assumes payment settings record exists from seed scripts

- **2025-10-11**: Admin Setup Page Implementation
  - Added initial setup page at `/admin/setup` for production deployments
  - Allows creating the first super admin without running seed scripts
  - Automatically redirects to login page once setup is complete
  - Login page displays setup link when no admins exist
  - Security: Setup endpoint blocks access after first admin is created
  - Validation: Username min 3 chars, password min 6 chars, password confirmation

- **2025-10-11**: IQ Assessment System Implementation
  - Added configurable IQ grading system with admin management interface
  - Quiz submissions now calculate and display IQ scores based on percentage ranges
  - Admin can create/edit/delete IQ grade ranges (global or subject-specific)
  - Results page refactored with prominent IQ score display
  - Question review converted to accordion UI for better UX
  - Validation ensures logical min/max ranges for scores and IQ values
  - Database schema: Added `iq_grades` table and `iqScore`/`iqLabel` to quiz_attempts
  - Admin Settings: New "IQ Grades" tab for complete CRUD management

- **2025-01-11**: Security Fix - Implemented proper session management
  - **CRITICAL**: Replaced client-controlled headers with httpOnly cookie-based sessions
  - User sessions now use server-issued tokens (28-day expiry for auto-login)
  - Admin sessions use server-issued tokens (24-hour expiry)
  - All protected routes now validate session tokens server-side
  - Added `/api/auth/me` endpoint to check current session
  - Added `/api/auth/logout` endpoint to clear session cookies
  - Session middleware validates token age and user/admin existence
  
- **2025-01-11**: Initial implementation of complete quiz platform
  - Schema-first development with all data models defined
  - Full frontend implementation with mobile-first responsive design
  - Backend API implementation with Twilio OTP authentication
  - Paystack payment integration for premium access
  - Admin dashboard for managing subjects, quizzes, and questions
  - Subject-specific color theming throughout the app

## Architecture

### Frontend
- **React** with TypeScript for type safety
- **Zustand** for lightweight state management (auth, quiz state)
- **TanStack Query** for efficient data fetching and caching
- **Wouter** for client-side routing
- **Shadcn UI** with Tailwind CSS for component library
- **Web Speech API** for text-to-speech functionality

### Backend
- **Express.js** API server
- **Supabase (PostgreSQL)** for database
- **Drizzle ORM** for type-safe database operations
- **Twilio** for WhatsApp/SMS OTP authentication
- **Paystack** for payment processing with split payment support
- **bcrypt** for password hashing

### Database Schema
- **users**: Quiz takers with phone authentication
- **admins**: Super admin and sub-admins
- **otp_sessions**: OTP verification sessions
- **subjects**: Quiz categories with theme colors
- **quizzes**: Quiz details and settings
- **questions**: MCQ and True/False questions
- **quiz_attempts**: User quiz submissions, scores, and IQ assessments
- **iq_grades**: Configurable IQ grade ranges (global or subject-specific)
- **payments**: Premium membership transactions
- **payment_settings**: Configurable pricing and Paystack settings

## Key Features

### User Features
- Phone number registration with WhatsApp OTP (SMS fallback)
- 4-week auto-login for verified users
- Subject browsing with Free/Premium badges
- Single-question-per-page quiz interface
- Subject-specific color-coded progress bars
- Text-to-speech question reading
- Mark questions for review
- Instant feedback option (admin configurable)
- Detailed results with IQ score display and accordion question review
- IQ assessment based on performance (configurable by admin)
- User profile with quiz history and payment records
- Payment modal for premium access

### Admin Features
- Separate super admin authentication
- Subject management with color picker and Free/Premium toggle
- Quiz creation with grading settings (pass mark, time limit, instant feedback, randomize)
- Question editor supporting Multiple Choice and True/False types
- Admin user management (super admin can create sub-admins)
- IQ grade configuration (create ranges, set labels, global or subject-specific)
- Payment settings configuration (price, Paystack split code)
- Analytics dashboard (total attempts, pass rate, average score, revenue)

## Authentication Flow

### User Auth
1. User enters phone number
2. System attempts auto-login if verified within 4 weeks
3. If auto-login fails, generates OTP and sends via WhatsApp
4. Falls back to SMS if WhatsApp fails
5. User verifies OTP (6-digit code)
6. User provides name if first-time registration
7. Session persisted in Zustand with localStorage

### Admin Auth
- **Initial Setup** (Production): Visit `/admin/setup` to create your first super admin
  - Only accessible when no admins exist in database
  - Automatically redirects to login once setup is complete
  - Login page shows setup link when no admins are found
- **Login**: `/admin/login`
- Username/password authentication with bcrypt
- **Development**: Super admin seeded via scripts (`username: admin, password: admin123`)
- Super admin can create additional admins via Settings page

## API Endpoints

### Auth
- `POST /api/auth/send-otp` - Send OTP via WhatsApp/SMS
- `POST /api/auth/verify-otp` - Verify OTP and create/login user
- `POST /api/auth/login-without-otp` - Auto-login for recent users
- `PATCH /api/users/profile` - Update user name

### Admin Auth
- `GET /api/admin/setup-needed` - Check if initial setup is required (no admins exist)
- `POST /api/admin/setup` - Create first super admin (only works when no admins exist)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/create-admin` - Create new admin (super admin only)
- `GET /api/admin/admins` - List all admins
- `DELETE /api/admin/admins/:id` - Delete admin

### Subjects
- `GET /api/subjects` - Get all subjects with quizzes
- `GET /api/admin/subjects` - Admin: Get all subjects
- `POST /api/admin/subjects` - Admin: Create subject
- `PATCH /api/admin/subjects/:id` - Admin: Update subject
- `DELETE /api/admin/subjects/:id` - Admin: Delete subject

### Quizzes
- `GET /api/quizzes/:id` - Get quiz with subject and questions
- `GET /api/admin/quizzes` - Admin: Get all quizzes
- `POST /api/admin/quizzes` - Admin: Create quiz
- `PATCH /api/admin/quizzes/:id` - Admin: Update quiz
- `DELETE /api/admin/quizzes/:id` - Admin: Delete quiz

### Questions
- `GET /api/admin/questions/:quizId` - Admin: Get quiz questions
- `POST /api/admin/quizzes/:quizId/questions` - Admin: Create question
- `PATCH /api/admin/questions/:id` - Admin: Update question
- `DELETE /api/admin/questions/:id` - Admin: Delete question

### Quiz Attempts
- `POST /api/quizzes/:id/submit` - Submit quiz attempt
- `GET /api/quiz-attempts/:id` - Get attempt with results
- `GET /api/quiz-attempts` - Get user's attempt history
- `GET /api/admin/attempts` - Admin: Get all attempts

### Payments
- `POST /api/payments/initialize` - Initialize Paystack payment
- `GET /api/payments/verify/:reference` - Verify payment
- `GET /api/payments/user` - Get user's payment history
- `GET /api/admin/payments` - Admin: Get all payments

### Payment Settings
- `GET /api/payment-settings` - Get current settings
- `PATCH /api/admin/payment-settings` - Admin: Update settings

## Design System

### Colors (from design_guidelines.md)
- **Primary**: Blue (217 91% 60%) - Main brand color
- **Success**: Green (142 76% 36%) - Pass state, free badges
- **Premium**: Gold (43 96% 56%) - Premium features
- **Warning**: Orange (38 92% 50%) - Low time alerts
- **Destructive**: Red (0 72% 51%) - Fail state, errors

### Subject Theme Colors
- Business Law: Blue (217 91% 60%)
- Corporate Governance: Green (142 71% 45%)
- Taxation: Purple (262 83% 58%)
- General: Orange (24 95% 53%)
- Customizable per subject in admin

### Typography
- **Primary Font**: Inter (400, 500, 600, 700)
- **Monospace**: JetBrains Mono for timers, scores
- Mobile-first type scale with responsive sizing

### Layout
- Mobile-first with breakpoints: base (< 640px), md (768px), lg (1024px)
- Quiz content max-width: 2xl (672px) for optimal reading
- Full-screen question pages on mobile (min-h-screen)

## User Preferences
- Dark/light mode toggle with system preference detection
- Theme persisted in localStorage
- Smooth transitions between modes

## Development Commands
- `npm run dev` - Start development server (frontend + backend)
- `npx tsx server/seed-admin.ts` - Seed super admin in development
- `npx tsx server/seed-production.ts` - Seed demo data in development
- `npx tsx server/seed-iq-grades.ts` - Seed default IQ grade ranges

## Environment Variables
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `PAYSTACK_SECRET_KEY` - Paystack API secret key
- `SESSION_SECRET` - Express session secret (auto-generated)
- Twilio credentials managed via Replit connector

## Super Admin Access

### Production (First-Time Setup)
1. Visit `/admin/setup` in your deployed app
2. Create your super admin credentials (username min 3 chars, password min 6 chars)
3. Login at `/admin/login` with your credentials

### Development (Using Seed Scripts)
- Username: `admin`
- Password: `admin123`
- Access at: `/admin/login`
- Run `npx tsx server/seed-admin.ts` to create this account

## Project Structure
```
├── client/src/
│   ├── components/
│   │   ├── auth/              # OTP input, phone auth modal
│   │   ├── admin/             # Admin login, layout
│   │   ├── quiz/              # Subject cards, question cards, progress, payment modal
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── user-layout.tsx
│   ├── pages/
│   │   ├── dashboard.tsx      # User dashboard
│   │   ├── quiz-page.tsx      # Quiz taking interface
│   │   ├── results-page.tsx   # Quiz results
│   │   ├── profile-page.tsx   # User profile
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-subjects.tsx
│   │   ├── admin-quizzes.tsx
│   │   ├── admin-questions.tsx
│   │   └── admin-settings.tsx
│   ├── store/
│   │   ├── auth.ts            # Zustand auth store
│   │   └── quiz.ts            # Zustand quiz state
│   ├── hooks/
│   │   └── use-tts.ts         # Text-to-speech hook
│   └── App.tsx
├── server/
│   ├── routes.ts              # All API endpoints
│   ├── db.ts                  # Drizzle database client
│   ├── services/
│   │   └── twilio.ts          # Twilio OTP service
│   └── seed-admin.ts          # Super admin seeder
├── shared/
│   └── schema.ts              # Drizzle schema with relations
└── drizzle/
    └── 0000_init.sql          # Initial migration
```

## Security & Session Management
- **Session Tokens**: Server-issued httpOnly cookies (not client-controlled headers)
- **User Sessions**: 28-day token expiry for auto-login feature
- **Admin Sessions**: 24-hour token expiry for security
- **Token Format**: `{userId/adminId}:{timestamp}` validated server-side
- **Protected Routes**: All use requireUser or requireAdmin middleware
- **Cookie Settings**: httpOnly, sameSite: 'lax', secure in production

## Notes
- Subject theme colors are customizable and affect progress bars
- Payment flow redirects to Paystack, then back to callback URL
- OTP sessions expire after 10 minutes
- Verified users can auto-login for 28 days
- Frontend uses credentials: 'include' for all API requests to send session cookies
