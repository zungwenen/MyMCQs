# Easyread IQ - MCQ Quiz Platform

## Overview
Easyread IQ is a mobile-first MCQ quiz web application designed to provide users with an engaging platform for taking quizzes across various subjects. It features secure WhatsApp/SMS OTP authentication and offers premium content access facilitated by Paystack payments. The project aims to deliver a robust and user-friendly educational tool with a focus on accessibility and efficient learning.

## User Preferences
- Dark/light mode toggle with system preference detection
- Theme persisted in localStorage
- Smooth transitions between modes

## System Architecture
The application is built with a modern web stack, prioritizing performance, scalability, and a rich user experience.

### UI/UX Decisions
- **Mobile-first Design**: Responsive layouts with breakpoints for optimal viewing on various devices (base, md, lg).
- **Color Schemes**: Utilizes a predefined color palette for brand consistency (Primary: Blue, Success: Green, Premium: Gold, Warning: Orange, Destructive: Red).
- **Subject Theming**: Admins can customize subject-specific colors using an HTML5 color picker, which are applied to elements like progress bars.
- **Typography**: Employs Inter as the primary font and JetBrains Mono for data displays (timers, scores).
- **Layout**: Quiz content is constrained to `max-width: 2xl` for readability; question pages are full-screen on mobile.
- **Hero Section**: A compelling hero section is displayed for non-logged-in users, featuring law student imagery, key features, CTAs, and a subject preview. The "Get Started Free" CTA triggers the login dialog directly.
- **Font Sizes**: Reduced across all pages for improved mobile experience and visual hierarchy.
- **Question Review**: Converted to an accordion UI for better user experience.
- **Global Footer**: Consistent footer appears on all pages (dashboard, profile, quiz, results, admin pages) with dynamic year copyright, "Easyread Series" branding, love icon, and 9px responsive typography.
- **Login Dialog**: Compact PhoneAuthModal (350x500px max) with blue circular phone icon, centered "Welcome to Easyread IQ" title, clean card-based layout, scaled typography and spacing, inline input icons, and viewport-safe responsive design using `min(500px, 90vh)` for height. Includes proper accessibility support via sr-only dialog headers.

### Technical Implementations
- **Frontend**: React (TypeScript) for UI, Zustand for state management, TanStack Query for data fetching, Wouter for routing, Shadcn UI with Tailwind CSS for components, and Web Speech API for text-to-speech.
- **Backend**: Express.js API, Supabase (PostgreSQL) for the database, and Drizzle ORM for type-safe database interactions.
- **Authentication**: WhatsApp/SMS OTP via Twilio Direct SDK (using TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN), and `bcrypt` for password hashing for admin accounts. User sessions use httpOnly cookie-based server-issued tokens (28-day expiry), while admin sessions have a 24-hour expiry.
- **Payment Processing**: Paystack integration with support for split payments. Callback URL configured via APP_URL environment variable.
- **Quiz System**: Single-question-per-page interface, subject-specific progress bars, instant feedback (configurable), and detailed results with IQ score display.
- **IQ Assessment**: Configurable grading system allowing admins to define global or subject-specific IQ grade ranges. Quiz submissions automatically calculate and display IQ scores.
- **Admin Features**: Comprehensive dashboard for managing subjects, quizzes, questions (MCQ, True/False), admin users, IQ grades, and payment settings. Includes an initial setup page for creating the first super admin in production environments.
- **Deployment**: Application is portable and can run on cPanel hosting. No Replit-specific dependencies. Complete deployment guide available in CPANEL_DEPLOYMENT.md.

### System Design Choices
- **Database Schema**: Structured around `users`, `admins`, `otp_sessions`, `subjects`, `quizzes`, `questions`, `quiz_attempts`, `iq_grades`, `payments`, and `payment_settings` tables.
- **API Endpoints**: Organized by resource (Auth, Admin Auth, Subjects, Quizzes, Questions, Quiz Attempts, Payments, Payment Settings) for clear separation of concerns.
- **Session Management**: Secure, server-side session management using httpOnly cookies to prevent client-side access.

## External Dependencies
- **Supabase**: Provides the PostgreSQL database and backend services.
- **Twilio**: Used for sending OTPs via WhatsApp and SMS for user authentication.
- **Paystack**: Integrated for processing payments and managing premium content access.
- **React**: Frontend library for building user interfaces.
- **Zustand**: Lightweight state management library.
- **TanStack Query**: Data fetching and caching library.
- **Wouter**: Client-side routing library.
- **Shadcn UI & Tailwind CSS**: Component library and utility-first CSS framework for styling.
- **Express.js**: Backend web application framework.
- **Drizzle ORM**: TypeScript ORM for database interactions.
- **bcrypt**: Library for hashing passwords.
- **Web Speech API**: Browser API for text-to-speech functionality.