# RIC Event Management System — Complete Project Documentation

## Executive Summary

The RIC Event Management System is a comprehensive, full-stack web application designed to handle event discovery, interactive seat selection, ticketing, membership management, and administrative operations. Built with Next.js 15, React, Prisma, and PostgreSQL (Neon), the system provides a seamless experience for both general users and registered members. Key features include an SVG-based interactive seating chart, real-time checkout, automated email confirmations with QR codes, and a robust admin dashboard for event and member management.

This documentation serves as the ultimate reference for developers, project managers, and future maintenance teams.

> [!IMPORTANT]  
> Please review the **Critical Findings** section under Security and Bug Analysis. Immediate action is required to patch critical authorization vulnerabilities and prevent potential data breaches.

---

## 1. Project Overview

**Purpose:** To streamline the event booking process for the RIC Auditorium, offering interactive seat selection, secure checkout, and comprehensive administration tools.

**Key Features:**
- **User Facing:** Event browsing, interactive SVG seating chart with pan/zoom, multi-step booking, QR code generation, and email confirmations.
- **Member System:** Dedicated login for registered members, exclusive seat reservations, and member-website account linking.
- **Administration:** Dashboard for revenue tracking, event CRUD operations, member management, hall configuration, transaction history, and QR-based attendee check-in.

---

## 2. Technology Stack

- **Frontend:** Next.js 15.3.8 (App Router), React 18, Tailwind CSS, shadcn/ui (Radix primitives), Framer Motion, Recharts.
- **Backend:** Next.js Server Actions, NextAuth v5 (beta) for OAuth/Credentials, `jose` for member JWTs.
- **Database & ORM:** PostgreSQL (Neon serverless), Prisma ORM 7.8 (with driver adapters).
- **Libraries & Integrations:** 
  - `html5-qrcode` / `react-qr-code`: QR generation and scanning.
  - `jspdf` / `html2canvas`: Ticket generation.
  - `nodemailer`: SMTP email dispatch.
  - `zod` / `react-hook-form`: Validation and form handling.
  - `date-fns`: Date manipulation.

---

## 3. System Architecture

The application follows a monolithic serverless architecture leveraging Next.js App Router:
- **Client Components:** Handle rich interactions (seating charts, checkout flows) using React hooks and local state.
- **Server Components:** Fetch data directly from the database to improve performance and SEO.
- **Server Actions:** Handle form submissions, data mutations, and business logic securely on the server.
- **Database Layer:** Prisma ORM acts as the bridge to the Neon PostgreSQL database, ensuring type safety and atomic transactions.

---

## 4. Folder & File Structure

- `/src/app/`: Next.js App Router pages and layouts.
  - `/(site)`: Public facing pages (Home, Events, About).
  - `/admin/`: Protected admin dashboard and management pages.
  - `/member/`: Member-specific portal.
  - `/api/`: API routes (NextAuth and webhooks).
  - `/actions/`: Server actions containing core business logic (e.g., `booking-actions.ts`, `event-actions.ts`).
- `/src/components/`: Reusable UI components (shadcn/ui primitives, layout components).
- `/src/hooks/`: Custom React hooks.
- `/src/lib/`: Utility functions, Prisma client instantiation, and auth helpers.
- `/prisma/`: Database schema (`schema.prisma`) and seed scripts.
- `/docs/`: Project documentation.

---

## 5. Database Documentation

**Core Tables:**
- `User`, `Account`, `Session`: NextAuth required tables for authentication.
- `Event`: Stores event details (name, date, venue, image, showtimes, JSON-based seating chart).
- `Booking`: Tracks user bookings, linked to `User` and `Event`. Stores attendee data and payment info as JSON.
- `CheckIn`: Records successful QR scans linked to specific `Booking` and seat.
- `Member`: Core directory of registered members.
- `SeatLock`: Temporary locks with TTL to prevent race conditions during checkout.
- `SeatReservation`: Member-exclusive pre-reservations.
- `Hall`: Configures auditorium layouts (sections, rows, seats).

*Note: The schema utilizes JSON fields for flexibility in `Event.ticketTypes`, `Booking.attendees`, and `Booking.paymentInfo`.*

---

## 6. API & Server Actions Documentation

The system primarily relies on Next.js Server Actions rather than traditional REST APIs.
- **`booking-actions.ts`**: Handles `createBooking()`, `getUserBookings()`.
- **`event-actions.ts`**: Handles CRUD for events.
- **`checkin-actions.ts`**: Processes QR code data to validate and create `CheckIn` records.
- **`member-actions.ts`**: Member directory management, import/export.
- **NextAuth API**: Located at `/api/auth/[...nextauth]`.

---

## 7. User Roles & Permissions

1. **GUEST**: Unauthenticated users. Can browse events and sign up.
2. **USER**: Authenticated users via Google/Credentials. Can book seats, view own tickets, and manage profile.
3. **MEMBER**: Verified offline members. Gain access to exclusive seats and member pricing. Authenticated via a custom JWT.
4. **ADMIN**: Full access to the `/admin` dashboard. Can modify events, view all transactions, manage members, and perform check-ins.

> [!CAUTION]  
> Current implementation lacks robust server-side role validation in several admin server actions.

---

## 8. Business Processes & Workflows

**Booking Flow:**
1. User browses to an event and selects a showtime.
2. User is presented with the interactive seating chart (SVG).
3. Selected seats are temporarily locked.
4. User enters attendee details and proceeds to Checkout (UPI/Card/Cash).
5. Upon confirmation, a `Booking` is recorded, and an email containing a QR code ticket is dispatched.

**Check-In Flow:**
1. Admin opens the Check-In scanner via the dashboard.
2. Scans attendee QR code.
3. System verifies booking validity and seat assignment.
4. Creates a `CheckIn` record, preventing double entry.

---

## 9. Configuration & Environment Setup

**Prerequisites:** Node.js 18+, PostgreSQL (Neon).

**Environment Variables (`.env.local`):**
- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption.
- `NEXTAUTH_URL`: Base URL (e.g., http://localhost:9002).
- `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`: Credentials for Nodemailer.
- `NEXT_PUBLIC_GMAPS_KEY`: Google Maps API Key.

**Installation:**
```bash
npm install
npm run postinstall # Generates Prisma client
npm run db:seed     # Seeds initial data
npm run dev         # Starts development server
```

---

## 10. Security Analysis

> [!WARNING]  
> Several critical security flaws were identified in the codebase.

- **Broken Access Control:** Admin server actions (e.g., `deleteAllEvents`, `deleteMember`) lack `getServerSession` checks. Any authenticated user can trigger them via the console.
- **Hardcoded Secrets:** Fallback JWT secrets (`fallback-secret-key-for-dev`) and default admin credentials exist in the source code.
- **IDOR (Insecure Direct Object Reference):** Users can cancel or fetch other users' bookings by manipulating `bookingId` parameters in server actions.
- **Race Conditions:** Lack of robust atomic seat locks between selection and final checkout can lead to double bookings.

---

## 11. Code Quality Review

- **Architecture:** Excellent use of Next.js 15 features and App Router. Strong separation of UI components via shadcn.
- **Type Safety:** High usage of TypeScript and Zod, though `ignoreBuildErrors: true` in `next.config.ts` masks existing compilation errors.
- **Duplication:** Pagination logic and `getSecret()` functions are duplicated across multiple files.
- **Technical Debt:** `any` types used extensively in booking and check-in actions. 

---

## 12. Bug & Issue Analysis

**High Priority:**
1. JWT forgery possible due to fallback secrets.
2. `checkInAllAttendees` uses `Promise.allSettled` but incorrectly swallows failures.
3. Card payment fields in the checkout dialog capture data but do not process it securely.

**Medium Priority:**
1. Seating chart lacks touch/mobile support for pan and zoom.
2. Expensive O(n) queries in `getAdminStats()` loading full booking records instead of using SQL aggregates.

---

## 13. Improvement Recommendations

- **Security Fixes:** Implement `getServerSession()` role checks atop all server actions. Remove hardcoded credentials.
- **Performance Optimization:** Refactor Prisma queries to use aggregates (`_count`, `_sum`). Implement caching using React Cache or SWR for `EventsProvider`.
- **UI/UX Enhancements:** Add touch gesture support to the seating chart. Make the checkout dialog mobile-friendly (bottom sheet or full screen).
- **Code Standards:** Remove `ignoreBuildErrors`, resolve all TypeScript/ESLint warnings, and replace `any` types with proper interfaces.

---

## 14. Deployment Guide

**Vercel / Firebase App Hosting:**
1. Connect the GitHub repository.
2. Configure all necessary Environment Variables.
3. Ensure the Build Command is `next build`.
4. Run `prisma db push` or `prisma migrate deploy` prior to build (or within a custom build script).
5. For Firebase, review the `apphosting.yaml` settings.

---

## 15. Future Roadmap

- **Phase 1: Security Patching:** Immediate remediation of IDOR and server action vulnerabilities.
- **Phase 2: Payment Gateway:** Integration with Razorpay or Stripe for actual card/UPI processing.
- **Phase 3: Real-Time Updates:** WebSocket or Server-Sent Events (SSE) integration to show live seat availability.
- **Phase 4: Advanced CRM:** Email marketing integration, automated reminders, and deeper membership analytics.
