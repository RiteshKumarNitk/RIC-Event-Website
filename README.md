# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

admin@ric.com / admin123 with ADMIN role
After clicking, log in at /login with those credentials

User Signup & Booking (already existed, works)
Anyone can sign up at /signup with name + email + password
Browse events, select seats, checkout, get a QR code on 

ric@gmail.com
admin123




🏛️ RIC Event Management System — Full Codebase Audit Report
────────────────────────────────────────────────────────────────────────────────
1. FUNCTIONAL ANALYSIS
Architecture Overview
- Framework: Next.js 15.3.8 (App Router + Turbopack)
- Database: PostgreSQL via Neon serverless, Prisma ORM 7.8 with driverAdapters
- Auth: NextAuth v5 (beta) with Google OAuth + Credentials providers; separate JWT-based member auth via  jose 
- UI: shadcn/ui (Radix primitives), Tailwind CSS, Lucide icons, Recharts
- AI: Google Genkit (AI features, not yet integrated into core flow)
Key Modules
┌─────────────┬───────────────────────────────────────────────────────────────────────────────────┐
│ Module      │ Description                                                                       │
├─────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ Events      │ CRUD, search, filter by category, countdown timers                                │
│ Seating     │ SVG-based auditorium layout (RIC Auditorium), zoom/pan, seat selection            │
│ Booking     │ Multi-step flow: Showtime → Seats → Summary → Checkout → Confirmation             │
│ Checkout    │ UPI (PhonePe/GPay/Paytm), Card, Cash; GST + platform fee calculation; QR code     │
│             │ generation                                                                        │
│ Member      │ Separate Member login (JWT), seat locking for members-only sections,              │
│ System      │ member-website account linking                                                    │
│ Admin Panel │ Dashboard, events CRUD, members CRUD, hall designer, transactions, QR check-in,   │
│             │ fees config, site content                                                         │
│ Check-In    │ QR code scanner (html5-qrcode), manual booking lookup, per-attendee and bulk      │
│             │ check-in                                                                          │
│ Email       │ Nodemailer SMTP for booking confirmations with QR code                            │
└─────────────┴───────────────────────────────────────────────────────────────────────────────────┘
Data Flow
1. EventsProvider fetches all events on mount via server action  getEvents() 
2. MembersProvider fetches all members similarly
3. User browses → selects event → picks showtime → selects seats → checkout dialog → payment → booking created → confirmation email
────────────────────────────────────────────────────────────────────────────────
2. BUG DETECTION
CRITICAL Bugs
┌─────┬─────┬────────┬───────────────────────────────┬────────────────┬────────────┬───────────────┐
│ #   │ Sev │ Module │ Description                   │ Steps to       │ Root Cause │ Fix           │
│     │ eri │        │                               │ Reproduce      │            │               │
│     │ ty  │        │                               │                │            │               │
├─────┼─────┼────────┼───────────────────────────────┼────────────────┼────────────┼───────────────┤
│ 1   │ Cri │ Auth ( │ Hardcoded fallback JWT        │ Deploy without │ Missing    │ Throw on      │
│     │ tic │ member │ secret: "fallback-secret-key- │ NEXTAUTH_SECRE │ env        │ missing       │
│     │ al  │ -login │ for-dev". If NEXTAUTH_SECRET  │ T env var →    │ validation │ secret;       │
│     │     │ )      │ is unset, all member JWTs use │ forge JWT      │ at startup │ remove        │
│     │     │        │ this known key, allowing      │                │            │ fallback      │
│     │     │        │ token forgery.                │                │            │               │
│ 2   │ Cri │ Auth ( │ Same hardcoded fallback in    │ Same as above  │ Duplicate  │ Centralize    │
│     │ tic │ member │ two API routes                │                │ code with  │ secret with   │
│     │ al  │ -login │                               │                │ same flaw  │ validation    │
│     │     │ , memb │                               │                │            │               │
│     │     │ er-me) │                               │                │            │               │
│ 3   │ Cri │ cancel │ No authorization check. Any   │ User A creates │ Server     │ Fetch         │
│     │ tic │ -actio │ logged-in user can cancel any │ booking → User │ action     │ booking,      │
│     │ al  │ ns.ts  │ other user's booking by       │ B calls cancel │ accepts    │ verify bookin │
│     │     │        │ passing an arbitrary          │ Booking(bookin │ bookingId  │ g.userId ===  │
│     │     │        │ bookingId.                    │ gA.id) →       │ without    │ currentUser.i │
│     │     │        │                               │ booking        │ verifying  │ d before      │
│     │     │        │                               │ deleted        │ userId     │ deletion      │
│ 4   │ Cri │ bookin │ No authorization check. Any   │ Call getUserBo │ No session │ Use session   │
│     │ tic │ g-acti │ user can fetch another user's │ okings(otherUs │ -based     │ JWT to get    │
│     │ al  │ ons.ts │ bookings by passing a         │ erId)          │ guard      │ userId        │
│     │     │ (getUs │ different userId.             │                │            │ server-side   │
│     │     │ erBook │                               │                │            │ instead of    │
│     │     │ ings)  │                               │                │            │ accepting it  │
│     │     │        │                               │                │            │ as parameter  │
│ 5   │ Cri │ member │ No admin check. Any           │ Any user calls │ Server     │ Add admin     │
│     │ tic │ -actio │ authenticated user (via       │ deleteMember(i │ actions    │ role check in │
│     │ al  │ ns.ts  │ server action) can delete     │ d) from        │ lack serve │ every admin   │
│     │     │ (delet │ members. Server actions run   │ browser        │ r-side     │ server action │
│     │     │ eMembe │ in the client context; no     │ console        │ auth       │               │
│     │     │ r)     │ middleware protects them.     │                │ guards     │               │
│ 6   │ Cri │ event- │ Deletes ALL bookings and      │ Any            │ No authori │ Add admin     │
│     │ tic │ action │ events. No admin guard.       │ authenticated  │ zation     │ role          │
│     │ al  │ s.ts ( │                               │ user calls del │            │ verification  │
│     │     │ delete │                               │ eteAllEvents() │            │               │
│     │     │ AllEve │                               │                │            │               │
│     │     │ nts)   │                               │                │            │               │
│ 7   │ Cri │ next.c │ ignoreBuildErrors: true for   │ Build with     │ Config     │ Set both to   │
│     │ tic │ onfig. │ both TypeScript and ESLint.   │ intentional    │ bypasses   │ false         │
│     │ al  │ ts     │ This silently masks all type  │ type error →   │ quality    │               │
│     │     │        │ errors and lint violations,   │ succeeds       │ gates      │               │
│     │     │        │ meaning bugs compile to       │                │            │               │
│     │     │        │ production.                   │                │            │               │
│ 8   │ Cri │ Checko │ No server-side seat locking.  │ User A selects │ Race       │ Implement     │
│     │ tic │ ut     │ Between seat selection and    │ seats → User B │ condition; │ temporary     │
│     │ al  │        │ booking creation, another     │ selects same   │ no seat re │ seat hold     │
│     │     │        │ user can book the same seat.  │ seats → both   │ servation/ │ with TTL, or  │
│     │     │        │ No optimistic locking or      │ confirm →      │ lock       │ use database- │
│     │     │        │ atomic seat reservation       │ double booking │ mechanism  │ level atomic  │
│     │     │        │ exists.                       │                │            │ check         │
└─────┴─────┴────────┴───────────────────────────────┴────────────────┴────────────┴───────────────┘
HIGH Bugs
┌─────┬─────┬──────────┬─────────────────────────────────────────────────────────────┬───────────────┐
│ #   │ Sev │ Module   │ Description                                                 │ Fix           │
│     │ eri │          │                                                             │               │
│     │ ty  │          │                                                             │               │
├─────┼─────┼──────────┼─────────────────────────────────────────────────────────────┼───────────────┤
│ 9   │ Hig │ admin-ac │ Hardcoded default admin credentials (admin@ric.com /        │ Remove        │
│     │ h   │ tions.ts │ admin123) exposed in source code                            │ hardcoded     │
│     │     │          │                                                             │ creds;        │
│     │     │          │                                                             │ generate      │
│     │     │          │                                                             │ random        │
│     │     │          │                                                             │ password      │
│ 10  │ Hig │ member-r │ Minimum password length is only 4 characters                │ Enforce       │
│     │ h   │ eset-pas │ (newPassword.length < 4)                                    │ minimum 8     │
│     │     │ sword    │                                                             │ characters    │
│ 11  │ Hig │ Member   │ secure: false on member-token cookie — allows transmission  │ Set secure:   │
│     │ h   │ cookie   │ over HTTP                                                   │ true in       │
│     │     │          │                                                             │ production    │
│ 12  │ Hig │ email-ac │ Email HTML contains unescaped user input (name, eventName,  │ Sanitize/esca │
│     │ h   │ tions.ts │ venue) — potential HTML injection in emails                 │ pe all        │
│     │     │          │                                                             │ dynamic       │
│     │     │          │                                                             │ values        │
│ 13  │ Hig │ checkin- │ Uses Promise.allSettled but returns success even if all     │ Check results │
│     │ h   │ actions. │ operations fail. Also never actually throws in the outer    │ for all       │
│     │     │ ts (chec │ try/catch — the catch block is unreachable dead code.       │ failures and  │
│     │     │ kInAllAt │                                                             │ return error  │
│     │     │ tendees) │                                                             │               │
│ 14  │ Hig │ EventsPr │ useEvents is called in root layout but wraps the entire     │ Add error     │
│     │ h   │ ovider   │ app. If it throws (e.g., DB down), the entire app crashes.  │ boundary      │
│ 15  │ Hig │ checkout │ Card payment fields (payment.cardNumber, etc.) are rendered │ Remove card   │
│     │ h   │ -dialog. │ but never validated or stored. The card details are         │ option unless │
│     │     │ tsx      │ submitted to a client-side form but the server only saves { │ real payment  │
│     │     │          │ method: "card", status: "completed" } — no actual payment   │ processing is │
│     │     │          │ processing. Users may believe their card was charged.       │ implemented   │
│ 16  │ Hig │ transact │ Uses Prisma JSON path filtering (paymentInfo = { path:      │ Test and      │
│     │ h   │ ion-acti │ ["method"], equals: ... }) which may not work reliably      │ verify JSON   │
│     │     │ ons.ts   │ across all Prisma adapters                                  │ filtering     │
│     │     │          │                                                             │ works with    │
│     │     │          │                                                             │ Neon adapter  │
└─────┴─────┴──────────┴─────────────────────────────────────────────────────────────┴───────────────┘
MEDIUM Bugs
┌─────┬─────┬───────────┬──────────────────────────────────────────────────────────┬───────────────┐
│ #   │ Sev │ Module    │ Description                                              │ Fix           │
│     │ eri │           │                                                          │               │
│     │ ty  │           │                                                          │               │
├─────┼─────┼───────────┼──────────────────────────────────────────────────────────┼───────────────┤
│ 17  │ Med │ Homepage  │ Carousel section renders while loading is true, which    │ Only show     │
│     │ ium │           │ means it shows empty data (events is [] at that point)   │ carousel when │
│     │     │           │                                                          │ data is       │
│     │     │           │                                                          │ available     │
│ 18  │ Med │ account/p │ Price displays as $ instead of ₹: <Clock className="h-3  │ Change to ₹{b │
│     │ ium │ age.tsx   │ w-3" />${booking.total}                                  │ ooking.total} │
│ 19  │ Med │ event-act │ Uses conditional spread ...(data.name && { name:         │ Use explicit  │
│     │ ium │ ions.ts ( │ data.name }) — you cannot set a field to empty string or │ undefined     │
│     │     │ updateEve │ falsy value (name would be ignored)                      │ checks        │
│     │     │ nt)       │                                                          │ instead       │
│ 20  │ Med │ hall-acti │ Deleting a hall doesn't check if events are assigned to  │ Add FK check  │
│     │ ium │ ons.ts (d │ it → orphaned events                                     │ or cascade    │
│     │     │ eleteHall │                                                          │ logic         │
│     │     │ )         │                                                          │               │
│ 21  │ Med │ Seating   │ bookedSeats are fetched once on mount but never          │ Add polling   │
│     │ ium │ page      │ refreshed if another user books while viewing            │ or WebSocket  │
│     │     │           │                                                          │ refresh       │
│ 22  │ Med │ getChecke │ Fetches ALL bookings for an event just to count          │ Optimize with │
│     │ ium │ dInCount  │ attendees — O(n) where a single query could suffice      │ a SQL         │
│     │     │           │                                                          │ aggregate     │
│     │     │           │                                                          │ query         │
│ 23  │ Med │ Admin     │ EventsProvider and MembersProvider are nested twice —    │ Remove        │
│     │ ium │ layout    │ once in root layout, once in admin layout. The admin     │ duplicate     │
│     │     │           │ layout creates a second independent instance, doubling   │ providers     │
│     │     │           │ API calls                                                │               │
│ 24  │ Med │ member-lo │ Returns full member details (name, phone, email,         │ Return only   │
│     │ ium │ gin API   │ category) in the login response — unnecessary data       │ minimal info  │
│     │     │           │ exposure                                                 │               │
│ 25  │ Med │ Google    │ Uses process.env.NEXT_PUBLIC_GMAPS_KEY which may be      │ Handle        │
│     │ ium │ Maps      │ empty string → broken map iframe                         │ missing API   │
│     │     │ embed     │                                                          │ key           │
│     │     │           │                                                          │ gracefully    │
└─────┴─────┴───────────┴──────────────────────────────────────────────────────────┴───────────────┘
LOW Bugs
┌─────┬─────┬────────┬─────────────────────────────────────────────────────────────┬──────────────┐
│ #   │ Sev │ Module │ Description                                                 │ Fix          │
│     │ eri │        │                                                             │              │
│     │ ty  │        │                                                             │              │
├─────┼─────┼────────┼─────────────────────────────────────────────────────────────┼──────────────┤
│ 26  │ Low │ data.t │ Deprecated file with export const events: Event[] = [] —    │ Remove       │
│     │     │ s      │ dead code                                                   │              │
│ 27  │ Low │ About  │ Phone number displays as placeholder +91 141 XXXXXXX        │ Use real     │
│     │     │ page   │                                                             │ data         │
│ 28  │ Low │ Footer │ Social links (Facebook, Twitter, Instagram) all point to    │ Link to real │
│     │     │        │ href="#"                                                    │ pages or     │
│     │     │        │                                                             │ remove       │
│ 29  │ Low │ signup │ Logs DATABASE_URL presence to console in production         │ Remove debug │
│     │     │ route  │ (console.log('[SIGNUP_ROUTE] DATABASE_URL present:')        │ logging      │
│ 30  │ Low │ about/ │ Static server component imports Button and Card from        │ Ensure it    │
│     │     │ page.t │ client-only UI library without 'use client' — works but     │ compiles     │
│     │     │ sx     │ unnecessarily large bundle                                  │ correctly    │
└─────┴─────┴────────┴─────────────────────────────────────────────────────────────┴──────────────┘
────────────────────────────────────────────────────────────────────────────────
3. UI/UX REVIEW
Strengths ✅
- Well-structured component hierarchy with shadcn/ui primitives
- Good use of loading skeletons throughout
- Dark mode support via next-themes
- Responsive grid layouts with Tailwind breakpoints
- Nice micro-interactions (hover states, transitions on event cards)
Issues & Improvements
┌─────┬─────┬─────────┬─────────────────────────────────────────────────────┬─────────────────────┐
│ #   │ Sev │ Area    │ Issue                                               │ Suggested Fix       │
│     │ eri │         │                                                     │                     │
│     │ ty  │         │                                                     │                     │
├─────┼─────┼─────────┼─────────────────────────────────────────────────────┼─────────────────────┤
│ 31  │ Med │ Seating │ No touch/mobile support for pan/zoom — the SVG is   │ Add touch gesture   │
│     │ ium │ chart   │ hard to use on phones. Drag only works with mouse.  │ support             │
│     │     │         │                                                     │ (pinch-zoom, touch  │
│     │     │         │                                                     │ pan)                │
│ 32  │ Med │ Checkou │ Dialog is sm:max-w-4xl but content overflows on     │ Make it full-screen │
│     │ ium │ t       │ mobile with the stepper + 4 steps                   │ on mobile or use    │
│     │     │ dialog  │                                                     │ bottom sheet        │
│ 33  │ Med │ Seat se │ Fixed bottom bar overlaps with browser UI on mobile │ Use env(safe-area-i │
│     │ ium │ lection │ Safari                                              │ nset-bottom)        │
│     │     │ page    │                                                     │ padding             │
│ 34  │ Med │ Accessi │ No ARIA labels on seat SVG elements — screen        │ Add role="button",  │
│     │ ium │ bility  │ readers can't navigate the seating chart            │ aria-label,         │
│     │     │         │                                                     │ tabIndex to seats   │
│ 35  │ Low │ Events  │ Category filter is horizontal scroll on mobile —    │ Make category pills │
│     │     │ list    │ may be hidden                                       │ wrap on mobile      │
│ 36  │ Low │ Homepag │ Stats are hardcoded (500+, 50K+, etc.) — not        │ Pull from database  │
│     │     │ e       │ connected to real data                              │ or CMS              │
│ 37  │ Low │ Checkou │ The "PROCEED" button in seat selection changes from │ Add proper          │
│     │     │ t       │ translate-y-full to visible — but on mobile it may  │ z-indexing and      │
│     │     │         │ overlap the seat legend bar                         │ spacing             │
│ 38  │ Low │ Dark    │ Seating chart uses hardcoded colors (#ffffff fills, │ Use theme-aware     │
│     │     │ mode    │ #22c55e strokes) that don't adapt to dark mode      │ colors or add dark  │
│     │     │         │                                                     │ mode variants       │
└─────┴─────┴─────────┴─────────────────────────────────────────────────────┴─────────────────────┘
────────────────────────────────────────────────────────────────────────────────
4. PERFORMANCE REVIEW
┌─────┬─────┬───────────────────────────────────────┬────────────────────┬────────────────────────┐
│ #   │ Sev │ Issue                                 │ Impact             │ Fix                    │
│     │ eri │                                       │                    │                        │
│     │ ty  │                                       │                    │                        │
├─────┼─────┼───────────────────────────────────────┼────────────────────┼────────────────────────┤
│ 39  │ Hig │ getAdminStats() fetches ALL bookings  │ O(n) memory +      │ Use prisma.booking.agg │
│     │ h   │ (prisma.booking.findMany({ select: {  │ network for every  │ regate({ _sum: {       │
│     │     │ total: true } })) just to sum revenue │ dashboard load     │ total: true } })       │
│ 40  │ Hig │ checkMemberIdAction loads ALL         │ O(n²) with number  │ Add a dedicated        │
│     │ h   │ bookings for an event to check if a   │ of bookings ×      │ MemberBooking table or │
│     │     │ member ID was used                    │ attendees          │ indexed JSON query     │
│ 41  │ Med │ verifyMemberForSeatSelection also     │ Same O(n) issue    │ Add a memberUsedSeats  │
│     │ ium │ loads ALL bookings for the event      │                    │ index or cache         │
│ 42  │ Med │ getCheckedInCount fetches all         │ Unnecessary data   │ Use SQL aggregate      │
│     │ ium │ bookings with attendees just to count │ transfer           │                        │
│     │     │ them                                  │                    │                        │
│ 43  │ Med │ EventsProvider and MembersProvider    │ Redundant API      │ Use React Query/SWR    │
│     │ ium │ fetch data client-side on every page  │ calls when         │ with caching           │
│     │     │ load                                  │ navigating between │                        │
│     │     │                                       │ admin pages        │                        │
│ 44  │ Med │ Seating chart re-renders the entire   │ Jank on lower-end  │ Memoize seat           │
│     │ ium │ SVG on every seat selection           │ devices            │ components; use        │
│     │     │ (thousands of DOM elements)           │                    │ virtual rendering for  │
│     │     │                                       │                    │ off-screen seats       │
│ 45  │ Low │ calculateFees is called on every      │ Unnecessary server │ Move fee calculation   │
│     │     │ subtotalAmount change in checkout     │ round-trip for a   │ to client-side or      │
│     │     │                                       │ simple calculation │ cache result           │
│ 46  │ Low │ Hero image on homepage is 1800x1200   │ Slow initial load  │ Use Next.js Image with │
│     │     │ from picsum.photos                    │                    │ sizes prop and smaller │
│     │     │                                       │                    │ placeholder            │
└─────┴─────┴───────────────────────────────────────┴────────────────────┴────────────────────────┘
────────────────────────────────────────────────────────────────────────────────
5. SECURITY REVIEW
Critical Security Issues
┌─────┬─────┬──────┬────────────────────────────────────────────────────────┬──────────────────────┐
│ #   │ Sev │ Cate │ Description                                            │ Fix                  │
│     │ eri │ gory │                                                        │                      │
│     │ ty  │      │                                                        │                      │
├─────┼─────┼──────┼────────────────────────────────────────────────────────┼──────────────────────┤
│ 47  │ Cri │ Auth │ Server actions (deleteMember, deleteAllEvents,         │ Add                  │
│     │ tic │ oriz │ seedEvents, addMember, etc.) have zero server-side     │ getServerSession() + │
│     │ al  │ atio │ authorization checks. Any authenticated user can call  │ role check at the    │
│     │     │ n    │ any server action from the browser console.            │ top of every admin   │
│     │     │      │                                                        │ server action        │
│ 48  │ Cri │ Hard │ Default admin password admin123 in source code.        │ Remove all hardcoded │
│     │ tic │ code │ Fallback JWT secret "fallback-secret-key-for-dev" in 3 │ secrets              │
│     │ al  │ d Se │ files.                                                 │                      │
│     │     │ cret │                                                        │                      │
│     │     │ s    │                                                        │                      │
│ 49  │ Cri │ Race │ No seat locking between selection and booking — allows │ Implement seat       │
│     │ tic │ Cond │ double-booking                                         │ reservation with TTL │
│     │ al  │ itio │                                                        │                      │
│     │     │ n    │                                                        │                      │
│ 50  │ Hig │ JWT  │ Member JWT uses HS256 with a potentially weak/fallback │ Ensure strong        │
│     │ h   │ Secu │ secret                                                 │ secret; consider     │
│     │     │ rity │                                                        │ RS256                │
│ 51  │ Hig │ Cook │ member-token has secure: false and sameSite: "lax"     │ secure: true in      │
│     │ h   │ ie S │                                                        │ production;          │
│     │     │ ecur │                                                        │ sameSite: "strict"   │
│     │     │ ity  │                                                        │                      │
│ 52  │ Hig │ Emai │ User-controlled data injected directly into HTML email │ Sanitize all dynamic │
│     │ h   │ l In │ without escaping                                       │ values               │
│     │     │ ject │                                                        │                      │
│     │     │ ion  │                                                        │                      │
│ 53  │ Hig │ Inpu │ createBooking accepts raw any type — no server-side    │ Validate all inputs  │
│     │ h   │ t Va │ validation of attendee data, prices, or event          │ with Zod             │
│     │     │ lida │ existence                                              │                      │
│     │     │ tion │                                                        │                      │
│ 54  │ Hig │ XSS  │ dangerouslySetInnerHTML found in chart.tsx (shadcn     │ Monitor for updates  │
│     │ h   │ (Low │ component) — this is for CSS injection in Recharts,    │                      │
│     │     │ Risk │ which is acceptable but worth noting                   │                      │
│     │     │ )    │                                                        │                      │
│ 55  │ Med │ CSRF │ No CSRF tokens on server actions beyond Next.js        │ Add CSRF protection  │
│     │ ium │      │ built-in protections. Member API routes use cookies    │ for state-changing   │
│     │     │      │ but have no CSRF tokens                                │ API routes           │
│ 56  │ Med │ Rate │ No rate limiting on any endpoint — login, signup,      │ Add rate limiting    │
│     │ ium │ Limi │ booking, check-in all vulnerable to brute force        │ middleware           │
│     │     │ ting │                                                        │                      │
│ 57  │ Med │ SQL  │ Prisma ORM is used throughout — SQL injection is not   │ ✅ Safe              │
│     │ ium │ Inje │ possible via Prisma client                             │                      │
│     │     │ ctio │                                                        │                      │
│     │     │ n    │                                                        │                      │
│ 58  │ Med │ File │ Member import accepts Excel files but only validates   │ Add file size limits │
│     │ ium │ Uplo │ format, not size or malicious content                  │ and content          │
│     │     │ ad   │                                                        │ validation           │
└─────┴─────┴──────┴────────────────────────────────────────────────────────┴──────────────────────┘
Good Security Practices Found ✅
- Prisma ORM prevents SQL injection
- Passwords hashed with bcrypt (12 rounds)
- NextAuth session strategy uses JWT (stateless)
- Admin route middleware checks token + role
- Zod validation on signup form
-  httpOnly  cookie for member token
────────────────────────────────────────────────────────────────────────────────
6. CODE QUALITY REVIEW
Code Duplication
┌─────┬──────────────────────────────────────────────────────────────┬─────┬──────────────────────┐
│ #   │ Issue                                                        │ Fil │ Fix                  │
│     │                                                              │ es  │                      │
├─────┼──────────────────────────────────────────────────────────────┼─────┼──────────────────────┤
│ 59  │ getSecret() function duplicated in member-login, member-me,  │ 3 f │ Extract to           │
│     │ member-reset-password — all with the same fallback           │ ile │ lib/auth.ts          │
│     │                                                              │ s   │                      │
│ 60  │ EventsProvider and MembersProvider instantiated in root      │ 2 f │ Remove from root     │
│     │ layout AND admin layout                                      │ ile │ layout or admin      │
│     │                                                              │ s   │ layout               │
│ 61  │ Pagination logic (page number calculation, prev/next         │ 2 f │ Extract Pagination   │
│     │ buttons) duplicated in admin events and admin members pages  │ ile │ component            │
│     │                                                              │ s   │                      │
└─────┴──────────────────────────────────────────────────────────────┴─────┴──────────────────────┘
Dead Code
┌─────┬───────────────────────────────────┬───────────────────────────────────────────────────────┐
│ #   │ File                              │ Issue                                                 │
├─────┼───────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 62  │ src/lib/data.ts                   │ Completely empty events array, marked deprecated      │
│ 63  │ use-booking-flow.tsx              │ Full booking flow context/provider — never used       │
│     │                                   │ anywhere in the app                                   │
│ 64  │ seat-layouts.ts →                 │ Function defined but never called (seating chart      │
│     │ generateSeatsFromAuditorium       │ generates its own SVG)                                │
│ 65  │ SEAT_LAYOUTS.default              │ Legacy layout object never used (only RIC_AUDITORIUM  │
│     │                                   │ is used)                                              │
│ 66  │ calc.js, layout_calc.txt,         │ Development scratch files in project root             │
│     │ scratch/test-db.js                │                                                       │
└─────┴───────────────────────────────────┴───────────────────────────────────────────────────────┘
Bad Practices
┌─────┬───────────────────────────┬───────────────────────────────────────────────┬───────────────┐
│ #   │ Issue                     │ Location                                      │ Fix           │
├─────┼───────────────────────────┼───────────────────────────────────────────────┼───────────────┤
│ 67  │ any types used            │ booking-actions.ts, checkout-dialog.tsx,      │ Define proper │
│     │ extensively               │ checkin-actions.ts, providers                 │ interfaces    │
│ 68  │ console.log debug         │ signup route (console.log('[SIGNUP_ROUTE]     │ Remove        │
│     │ statements in production  │ DATABASE_URL present:'...)), member-login     │               │
│     │ code                      │                                               │               │
│ 69  │ ignoreBuildErrors: true   │ next.config.ts                                │ Set to false  │
│ 70  │ Inconsistent quote styles │ Mix of " and ' across files                   │ Standardize   │
│     │                           │                                               │ (Prettier)   