# RIC Event Website — Complete Project Documentation

> **Generated:** June 11, 2026  
> **Codebase:** Next.js 15 + TypeScript + Prisma + PostgreSQL  
> **Domain:** Rajasthan International Centre (RIC) Event Management Platform

---

## 1. Project Overview

### Project Name
**RIC Event Website** (Rajasthan International Centre Event Management Platform)

### Purpose
A full-stack web application for the Rajasthan International Centre (RIC) in Jaipur that enables:
- Public discovery and booking of events hosted at RIC venues
- Administrative management of events, members, bookings, check-ins, and finances
- Member portal for RIC members to book free/exclusive seats
- Interactive seat selection with a visual auditorium layout
- QR-code-based check-in at event entrances

### Problem Being Solved
RIC previously lacked a centralized digital platform for event discovery, ticket booking, member management, and on-ground check-in. The manual process caused:
- Double-booking and over-selling of seats
- No way for RIC members to easily claim their complimentary tickets
- No digital check-in system (manual name lists)
- No centralized revenue/fee tracking
- No automated email confirmations

### Business Use Case
RIC is a cultural institution hosting 100+ events/year (music concerts, seminars, art exhibitions, theater, comedy). The platform serves:
1. **General public** — Browse events, book paid tickets, view booking history
2. **RIC Members** — Log in with Member ID, book free seats in exclusive sections
3. **Admin staff** — Create events, manage members, process check-ins, view financial reports
4. **Venue operations** — QR-based gate entry, real-time seat availability

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15.3.8 (App Router, React 18) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 3.4, tailwind-merge, clsx, class-variance-authority |
| **UI Components** | Radix UI primitives (30+ components), shadcn/ui pattern |
| **Animation** | Framer Motion 12.40 |
| **Charts** | Recharts 2.15 |
| **Forms** | react-hook-form + @hookform/resolvers + zod |
| **Database ORM** | Prisma 7.8 (with @prisma/adapter-neon) |
| **Database** | PostgreSQL (via Neon serverless) |
| **Authentication** | NextAuth v5 (beta.31) — JWT strategy |
| **OAuth** | Google Provider |
| **Member Auth** | Custom JWT-based (jose) with cookies |
| **Email** | Nodemailer (SMTP) |
| **QR Code** | react-qr-code, html5-qrcode (reader) |
| **PDF/Export** | jspdf 2.5, html2canvas 1.4 |
| **AI** | Genkit 1.14 (Google AI) |
| **Excel Import** | xlsx 0.18 |
| **Images** | Next/Image (remote: placehold.co, unsplash, picsum, gcp) |
| **Date Handling** | date-fns 3.6 |
| **Icons** | lucide-react 0.475 |
| **Deployment** | Firebase App Hosting (apphosting.yaml configured) |
| **Package Manager** | npm |

---

## 3. Folder Structure Analysis

```
RIC-Event-Website/
│
├── prisma/
│   ├── schema.prisma          # ALL 15 database models
│   └── seed.ts                # Seed script (users, events, members, bookings)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout: ThemeProvider, AuthProvider, EventsProvider, MemberAuthProvider
│   │   ├── globals.css           # Global Tailwind styles
│   │   ├── not-found.tsx         # Custom 404 page
│   │   ├── loading.tsx           # Global loading state
│   │   ├── (site)/               # Route Group: Public-facing pages
│   │   │   ├── layout.tsx        # Site header + footer wrapper
│   │   │   ├── page.tsx          # Homepage (hero, stats, events slider, venues, CTA)
│   │   │   ├── events/page.tsx   # Events listing with filters
│   │   │   ├── events/[id]/page.tsx        # Event detail page (gallery, ticket selection, details)
│   │   │   ├── events/[id]/seats/page.tsx  # Seat selection + booking flow (3-step wizard)
│   │   │   ├── about/page.tsx    # About RIC page (static)
│   │   │   ├── contact/page.tsx  # Contact form (client-side, no API persistence)
│   │   │   ├── login/page.tsx    # Website + Member dual login page
│   │   │   ├── member-login/page.tsx  # Redirect to /login?mode=member
│   │   │   ├── signup/page.tsx   # Registration page
│   │   │   └── account/page.tsx  # User account (bookings, linked member, cancel)
│   │   │
│   │   ├── admin/                     # Admin dashboard (protected)
│   │   │   ├── layout.tsx             # Sidebar, MembersProvider, ErrorBoundary
│   │   │   ├── page.tsx               # Dashboard: stats, chart, quick actions, seed tools
│   │   │   ├── events/
│   │   │   │   ├── page.tsx           # Events table with search, filter, pagination, CRUD
│   │   │   │   ├── events-provider.tsx # Context provider for event data
│   │   │   │   ├── create/page.tsx    # Event creation form
│   │   │   │   ├── edit/[id]/page.tsx # Event editing form
│   │   │   │   ├── [id]/bookings/page.tsx   # View bookings per event
│   │   │   │   └── [id]/seats-control/page.tsx  # Seat blocking & access tiers
│   │   │   ├── members/
│   │   │   │   ├── page.tsx           # Members table with CRUD
│   │   │   │   ├── members-provider.tsx # Context provider for member data
│   │   │   │   ├── create/page.tsx    # Member creation form
│   │   │   │   ├── edit/[id]/page.tsx # Member editing form
│   │   │   │   └── import/page.tsx    # Excel import for bulk member upload
│   │   │   ├── users/page.tsx         # Platform users list
│   │   │   ├── transactions/page.tsx  # Financial transactions with filtering
│   │   │   ├── checkin/page.tsx       # QR scanner + manual check-in
│   │   │   ├── fees/page.tsx          # GST & platform fee configuration
│   │   │   ├── reservations/page.tsx  # Member seat reservations management
│   │   │   ├── member-bookings/page.tsx # Member free seat bookings view
│   │   │   └── site-content/page.tsx  # Homepage content editor (hero, stats, etc.)
│   │   │
│   │   ├── member/              # Member portal (protected by member JWT cookie)
│   │   │   ├── dashboard/page.tsx  # Member dashboard (stats, profile, booking history)
│   │   │   ├── events/page.tsx     # Events listing for member booking
│   │   │   └── events/[id]/page.tsx # Member-specific booking flow (showtime → seats → confirm)
│   │   │
│   │   ├── confirmation/[bookingId]/page.tsx  # Post-booking confirmation with QR, download
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   │   ├── member-login/route.ts    # Member JWT login
│   │   │   │   ├── member-me/route.ts       # Get current member from cookie
│   │   │   │   ├── member-logout/route.ts   # Clear member JWT cookie
│   │   │   │   ├── member-reset-password/route.ts # Reset member password
│   │   │   │   └── signup/route.ts          # User registration API
│   │   │   └── templates/members-import/route.ts # Download Excel import template
│   │   │
│   │   └── actions/             # Server Actions (26 files)
│   │       ├── admin-actions.ts             # seedDefaultAdmin
│   │       ├── admin-member-bookings-actions.ts # Member booking stats for admin
│   │       ├── authenticate-member-action.ts    # Verify member ID + password
│   │       ├── auto-verify-member-action.ts     # Auto-detect member from cookie
│   │       ├── booking-actions.ts               # createBooking, getBookedSeats, getUserBookings, etc.
│   │       ├── cancel-actions.ts                # cancelBooking
│   │       ├── chart-actions.ts                 # Monthly booking chart data
│   │       ├── check-member-action.ts           # Check if user is linked member
│   │       ├── checkin-actions.ts               # QR lookup, check-in, stats
│   │       ├── email-actions.ts                 # Send booking confirmation email
│   │       ├── event-actions.ts                 # CRUD + seed/deleteAll events
│   │       ├── fee-actions.ts                   # getFeeConfig, upsertFeeConfig, calculateFees
│   │       ├── hall-actions.ts                  # Hall CRUD
│   │       ├── member-actions.ts                # CRUD + seed/deleteAll members
│   │       ├── member-booking-actions.ts        # createMemberBooking (free)
│   │       ├── member-bookings-action.ts        # getMemberEventBookings
│   │       ├── member-import-actions.ts         # Excel import
│   │       ├── member-link-actions.ts           # linkMemberToUser, getLinkedMember, verifyMember
│   │       ├── member-user-actions.ts           # findOrCreateMemberUser
│   │       ├── reservation-actions.ts           # create/cancel/get/confirm reservations
│   │       ├── seat-admin-actions.ts            # Block seats, access tiers, admin booking
│   │       ├── site-content-actions.ts          # Get/update homepage content
│   │       └── transaction-actions.ts           # getAllTransactions, getTransactionStats
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── site-header.tsx   # Sticky nav with auth state, mobile sheet
│   │   │   └── site-footer.tsx   # Footer with links, contact, social (disabled)
│   │   ├── events/
│   │   │   ├── animated-hero.tsx  # Framer Motion carousel hero
│   │   │   ├── event-card.tsx     # Card component (4 variants)
│   │   │   ├── event-list.tsx     # Filterable grid/list with search
│   │   │   ├── seating-chart.tsx  # Interactive SVG auditorium seat map (485 lines)
│   │   │   └── ticket-selection.tsx # Ticket quantity selector
│   │   ├── checkout/
│   │   │   └── checkout-dialog.tsx # 902-line multi-step checkout (details, payment, invoice)
│   │   ├── account/
│   │   │   ├── invoice-display.tsx    # Invoice rendering
│   │   │   └── booking-details-dialog.tsx # Booking detail modal
│   │   ├── pet-hub/
│   │   │   └── seat-selection-layout.tsx # Alternative seat layout (legacy?)
│   │   ├── ui/                    # 35+ shadcn/ui components (button, card, form, etc.)
│   │   ├── theme-provider.tsx     # next-themes wrapper
│   │   ├── theme-toggle.tsx       # Light/dark toggle
│   │   ├── scroll-to-top.tsx      # Scroll-to-top button
│   │   ├── error-boundary.tsx     # React error boundary
│   │   └── CanvaslyExportButton.tsx # Export invoice as image/PDF
│   │
│   ├── hooks/
│   │   ├── use-auth.tsx          # NextAuth v5 context (login, signup, logout, Google sign-in)
│   │   ├── use-member-auth.tsx   # Member JWT auth context (login, logout, session)
│   │   ├── use-booking-flow.tsx  # Multi-step booking state machine
│   │   ├── use-toast.ts          # Toast notification system
│   │   └── use-mobile.tsx        # Responsive breakpoint detection
│   │
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton (Neon adapter)
│   │   ├── auth-helpers.ts       # JWT utilities, getCurrentMember, requireAdmin
│   │   ├── server-auth.ts        # requireAdminSession (for server actions)
│   │   ├── types.ts              # TypeScript type definitions (Event, Booking, Member, etc.)
│   │   ├── utils.ts              # cn() utility (clsx + tailwind-merge)
│   │   ├── rate-limit.ts         # In-memory rate limiter
│   │   ├── seat-layouts.ts       # RIC_AUDITORIUM config (217 lines of block definitions)
│   │   ├── default-hall-layout.ts
│   │   ├── halls.ts              # Hall template definitions
│   │   ├── dummy-data.ts         # Sample events for seeding
│   │   ├── members.json          # Sample member data
│   │   ├── placeholder-images.ts/json
│   │   ├── seating-chart-config.json
│   │   └── site-content-defaults.ts  # Default homepage content
│   │
│   ├── middleware.ts             # Admin route protection + rate limiting
│   ├── auth.ts                   # NextAuth config (Google + Credentials providers)
│   └── ai/
│       ├── genkit.ts             # Genkit AI setup
│       └── dev.ts                # Dev tools for Genkit
│
├── public/
│   └── ric-logo.png
│
├── docs/
│   ├── PROJECT_DOCUMENTATION.md
│   ├── projectdocuments.md
│   └── blueprint.md
│
├── .env / .env.local             # Environment variables (DB, SMTP, OAuth, etc.)
├── .firebaserc                   # Firebase project config
├── apphosting.yaml               # Firebase App Hosting config
├── firestore.rules               # Firestore rules (unused? but present)
├── prisma.config.ts
├── next.config.ts                # Image remote patterns config
├── tailwind.config.ts
├── tsconfig.json
├── components.json               # shadcn/ui config
├── studio.json                   # Firebase Studio config
├── calc.js / layout_calc.txt     # Seat layout calculation helpers
└── package.json                  # Dependencies & scripts
```

---

## 4. Feature Analysis

### Legend
| Icon | Meaning |
|------|---------|
| ✅ Complete | Fully implemented and functional |
| ⚠️ Partial | Core logic exists but has gaps |
| ❌ Missing | Not implemented at all |

| Feature | Status | Description |
|---------|--------|-------------|
| **Public Homepage** | ✅ Complete | Animated hero, stats counters, events slider, about section, venues, CTA |
| **Events Listing** | ✅ Complete | Category filter, search, grid/list toggle, pagination |
| **Event Detail Page** | ✅ Complete | Gallery, artist display, ticket selection, venue map, share, details, terms |
| **Interactive Seat Selection** | ✅ Complete | SVG-based RIC Auditorium visual seating chart with zoom/pan |
| **Multi-step Booking Flow** | ✅ Complete | Showtime → Seats → Summary → Checkout → Confirmation (public) |
| **NextAuth v5 Authentication** | ✅ Complete | JWT, Email/Password + Google OAuth |
| **Member Authentication** | ✅ Complete | Separate JWT cookie-based auth for RIC members |
| **Admin Dashboard** | ✅ Complete | Stats, chart, upcoming events, quick actions, DB tools |
| **Admin Event CRUD** | ✅ Complete | Create, read, update, delete events (with server validation) |
| **Admin Member CRUD** | ✅ Complete | Create, read, update, delete members (with server validation) |
| **Member Import (Excel)** | ✅ Complete | Bulk import from XLSX with duplicate detection |
| **User Management** | ⚠️ Partial | Users are listed but no edit/delete functionality |
| **Transaction History** | ✅ Complete | Paginated list with event/method/status filters |
| **Fee Configuration** | ✅ Complete | GST% + platform fee (percentage or flat) |
| **Price Calculation** | ✅ Complete | Subtotal → GST → Platform fee → Total |
| **QR Check-In** | ✅ Complete | Scan QR, view booking, check-in individual or all attendees |
| **Booking Cancellation** | ✅ Complete | Cancel booking with ownership verification |
| **Email Confirmation** | ⚠️ Partial | Nodemailer transporter configured; calls `sendBookingConfirmation` from checkout dialog but SMTP env vars may not be set |
| **Member Portal** | ✅ Complete | Dashboard, stats, booking history, free seat booking |
| **Member Free Seats** | ✅ Complete | Members can book free seats in Members section |
| **Seat Locking (Race Prevention)** | ✅ Complete | SeatLock model with 10-min TTL, upsert, cleanup |
| **Member Seat Reservations** | ✅ Complete | Reserve seats for members + guests, TTL, confirm/cancel |
| **Admin Seat Control** | ✅ Complete | Block/unblock seats, set access tiers (VIP/Member/General) |
| **Site Content Management** | ⚠️ Partial | Homepage content is fetched/editable but the admin editor UI only shows raw JSON |
| **About Page** | ✅ Complete | Static content with venue listings, stats, mission/vision |
| **Contact Page** | ✅ Complete | Form with validation; **submission only shows toast — no API persistence** |
| **Signup Page** | ✅ Complete | Registration with email/password + Google |
| **Responsive Design** | ✅ Complete | Mobile hamburger menu, responsive grids, mobile-first |
| **Dark Mode** | ✅ Complete | Theme toggle with next-themes |
| **Invoice Download** | ✅ Complete | Canvasly export of booking invoice as image |
| **Booking Chart (Admin)** | ✅ Complete | Monthly stacked bar chart (paid vs free seats) |
| **Rate Limiting** | ✅ Complete | In-memory rate limiter for auth & API routes |
| **Genkit AI** | ⚠️ Partial | Config files exist but no Genkit flows are invoked from application code |
| **Firestore Usage** | ❌ Missing | `firestore.rules` exists but no Firestore integration in code |
| **Payment Gateway** | ❌ Missing | "Payment" is simulated — only payment info is stored; no real gateway integration |
| **Social Login (non-Google)** | ❌ Missing | Only Google OAuth is configured |
| **User Profile Editing** | ❌ Missing | Account page is read-only; no edit name/email/password |
| **Password Reset** | ❌ Missing | No forgot-password flow for website users |
| **Event Search (full-text)** | ❌ Missing | Only client-side string filtering |
| **Notifications** | ❌ Missing | No push/email notification system for admins |
| **Multi-language** | ❌ Missing | English only |
| **Online Payment** | ❌ Missing | UPI ID is shown but no actual payment SDK integration |

---

## 5. Authentication & Authorization

### 5.1 Login Flow

#### For Website Users
1. User visits `/login` page
2. Two modes: **Website Login** (email+password) or **Member Login** (Member ID+password)
3. Website mode uses **NextAuth v5** with JWT strategy
4. Credentials: `bcryptjs` password comparison against `User.password` field
5. Google OAuth: if `GOOGLE_CLIENT_ID` env var is set, Google sign-in is available
6. On success: session token stored in `authjs.session-token` (or `__Secure-authjs.session-token` in production)
7. User is redirected to `/account` or the `redirect` query parameter

#### For RIC Members
1. User visits `/login?mode=member` (or `/member-login` redirects here)
2. Enter Member ID (integer) + password
3. POST to `/api/auth/member-login` — validates against `Member.password` (bcrypt)
4. On success: JWT is created using `jose` library and stored in `member-token` cookie
5. Cookie path: `/` with 7-day expiry
6. User is redirected to `/member/dashboard` or the `redirect` parameter

### 5.2 JWT/Session Usage
- **NextAuth v5**: Uses JWT session strategy (`session: { strategy: "jwt" }`)
- JWT callback adds `role` and `id` to token
- Session callback propagates role and id to client
- **Member Auth**: Custom JWT with jose library, stored in `member-token` cookie
- Middleware checks both NextAuth v4 and v5 cookie formats for admin protection

### 5.3 Roles and Permissions
| Role | Capabilities |
|------|-------------|
| `ADMIN` | Full admin dashboard, CRUD events/members, check-in, fees, transactions, site content, DB seeding |
| `USER` | Browse events, book tickets, view account, cancel own bookings |
| `MEMBER` (not a DB role — separate entity) | Free seat booking, member dashboard, linked to `User` via `Member.userId` |

### 5.4 Protected Routes
- **`/admin/*`**: Middleware checks for valid NextAuth session token with `role === "ADMIN"`. Redirects to `/login?redirect=/admin` if unauthorized.
- **`/member/*`**: Client-side check via `useMemberAuth()` hook — redirects to `/member-login` if no member cookie.
- **`/account`**: Client-side check via `useAuth()` hook — redirects to `/login` if not logged in.
- **Server Actions**: `requireAdminSession()` from `src/lib/server-auth.ts` protects all admin server actions.

---

## 6. Database Analysis

### 6.1 Models (15 total)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Platform users (public + admin) | email (unique), password (hashed), role (USER/ADMIN) |
| **Account** | NextAuth OAuth accounts | userId, provider, providerAccountId |
| **Session** | NextAuth sessions | sessionToken, userId, expires |
| **VerificationToken** | NextAuth email verification | identifier, token (unique) |
| **Event** | Events hosted at RIC | name, date, category, venue, ticketTypes (JSON), seatingChart (JSON), showtimes |
| **Booking** | Ticket bookings | userId, eventId, attendees (JSON array), total, paymentInfo (JSON) |
| **Member** | RIC physical members | memberId (unique int), categoryType/Acronym, name, phone, email, password, userId (nullable link) |
| **Hall** | Venue hall configurations | name (unique), sections (JSON), totalSeats |
| **FeeConfig** | GST & platform fee settings | gstPercentage, platformFeeType, platformFeeValue, active |
| **CheckIn** | Event gate entry tracking | bookingId, eventId, seatId, attendeeName, checkedBy |
| **SeatLock** | Temporary booking locks | eventId, seatId, userId, expiresAt (10-min TTL) |
| **BlockedSeat** | Admin-disabled seats | eventId, seatId (unique pair), reason |
| **SeatAccessTier** | Per-seat access overrides | eventId, seatId, tier (VIP_ONLY/MEMBERS_ONLY/GENERAL) |
| **SeatReservation** | Member pre-reservations | eventId, seatId, memberId, guestCount, status, expiresAt |
| **SiteContent** | Dynamic homepage content | section (unique, e.g. "hero"), title, subtitle, content (JSON) |

### 6.2 Relationships
```
User ──< Booking >── Event
User ──< Account (OAuth)
User ──< Session
Member >── Booking (via verifyMemberForSeatSelection)
Member ──? User (via userId)
Event ──< Booking
Event ──< BlockedSeat
Event ──< SeatReservation
Event ──< SeatAccessTier
Booking ──< CheckIn
```

### 6.3 Data Flow
```
Browser → NextAuth JWT → Server Action → Prisma → PostgreSQL (Neon)
Browser → member-token Cookie → API Route → jose verify → Prisma → PostgreSQL
Admin → Server Action (requireAdminSession) → Prisma → PostgreSQL
```

---

## 7. API Documentation

### 7.1 API Routes (`src/app/api/`)

#### `POST /api/auth/member-login`
- **Purpose:** Authenticate a RIC member by ID + password
- **Request:** `{ memberId: number, password: string }`
- **Response:** `{ success: true, member: {...} }` or `{ success: false, error: string }`
- **Sets cookie:** `member-token` (JWT, 7-day expiry)

#### `POST /api/auth/member-logout`
- **Purpose:** Clear member JWT cookie
- **Response:** `{ success: true }`

#### `GET /api/auth/member-me`
- **Purpose:** Get current member from cookie (session check)
- **Response:** `{ member: MemberData }` or empty body if not authenticated

#### `POST /api/auth/member-reset-password`
- **Purpose:** Reset member password (admin functionality)
- **Request:** `{ memberId: number, newPassword: string }`

#### `POST /api/auth/signup`
- **Purpose:** Register new website user
- **Request:** `{ email: string, password: string, name: string }`
- **Response:** `{ message: "User created" }` or error with `code` (e.g. `auth/email-already-in-use`)

#### `GET|POST|... /api/auth/[...nextauth]`
- **Purpose:** NextAuth v5 handler (Google OAuth + Credentials)

#### `GET /api/templates/members-import`
- **Purpose:** Download Excel template for member bulk import

### 7.2 Server Actions (Key ones)

| Action | Method | Purpose |
|--------|--------|---------|
| `createBooking` | Server Action | Creates a booking with seat lock, validation, member-only seat check |
| `getBookedSeats` | Server Action | Returns booked + blocked + reserved seat IDs for an event |
| `getUserBookings` | Server Action | Returns all bookings for a user |
| `cancelBooking` | Server Action | Cancel a booking (ownership verified) |
| `addEvent` | Server Action | Create event (admin, validated) |
| `updateEvent` | Server Action | Update event (admin, partial) |
| `deleteEvent` | Server Action | Delete event + all bookings (admin) |
| `addMember` | Server Action | Create member (admin, password hashed) |
| `importMembersFromExcel` | Server Action | Bulk import from XLSX |
| `checkInAttendee` | Server Action | Check-in single attendee |
| `checkInAllAttendees` | Server Action | Check-in all at once |
| `calculateFees` | Server Action | Calculate GST + platform fee |
| `upsertFeeConfig` | Server Action | Save fee configuration |
| `sendBookingConfirmation` | Server Action | Send email via Nodemailer |
| `seedDefaultAdmin` | Server Action | Create admin@ric.com / admin123 |
| `getAdminStats` | Server Action | Total revenue, users, bookings |
| `getBookingsChartData` | Server Action | Monthly booking data for chart |
| `createMemberBooking` | Server Action | Free member booking |
| `createReservation` | Server Action | Member seat reservation |
| `toggleBlockSeat` | Server Action | Block/unblock a seat |
| `setSeatAccessTier` | Server Action | Set VIP/Member/General tier |

---

## 8. System Architecture

### 8.1 Frontend Flow
```
User Browser
│
├── Public Pages (/(site))
│   ├── Homepage → AnimatedHero + EventsProvider context
│   ├── Events → EventList → EventCard
│   ├── Event Detail → TicketSelection → SeatsPage
│   │   └── SeatsPage (3-step wizard)
│   │       ├── Step 1: ShowtimeSelection
│   │       ├── Step 2: SeatingChart (SVG interactive map)
│   │       └── Step 3: BookingSummary → CheckoutDialog
│   ├── Login/Signup → NextAuth or Member Auth
│   └── Account → Booking list, cancellation, member linking
│
├── Admin Pages (/admin)
│   ├── Sidebar layout → MembersProvider + EventsProvider
│   ├── Dashboard → Stats + Chart + Quick Actions
│   ├── Events → Table + CRUD forms
│   ├── Members → Table + CRUD forms + Excel import
│   ├── CheckIn → QR scanner + manual search
│   ├── Transactions → Filters, transaction table
│   ├── Fees → GST/platform fee editor
│   ├── Site Content → Homepage JSON editor
│   └── Reservations → Member reservation management
│
├── Member Portal (/member)
│   ├── Dashboard → Member stats, profile, booking history
│   └── Events → Event list → Member booking flow
│
└── Confirmation (/confirmation/[bookingId])
    → Booking details, QR code, invoice download
```

### 8.2 Backend Flow
```
Request
│
├── middleware.ts
│   ├── Rate limit check (in-memory Map by IP)
│   └── Admin route protection (JWT token validation)
│
├── NextAuth (src/auth.ts)
│   ├── JWT strategy
│   ├── Google + Credentials providers
│   ├── Prisma adapter for session/account persistence
│   └── JWT callback adds role + id
│
├── Server Actions (src/app/actions/)
│   ├── requireAdminSession() guard
│   ├── Zod validation on inputs
│   ├── Prisma queries
│   └── revalidatePath() for cache invalidation
│
└── API Routes (src/app/api/)
    ├── Member auth (jose JWT, cookie-based)
    ├── Signup (creates User, hashes password)
    └── Template download (static file)
```

### 8.3 Database Flow
```
Prisma Client (src/lib/prisma.ts)
│
├── Adapter: @prisma/adapter-neon (HTTP/fetch-based)
├── Connection: DATABASE_URL (PostgreSQL on Neon)
├── Global singleton (dev hot-reload safe)
└── 15 models mapped to PostgreSQL tables
```

---

## 9. User Journey

### Journey 1: Public User Booking Paid Tickets
1. User visits **Homepage** → sees hero carousel, stats, event slider
2. Clicks "View All" or browses **Events** page
3. Filters by category, searches by name
4. Clicks an **Event Card** → Event Detail page
5. Views gallery, details, artists, venue map
6. Selects **ticket count** in TicketSelection sidebar
7. Clicks "Book Now" → navigates to `/events/[id]/seats`
8. **Step 1: Showtime** — selects time, sees ticket categories
9. Clicks "Select Seats"
10. **Step 2: Seats** — interactive seating chart (zoom, pan)
    - Green = available, Gray = taken/bocked
    - Member section shown (but disabled for non-members)
    - Selects desired number of seats
11. Clicks "Continue"
12. **Step 3: Summary** — reviews selection, sees total
13. Clicks "Proceed to Pay" (requires login; redirects to login if not)
14. **Checkout Dialog** — fills attendee names
    - Optionally verifies member ID for member seats
    - Selects payment method (PhonePe/GPay/Paytm/Card/Cash/UPI)
    - Enters UPI transaction ID (simulated payment)
15. Clicks "Confirm Booking"
16. Server action `createBooking` runs:
    - Validates input
    - Checks member-only seat restrictions
    - Acquires seat locks (10-min TTL)
    - Verifies no double-booking
    - Creates booking record
    - Releases seat locks
17. Redirected to **Confirmation Page** (`/confirmation/[bookingId]`)
18. Sees QR code, booking details, invoice
19. Can **Download Invoice** as image via Canvasly
20. Email confirmation sent (if SMTP configured)

### Journey 2: RIC Member Booking Free Seats
1. Member visits site, clicks "Member Login" in header
2. On login page, switches to **Member Login** tab
3. Enters Member ID + password → POST to `/api/auth/member-login`
4. JWT set in `member-token` cookie
5. Redirected to **Member Dashboard** (`/member/dashboard`)
6. Sees stats (total bookings, events, upcoming/past)
7. Views personal details, booking history
8. Clicks "Book Free Seats" or "Upcoming Events"
9. Browses **Member Events** page
10. Events show "Free for Members" badge
11. Clicks event → **Member Booking Flow**
12. Selects showtime → Selects seats (up to 6 per booking)
13. Reviews confirmation (all seats FREE)
14. Clicks "Confirm Free Booking"
15. `createMemberBooking` server action creates booking with `total: 0`
16. Sees confirmation screen

### Journey 3: Admin Managing Events
1. Admin navigates to `/admin`
2. Sees dashboard with stats (revenue, users, events, members)
3. Views monthly bookings chart
4. From Quick Actions, clicks "Create Event"
5. Fills event form (name, description, date, venue, category, image, showtimes, ticket types, artists, etc.)
6. Submits → Zod validation → `addEvent` server action → event created
7. Navigates to "Manage Events" → sees all events in table
8. Can filter by upcoming/past, category, search
9. Clicks event → "View Bookings" → sees all bookings for that event
10. Can "Seats Control" → block seats, set access tiers
11. Navigates to "QR Check-In" → scans attendee QR codes at event gate
12. Marks attendees as checked in (individual or bulk)

---

## 10. Bug & Risk Analysis

### Bugs / Issues
| Issue | File | Severity |
|-------|------|----------|
| `SeatLock` cleanup runs every booking, but race condition window exists between lock check and booking creation | `booking-actions.ts:187-210` | Medium |
| Contact form submission only shows toast — no data is persisted or sent to admin | `contact/page.tsx:30-33` | High — feature is facade |
| `throw error` in `use-auth.tsx:46` after login failure re-throws to caller but `handleWebsiteLogin` in login/page.tsx doesn't await the throw — uses `.error` check instead | `use-auth.tsx:43-50` | Medium — logic inconsistency |
| `cancellingId === booking.id` uses Skeleton instead of spinner in account page | `account/page.tsx:235-236` | Low — visual only |
| Google sign-in `redirect: false` may not work as expected in all environments (popup blockers) | `use-auth.tsx:83` | Medium |
| Middleware uses both `.env` and `.env.local` — if variables are duplicated, behavior may be unpredictable | `middleware.ts:60-61` | Low |
| No input sanitization on member Excel import (XSS risk in stored names) | `member-import-actions.ts:70-79` | Medium — data is displayed on admin panels |
| `getBookingsChartData` may return empty data if no bookings exist — chart shows empty state correctly | `chart-actions.ts` | Low |
| Fee config has only one active row — no versioning or history | `schema.prisma:158-165` | Low |
| `membersOnly` block in `RIC_AUDITORIUM` is commented out in seat-layouts.ts:90 | `seat-layouts.ts:90` | High — MEM block is disabled |
| `password` field in Member schema is optional — members without passwords can't log in | `schema.prisma:123` | Medium |
| No CSRF protection on member API routes | `api/auth/member-login/route.ts` | Medium |
| `canvaslyExportButton` uses `html2canvas` which may not render all CSS properly on all browsers | `CanvaslyExportButton.tsx` | Low |

### Dead Code / Unused
| Item | File | Reason |
|------|------|--------|
| `SeatAccessTier` model and actions are fully implemented but the access tier enforcement in `SeatingChart` component is inactive | Schema, actions, component | Tiers are stored but seating chart doesn't filter by tier |
| `Hall` model and `hall-actions.ts` — no admin UI uses hall management | Multiple files | CRUD exists but no pages consume it |
| `use-booking-flow.tsx` — imported and available but `SeatsPage` manages its own state inline instead | `hooks/use-booking-flow.tsx` | Context is defined but not used by the actual booking flow |
| `pet-hub/seat-selection-layout.tsx` — legacy/alternative seat layout | `components/pet-hub/` | Not imported by any page |
| `firestore.rules` — Firestore rules file present but project uses PostgreSQL exclusively | Root | Misconfiguration artifact |
| `genkit.ts` / `ai/dev.ts` — Genkit configured but no application code invokes it | `src/ai/` | AI setup with no callers |
| `placeholder-images.ts` / `placeholder-images.json` — not imported | `lib/` | Maybe used by seed or legacy |
| `members.json` — static data file not used by seed.ts | `lib/` | Seed script has inline data |
| `default-hall-layout.ts` — not imported by any module | `lib/` | Possibly replaced by seat-layouts.ts |

### Security Risks
| Risk | File | Impact |
|------|------|--------|
| No rate limit on member-login API route (only on NextAuth routes) | `middleware.ts:19` — only matches `/api/auth/member-login` path | Brute force on member login is throttled in middleware, but the path is correct. **Actually looks OK.** |
| In-memory rate limiter (no persistence) — resets on server restart | `lib/rate-limit.ts` | Low — only matters for rapid restart scenarios |
| JWT member token has no refresh mechanism — valid for 7 days | `api/auth/member-login/route.ts` | Medium — long-lived token |
| No input validation on `memberId` parameter in member-login API (assumed number) | `api/auth/member-login/route.ts` | Low — Prisma handles type coercion |
| Member passwords stored as optional — no password enforcement | `schema.prisma:123` | Medium |

### Incomplete Features
| Feature | Details |
|---------|---------|
| **Payment Gateway** | Payment methods are listed but no actual payment SDK integration. UPI ID `ric@upi` is shown but payment is "simulated" by just storing an optional transaction ID |
| **Contact Form** | Validated but not persisted to DB or sent via email |
| **User Profile Editing** | Account page is read-only (view bookings only) |
| **Password Reset** | No forgot-password flow for website users |
| **Site Content Editor** | Admin page shows raw JSON editor instead of a visual CMS |
| **Member-Only Seats** | The `MEM` block in the auditorium layout is **commented out** (`seat-layouts.ts:90`), so members can't actually see the Members-exclusive section on the seating chart |

### TODO Comments Found
- `seats/page.tsx:507` — `// Member login moved to /member-login`
- `account/page.tsx:269` — `// Member linking moved to /member-login`
- `site-footer.tsx:37-44` — `title="Coming soon"` on social media icons
- `seat-layouts.ts:90` — Commented out MEM block

---

## 11. Presentation Preparation

### Executive Summary
The RIC Event Website is a production-ready, full-stack web application built with **Next.js 15, TypeScript, Prisma, and PostgreSQL**. It serves as the digital backbone of the Rajasthan International Centre — a premier cultural institution in Jaipur. The platform enables event discovery, ticket booking, member management, QR-based gate check-in, and administrative oversight through an intuitive interface. With 15 database models, 26+ server actions, interactive SVG seating charts, and dual authentication systems (public + member), the platform addresses real-world challenges of venue management, from preventing double-booking to enabling contactless entry.

### Key Features
1. **Interactive Auditorium Seat Selection** — SVG-based visual seating chart with zoom/pan for the RIC Auditorium (600+ seats across 4 price tiers)
2. **Dual Auth System** — NextAuth v5 for public users (Google + credentials) + custom JWT for RIC members
3. **Member Portal** — RIC members get free seat booking, dedicated dashboard, booking history
4. **QR Check-In** — Admin can scan QR codes at event entrance for contactless verification
5. **Admin Dashboard** — Real-time stats, monthly booking chart, comprehensive event/member management
6. **Seat Locking** — Prevents double-booking with 10-minute TTL locks
7. **Fee Engine** — Configurable GST + platform fee calculation
8. **Excel Bulk Import** — Upload member data via XLSX spreadsheet

### Technical Highlights
1. **Server Actions Architecture** — All data mutations are server actions with Zod validation, admin session checks, and automatic page revalidation
2. **Prisma + Neon (Serverless PostgreSQL)** — HTTP-based database adapter for optimal serverless performance
3. **Rate-Limited Middleware** — In-memory rate limiter protects auth and API endpoints
4. **shadcn/ui Component Library** — 35+ accessible UI components built on Radix primitives
5. **Framer Motion + Tailwind** — Beautiful animations (animated counters, scroll-reveal, hero carousel)
6. **Atomic Seat Locking** — Transaction-safe booking with upsert, expiry cleanup, and race-condition handling
7. **Type Safety End-to-End** — Shared TypeScript types, Zod schemas matching Prisma models

### Future Enhancements
1. **Real Payment Gateway** — Integrate Razorpay/PhonePe SDK for actual payment processing
2. **Firebase Cloud Messaging** — Push notifications for booking confirmations and event reminders
3. **Visual Seat Editor** — Drag-and-drop seat map configuration for admin
4. **Multi-language Support** — i18n for Hindi/English
5. **AI Recommendations** — Use Genkit for personalized event suggestions
6. **Offline Check-In** — PWA capabilities for event gate scanning
7. **Self-Service Kiosk Mode** — Touch-screen interface at venue entrance

---

## 12. Viva Questions (30)

### Architecture & Design
1. **Q:** Why did you choose Next.js App Router over Pages Router?  
   **A:** App Router offers server components, layouts, route groups, and built-in streaming — ideal for a project with distinct admin/member/public sections sharing layout logic.

2. **Q:** How does the dual authentication system work?  
   **A:** Public users authenticate via NextAuth v5 (JWT) with Google OAuth and credentials. RIC members use a separate JWT (jose library) stored in a `member-token` cookie, authenticated against the Member table.

3. **Q:** Why is Prisma using Neon adapter instead of standard PostgreSQL?  
   **A:** Neon provides serverless PostgreSQL with HTTP fetch-based connections. The `@prisma/adapter-neon` avoids connection pooling issues in serverless environments.

4. **Q:** How do you prevent double-booking of seats?  
   **A:** A three-layer approach: (1) SeatLock model with 10-min TTL, (2) atomic upsert with unique constraints, (3) booking creation checks existing bookings for seat IDs.

5. **Q:** Explain the folder structure organization.  
   **A:** Route groups: `(site)` for public pages with shared header/footer, `admin/` with sidebar layout, `member/` for member portal. Server actions are in `actions/`, shared components in `components/`.

### Database
6. **Q:** What are the key database models?  
   **A:** User, Event, Booking, Member, FeeConfig, CheckIn, SeatLock, BlockedSeat, SeatAccessTier, SeatReservation, SiteContent, Hall — 15 models total.

7. **Q:** How is the seating chart data stored?  
   **A:** The `RIC_AUDITORIUM` constant in `seat-layouts.ts` defines blocks with position, rotation, rows, columns, and pricing category. Event-specific booking data is in the Booking model.

8. **Q:** How are members linked to website users?  
   **A:** The `Member.userId` field is a unique foreign key to `User.id`. The `linkMemberToUser` server action sets this field after verifying member ID + phone.

### Security
9. **Q:** How are admin routes protected?  
   **A:** Middleware (`middleware.ts`) checks for a valid NextAuth JWT with `role === "ADMIN"` before allowing access to `/admin/*`. Server actions use `requireAdminSession()`.

10. **Q:** What rate limiting is implemented?  
    **A:** In-memory rate limiter: 10 req/min for auth endpoints, 30 req/min for API endpoints, keyed by IP address.

11. **Q:** How are passwords stored?  
    **A:** bcryptjs with 12 salt rounds for both User and Member passwords.

### Features
12. **Q:** How does the seating chart component work?  
    **A:** An SVG-based interactive map defined in `seating-chart.tsx`. Blocks are positioned absolutely, seats are SVG circles. Supports zoom, pan, row/column labels, and color-coded categories.

13. **Q:** How does the member booking flow differ from public booking?  
    **A:** Members book through `/member/events/[id]` which uses `createMemberBooking` (free, no payment step). Public users go through `/events/[id]/seats` with the CheckoutDialog (payment simulation).

14. **Q:** How is the QR check-in implemented?  
    **A:** Booking confirmation page generates a QR with `{ bookingId, eventName, user, seats }`. Admin scans with html5-qrcode in `/admin/checkin`, looks up via `getBookingByQrData`, marks attendees as checked in.

15. **Q:** How does fee calculation work?  
    **A:** `calculateFees` server action reads the active FeeConfig, computes GST percentage and platform fee (percentage or flat), returns subtotal + gst + platformFee + total.

### Technical
16. **Q:** What state management approach did you use?  
    **A:** React Context for events (`EventsProvider`), members (`MembersProvider`), auth (`AuthProvider`), member auth (`MemberAuthProvider`). No Redux or Zustand.

17. **Q:** How are images handled?  
    **A:** Next/Image with remote patterns for placehold.co, unsplash, picsum.photos, and GCP storage. The RIC logo is served from `/public/`.

18. **Q:** What testing strategy is in place?  
    **A:** No automated tests are implemented. The project relies on TypeScript strict mode for type safety.

19. **Q:** How is the booking chart data aggregated?  
    **A:** `getBookingsChartData` server action groups bookings by month (last 12 months), counting paid seats vs free (member) seats per month.

20. **Q:** Explain the seed data flow.  
    **A:** `prisma/seed.ts` creates admin user, sample users, sample members, sample events with showtimes/ticket types/artists, and sample bookings. Also accessible via admin dashboard buttons.

### Business Logic
21. **Q:** What happens when a user cancels a booking?  
    **A:** `cancelBooking` verifies ownership, deletes check-in records, then deletes the booking. Seat becomes available again.

22. **Q:** How do blocked seats work?  
    **A:** Admin can block seats via seats-control page. BlockedSeat model stores eventId-seatId pairs. `getBookedSeats` includes blocked seats in the unavailable list.

23. **Q:** What is the purpose of SeatAccessTier?  
    **A:** Per-seat access overrides allowing admin to mark seats as VIP_ONLY, MEMBERS_ONLY, or GENERAL. Currently the seating chart doesn't enforce these tiers.

24. **Q:** How are event ticket types defined?  
    **A:** As a JSON array on the Event model: `[{ type: "Standard", price: 299 }, { type: "VIP", price: 999 }]`.

### Problems & Limitations
25. **Q:** What are the major limitations of the current system?  
    **A:** No real payment gateway, no automated tests, member-only seat block is commented out, contact form doesn't persist data, no password reset flow.

26. **Q:** Why is the MEM (Members) block commented out in the seating layout?  
    **A:** It was disabled probably because member-specific seat enforcement wasn't fully tested, or to simplify the initial deployment while member features are being refined.

27. **Q:** What would you add next if given more time?  
    **A:** Real payment integration (Razorpay), automated test suite, visual CMS for homepage, member-exclusive seat section UI, and push notifications.

28. **Q:** How would you handle 10,000 concurrent users booking tickets?  
    **A:** The SeatLock system would need to be moved from in-memory to Redis. The rate limiter should use a distributed store. Database connection pooling via PgBouncer would be needed.

29. **Q:** Is the application mobile-responsive?  
    **A:** Yes. Uses Tailwind responsive classes, mobile sidebar navigation, and the seating chart adapts to screen size with zoom controls.

30. **Q:** How is the application deployed?  
    **A:** Firebase App Hosting (apphosting.yaml configured). Environment variables include DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, SMTP_* settings.

---

## 13. Demo Flow (5-Minute Script)

### Minute 1: Homepage & Events
- **Show:** Homepage hero animation, stats counters, event slider
- **Say:** "RIC is Jaipur's premier cultural venue. Our homepage showcases upcoming events with this animated carousel. Stats animate as you scroll."
- **Click:** "View All" → Events page
- **Show:** Category filters, search, grid/list toggle
- **Click:** An event card → Event detail page

### Minute 2: Event Detail & Seat Selection
- **Show:** Event detail (gallery, artists, venue map, ticket selection)
- **Say:** "Each event has a rich detail page with gallery, artist profiles, and ticket selection."
- **Click:** "Book Now" → Seats page
- **Show:** Showtime selection → Interactive seating chart
- **Say:** "Here's our visual seat selector. This is the actual RIC Auditorium layout. Green seats are available, gray are taken. You can zoom and pan."

### Minute 3: Booking & Checkout
- **Show:** Select 2 seats → Click Continue → Booking Summary
- **Say:** "After selecting seats, you review your booking and proceed to checkout."
- **Click:** "Proceed to Pay"
- **Show:** Checkout dialog — attendee names, member verification, payment method selection
- **Say:** "At checkout, you fill attendee details, verify if you're a RIC member for free seats, and choose payment. We support PhonePe, GPay, Paytm, card, and cash."

### Minute 4: Admin Dashboard
- **Switch to:** `/admin`
- **Show:** Dashboard stats, booking chart, upcoming events, quick actions
- **Say:** "The admin dashboard gives real-time insights — revenue, user count, member activity. The chart shows monthly paid vs free seat bookings."
- **Click:** "Manage Events" → Show events table with search/filter
- **Say:** "Full CRUD for events with pagination, search, and category filtering."

### Minute 5: Member Portal & Check-In
- **Switch to:** `/member/dashboard` (show member logged in)
- **Show:** Member stats, profile, booking history
- **Say:** "RIC members have a dedicated portal. They can book free seats, view their history, and access member benefits."
- **Switch to:** `/admin/checkin`
- **Show:** QR scanner interface
- **Say:** "At the venue, staff scans the QR code from the booking confirmation email. Attendees are instantly marked as checked in."
- **Close:** "That concludes our RIC Event Platform demo. Questions?"

---

## 14. Final Assessment

### Completed Features (Production Ready)
- ✅ Public website (homepage, events, about, contact)
- ✅ Event CRUD (admin create/read/update/delete)
- ✅ Member CRUD with Excel bulk import
- ✅ Interactive seating chart (SVG, zoom, pan, category colors)
- ✅ Multi-step booking flow with seat selection
- ✅ NextAuth v5 authentication (JWT, credentials, Google OAuth)
- ✅ Member authentication (custom JWT cookie)
- ✅ Admin dashboard with stats and chart
- ✅ QR code generation and scanner-based check-in
- ✅ Booking cancellation
- ✅ GST + platform fee engine
- ✅ Rate limiting middleware
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Invoice export (Canvasly)
- ✅ Member seat reservations system
- ✅ Admin seat control (block seats, set tiers)
- ✅ Database seeding (admin, members, events, bookings)

### Partially Completed Features (Need Work)
- ⚠️ **Payment Processing** — Payment UI exists but no actual payment gateway SDK integration; transactions are simulated
- ⚠️ **Email Notifications** — Nodemailer is configured and code exists but SMTP env vars may not be active in production
- ⚠️ **Member-Only Seat Blocks** — The `MEM` block in the seating layout is commented out, so the member-exclusive section is not visible
- ⚠️ **Site Content Editor** — Admin page shows raw JSON; no visual CMS
- ⚠️ **User Management** — Users can be viewed but not created, edited, or deleted from admin
- ⚠️ **Contact Form** — UI and validation work but submissions are not persisted

### Missing Features (Not Implemented)
- ❌ Automated test suite (unit, integration, e2e)
- ❌ Real payment gateway integration (Razorpay/PhonePe SDK)
- ❌ Password reset / forgot password flow
- ❌ User profile editing (name, email, password change)
- ❌ Push notifications (Web/Email)
- ❌ Multi-language support (i18n)
- ❌ Visual seat map configuration tool
- ❌ Event search with full-text or date range
- ❌ Social sharing beyond basic URL copy
- ❌ Offline PWA support
- ❌ Audit logging for admin actions
- ❌ SeatAccessTier enforcement in the seating chart component

### Recommended Improvements (Priority Order)

| Priority | Improvement | Effort | Impact |
|----------|------------|--------|--------|
| P0 | Enable MEM block in seat layout for member-exclusive section | 1 day | High — core feature blocked |
| P0 | Add automated tests (at least e2e for booking flow) | 1 week | Critical for reliability |
| P1 | Integrate Razorpay/PhonePe for real payments | 1 week | High — enables real revenue |
| P1 | Implement password reset flow | 2 days | High — user experience |
| P2 | Replace JSON site content editor with visual UI | 3 days | Medium |
| P2 | Add Zod validation to member-login API | 0.5 day | Medium |
| P3 | Enforce SeatAccessTier in seating chart component | 1 day | Medium |
| P3 | Persist contact form submissions to database | 1 day | Medium |
| P3 | Add user profile editing (name, email, password) | 2 days | Medium |
| P3 | Implement audit logging for critical admin actions | 2 days | Low |
| P4 | Move rate limiter to Redis for production scalability | 2 days | Low |
| P4 | Add i18n support (Hindi + English) | 1 week | Low — nice to have |
| P4 | Implement Genkit AI recommendations on event pages | 1 week | Low — experimental |
