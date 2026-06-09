# RIC Event Management System — Project Documentation

**Rajasthan International Centre, Jaipur**

---

## 1. Executive Summary

The **RIC Event Management System** is a full-stack web application designed for the Rajasthan International Centre in Jaipur. It provides end-to-end event management including event creation, interactive seat selection, multi-step booking with payments, member management, and QR-code-based check-in — all through an intuitive admin dashboard.

**Key Highlights:**
- Interactive SVG-based seating chart matching the real RIC auditorium layout
- Multi-step booking flow (Showtime → Seats → Summary → Payment → Confirmation)
- Dual authentication: Website users (NextAuth) + RIC Members (JWT)
- Admin panel with events, members, halls, transactions, and check-in management
- Member-exclusive seating with seat reservation system
- Real-time seat locking to prevent double-booking race conditions

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15.3.8 (App Router + Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Prisma 7.8 with driverAdapters |
| **Auth** | NextAuth v5 (beta) — Credentials + Google OAuth |
| **UI** | shadcn/ui (Radix primitives), Tailwind CSS |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |
| **Email** | Nodemailer (SMTP) |
| **QR Codes** | react-qr-code + html5-qrcode scanner |
| **PDF** | jsPDF for invoice generation |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 18 + Next.js App Router                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │  Events   │ │ Seating  │ │ Checkout │ │  Admin Dashboard │    │
│  │  Browser  │ │  Chart   │ │  Dialog  │ │  (CRUD + Stats)  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Server Actions + API Routes
┌──────────────────────────┴───────────────────────────────────────┐
│                        SERVER (Next.js)                           │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────────┐    │
│  │ Server Actions│ │  API Routes  │ │      Middleware        │    │
│  │ (booking,    │ │  (auth,      │ │  (admin protection,    │    │
│  │  events,     │ │   member,    │ │   rate limiting)       │    │
│  │  members)    │ │   email)     │ │                       │    │
│  └──────────────┘ └──────────────┘ └───────────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐    │
│  │ Events │ │Booking │ │Members │ │  Halls │ │ SeatLock   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │ BlockedSeat  │ │SeatReservation│ │ CheckIn / FeeConfig    │  │
│  └──────────────┘ └──────────────┘ └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Website accounts | id, email, password (bcrypt), role (USER/ADMIN) |
| **Member** | RIC Members (imported from Excel) | memberId, name, phone, email, categoryType, userId (linked account) |
| **Event** | Events/performances | name, date, venue, ticketTypes (JSON), seatingChart (JSON), showtimes |
| **Booking** | Confirmed bookings | userId, eventId, attendees (JSON array), total, paymentInfo |
| **Hall** | Venue configurations | name, sections (JSON layout), totalSeats |
| **BlockedSeat** | Admin-blocked seats per event | eventId, seatId, reason |
| **SeatLock** | Temporary locks (10 min TTL) | eventId, seatId, userId, expiresAt |
| **SeatReservation** | Member seat reservations | eventId, seatId, memberId, status (RESERVED/CONFIRMED/CANCELLED), expiresAt |
| **CheckIn** | QR scan check-ins | bookingId, eventId, seatId, attendeeName, checkedInAt |
| **FeeConfig** | GST + platform fee settings | gstPercentage, platformFeeType, platformFeeValue |
| **SiteContent** | CMS for homepage sections | section, title, subtitle, content (JSON) |

---

## 5. Features & User Flows

### 5.1 Public User Flow

```
Homepage → Browse Events → Select Event → Choose Showtime → Select Seats →
Booking Summary → Checkout Dialog → Payment → Confirmation → QR Code Ticket
```

**Step-by-step:**

1. **Homepage** — Carousel of featured events, stats, venue info
2. **Events List** — Filter by category (Music, Sports, Theater, etc.), search
3. **Event Detail** — Event info, ticket categories, pricing, artist lineup
4. **Seat Selection** — Interactive SVG chart with:
   - Color-coded zones (VIP/Pink, Premium/Cyan, Standard/Green, Balcony/Purple, Members/Amber)
   - Zoom/pan controls (Ctrl+scroll, drag)
   - Real-time availability (booked = gray, reserved = amber, available = white)
   - Member-only sections (hidden for non-members)
5. **Checkout** — UPI (PhonePe/GPay/Paytm), Card, Cash payment options
   - GST + platform fee calculation
   - Attendee details form per seat
6. **Confirmation** — Booking ID, QR code, email confirmation with invoice PDF

### 5.2 Member Flow

```
Member Login → Link Account → Access Members Section → Reserve Seats → Book
```

1. **Member Login** — Separate JWT-based auth at /member-login
2. **Account Linking** — Link website account to RIC membership (phone verification)
3. **Members Section** — Front rows (MEM block) visible only to verified members
4. **Seat Reservations** — Members can pre-reserve seats for themselves + guests

### 5.3 Admin Flow

```
Admin Login → Dashboard → Manage Events / Members / Halls / Transactions / Check-In
```

**Admin Panel Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | /admin | Stats overview (revenue, bookings, users) |
| Events | /admin/events | CRUD, search, pagination |
| Create Event | /admin/events/create | Form with hall selection, ticket types |
| Edit Event | /admin/events/edit/[id] | Edit event details |
| Event Bookings | /admin/events/[id]/bookings | View all bookings for an event |
| Seat Control | /admin/events/[id]/seats-control | Block/unblock seats, admin bookings |
| Members | /admin/members | CRUD, bulk import from Excel |
| Member Import | /admin/members/import | Upload Excel (.xlsx) to batch-add members |
| Hall Manager | /admin/halls | Create halls, visual seat layout designer |
| Hall Designer | /admin/halls/[id]/design | SVG-based seat layout editor with sections |
| Transactions | /admin/transactions | Payment history with filters |
| Reservations | /admin/reservations | View/confirm/cancel member seat reservations |
| Check-In | /admin/checkin | QR code scanner + manual booking lookup |
| Fees & Taxes | /admin/fees | Configure GST % and platform fees |
| Users | /admin/users | View registered website users |
| Home Page | /admin/site-content | Edit homepage sections (hero, stats, CTA) |

---

## 6. RIC Auditorium Seating Layout

The seating chart mirrors the real RIC auditorium with 10 distinct blocks:

```
                    ┌─────────────────┐
                    │    BALCONY      │  ← N-R rows (arc layout)
                    │   (BLW + BC     │
                    │    + BRW)       │
                    ├─────────────────┤
                    │  MIDDLE TIER    │  ← F-M rows
                    │  (ML + MC + MR) │
                    ├─────────────────┤
                    │  FRONT TIER     │  ← A-E rows
                    │ (FLW + FC + FRW)│
                    ├─────────────────┤
                    │  ★ MEMBERS ★    │  ← 3 rows (free for members)
                    │   (MEM block)   │
                    └─────────────────┘
                         STAGE
```

| Block | Zone | Rows | Notes |
|-------|------|------|-------|
| MEM | Members | 3 rows | Members-only, free entry |
| FLW | Standard | 5 rows | Front-left wing, angled -16° |
| FC | Standard | 5 rows | Front center |
| FRW | VIP | 5 rows | Front-right wing, angled +16° |
| ML | Standard | 8 rows | Middle-left, angled -13° |
| MC | Standard | 8 rows | Middle center |
| MR | Standard | 8 rows | Middle-right, angled +13° |
| BLW | Balcony | 5 rows | Balcony left wing, angled -13° |
| BC | Standard | 5 rows | Balcony center |
| BRW | Balcony | 5 rows | Balcony right wing, angled +13° |

**Total Seats:** ~500+ across all blocks

---

## 7. Security Features

### Authentication
- **Website Users:** NextAuth v5 with Credentials + Google OAuth providers
- **Members:** Separate JWT-based auth (jose library) with httpOnly cookies
- **Admin:** Role-based access control (USER vs ADMIN role in JWT token)

### Authorization
- Middleware protects `/admin/*` routes (checks JWT + ADMIN role)
- All admin server actions call `requireAdminSession()` (verifies JWT from cookies)
- Booking cancellation verifies ownership (userId match)
- Member seats verify membership status before allowing selection

### Data Protection
- Passwords hashed with bcrypt (12 rounds)
- Prisma ORM prevents SQL injection
- Zod validation on all input schemas
- Rate limiting on auth endpoints (10 req/min) and API routes (30 req/min)
- Seat lock TTL (10 minutes) prevents abandoned locks
- Reservation TTL auto-cleanup for expired reservations

### Race Condition Prevention
- `SeatLock` model with unique constraint on [eventId, seatId]
- Atomic lock-check-book flow in `createBooking`
- `SeatReservation` model with unique constraint for member reservations
- P2002 error handling for concurrent seat claims

---

## 8. Key Server Actions

| Action | File | Purpose |
|--------|------|---------|
| `getEvents` | event-actions.ts | Fetch all events |
| `addEvent` / `updateEvent` / `deleteEvent` | event-actions.ts | Event CRUD (admin-only) |
| `getMembers` / `addMember` / `updateMember` | member-actions.ts | Member CRUD (admin-only) |
| `importMembersFromExcel` | member-import-actions.ts | Bulk member import |
| `createBooking` | booking-actions.ts | Create booking with seat locking |
| `getBookedSeats` | booking-actions.ts | Get booked + reserved seats for an event |
| `cancelBooking` | cancel-actions.ts | Cancel with ownership verification |
| `createReservation` | reservation-actions.ts | Member seat reservation |
| `getAllReservations` | reservation-actions.ts | Admin view of all reservations |
| `getBookingByQrData` / `checkInAttendee` | checkin-actions.ts | QR code check-in |
| `sendBookingConfirmation` | email-actions.ts | Email with QR code + invoice |
| `calculateFees` | fee-actions.ts | GST + platform fee calculation |
| `upsertSiteContent` | site-content-actions.ts | CMS content management |

---

## 9. Project Structure

```
src/
├── app/
│   ├── (site)/              # Public-facing pages
│   │   ├── page.tsx         # Homepage
│   │   ├── events/          # Event listing + detail + seats
│   │   ├── login/           # User login
│   │   ├── signup/          # User registration
│   │   ├── member-login/    # Member login
│   │   ├── account/         # User account + booking history
│   │   ├── about/           # About page
│   │   └── contact/         # Contact page
│   ├── admin/               # Admin panel (protected)
│   │   ├── events/          # Event management
│   │   ├── members/         # Member management
│   │   ├── halls/           # Hall/venue management
│   │   ├── transactions/    # Payment tracking
│   │   ├── reservations/    # Seat reservation management
│   │   ├── checkin/         # QR check-in
│   │   ├── fees/            # Fee configuration
│   │   ├── users/           # User management
│   │   └── site-content/    # CMS editor
│   ├── member/dashboard/    # Member dashboard
│   ├── confirmation/        # Booking confirmation
│   ├── actions/             # Server actions (14 files)
│   └── api/                 # API routes (auth, templates)
├── components/
│   ├── events/              # SeatingChart, EventCard, TicketSelection
│   ├── checkout/            # CheckoutDialog (payment flow)
│   ├── layout/              # SiteHeader, SiteFooter
│   └── ui/                  # shadcn/ui components (30+)
├── hooks/                   # useAuth, useMemberAuth, useBookingFlow
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth-helpers.ts      # JWT verification helpers
│   ├── server-auth.ts       # Admin session verification + rate limiting
│   ├── seat-layouts.ts      # RIC auditorium layout config
│   ├── halls.ts             # Hall template definitions
│   └── types.ts             # TypeScript interfaces
└── prisma/
    └── schema.prisma        # Database schema (13 models)
```

---

## 10. What We Built & Fixed (Session Summary)

### Bug Fixes
- Fixed login authentication error (Google provider empty credentials causing Configuration error)
- Fixed `/dashboard` 404 error (MembersProvider moved from root to admin layout)
- Fixed build error (`getServerSession` doesn't exist in next-auth v5 → replaced with cookies + jwtVerify)
- Fixed `checkInAllAttendees` unreachable catch block
- Fixed `$` → `₹` currency symbol on account page
- Fixed hardcoded JWT fallback secrets across 3 API routes
- Set `ignoreBuildErrors: false` for TypeScript and ESLint

### Security Improvements
- Created shared `auth-helpers.ts` module (eliminated 3x duplicate getSecret)
- Added `requireAdminSession()` to all admin server actions (16 actions)
- Added rate limiting middleware (auth: 10/min, API: 30/min)
- Added booking ownership verification (cancel requires userId match)
- Increased password minimum from 4 to 8 characters
- Secure cookie flag in production environment

### New Features
- **Seat Locking:** `SeatLock` model with 10-min TTL prevents double-booking race conditions
- **Member Reservations:** `SeatReservation` model with create/cancel/confirm actions, admin management page
- **Admin Reservations Page:** /admin/reservations with search, filters, pagination, confirm/cancel actions
- **Zod Validation:** Added to createBooking, addEvent, addMember
- **Error Boundaries:** Wrap EventsProvider and MembersProvider to prevent app-wide crashes

---

## 11. Deployment

**Environment Variables Required:**
```
DATABASE_URL=postgresql://...        # Neon PostgreSQL connection string
NEXTAUTH_SECRET=...                 # NextAuth JWT secret (50+ chars)
GOOGLE_CLIENT_ID=...               # (Optional) Google OAuth
GOOGLE_CLIENT_SECRET=...           # (Optional) Google OAuth
SMTP_HOST=...                      # Email server for booking confirmations
SMTP_USER=...
SMTP_PASS=
```

**Commands:**
```bash
npm install                         # Install dependencies
npx prisma generate                 # Generate Prisma client
npx prisma db push                  # Sync schema to database
npm run dev                         # Start dev server (port 9002)
npm run build                       # Production build
```

---

*Documentation prepared for project presentation — Rajasthan International Centre, Jaipur*
