"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEvents } from "@/app/admin/events/events-provider";
import { Event, Seat, SeatSection } from "@/lib/types";
import { SeatingChart } from "@/components/events/seating-chart";
import { SEAT_LAYOUTS, RIC_AUDITORIUM } from "@/lib/seat-layouts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Check, Crown, LogIn, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckoutDialog } from "@/components/checkout/checkout-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { verifyMemberForSeatSelection } from "@/app/actions/member-link-actions";
import { getBookedSeats } from "@/app/actions/booking-actions";
import { getSeatAccessTiers, type SeatAccessTierType } from "@/app/actions/seat-admin-actions";
import Link from "next/link";

type BookingStep = "showtime" | "seats" | "summary";

const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, label: "SHOWTIME" },
        { id: 2, label: "SEATS" },
        { id: 3, label: "PAY" },
    ];

    return (
        <div className="bg-white border-b py-4">
            <div className="max-w-[280px] mx-auto flex items-center justify-between">
                {steps.map((s, i) => (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                currentStep === s.id ? "bg-[#F84464] text-white" :
                                    currentStep > s.id ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                            )}>
                                {currentStep > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-tighter",
                                currentStep === s.id ? "text-[#F84464]" :
                                    currentStep > s.id ? "text-green-600" : "text-gray-400"
                            )}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={cn(
                                "flex-1 h-[1px] mx-2 -mt-4",
                                currentStep > s.id ? "bg-green-500" : "bg-gray-200"
                            )} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ──────────────────── Screen 1: Showtime ──────────────────── */

function ShowtimeSelection({ event, onNext }: { event: Event; onNext: (showtime: string) => void }) {
    const [selectedShowtime, setSelectedShowtime] = useState(event.showtimes?.[0] ?? "");

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 pb-32">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-2">Select Showtime</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    {format(new Date(event.date), "EEEE, d MMMM yyyy")}
                </p>

                {event.showtimes && event.showtimes.length > 0 && (
                    <>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {event.showtimes.map(time => (
                                <Button
                                    key={time}
                                    variant={selectedShowtime === time ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedShowtime(time)}
                                    className={cn(
                                        "text-xs font-semibold py-1 px-3 h-8",
                                        selectedShowtime === time ? "bg-black text-white" : "border-gray-300 text-gray-600 hover:bg-gray-100"
                                    )}
                                >
                                    {time}
                                </Button>
                            ))}
                        </div>
                        <Separator className="mb-6" />
                    </>
                )}

                <h3 className="font-bold mb-4">Ticket Categories</h3>
                <div className="space-y-4">
                    {event.ticketTypes.map((type) => (
                        <div key={type.type} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50">
                            <div>
                                <h4 className="font-bold text-gray-800 uppercase tracking-wide text-sm">{type.type}</h4>
                                <p className="text-xl font-black text-gray-900 mt-0.5">₹{type.price}</p>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Available</Badge>
                        </div>
                    ))}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                        <div>
                            <h4 className="font-bold text-amber-800 uppercase tracking-wide text-sm flex items-center gap-1.5">
                                <Crown className="h-4 w-4" /> Members Exclusive
                            </h4>
                            <p className="text-xl font-black text-amber-700 mt-0.5">Free</p>
                        </div>
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Member Only</Badge>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg flex gap-3 items-start">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        RIC Members get free access to the exclusive Members section. Verify your membership after selecting seats.
                    </p>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-2xl mx-auto flex justify-between items-center px-4">
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">Selected Showtime</p>
                        <p className="text-lg font-black text-gray-800">{selectedShowtime || "—"}</p>
                    </div>
                    <Button
                        className="bg-[#F84464] hover:bg-[#F84464]/90 text-white px-12 py-7 rounded-xl text-lg font-bold shadow-lg"
                        onClick={() => onNext(selectedShowtime)}
                        disabled={!selectedShowtime}
                    >
                        SELECT SEATS
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────── Screen 3: Summary ──────────────────── */

function BookingSummary({
    event,
    showtime,
    selectedSeats,
    onProceed,
    onBack,
}: {
    event: Event;
    showtime: string;
    selectedSeats: { seat: Seat; section: { sectionName: string; price: number } }[];
    onProceed: () => void;
    onBack: () => void;
}) {
    const total = selectedSeats.reduce((sum, s) => sum + s.section.price, 0);

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 pb-32">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Booking Summary</h2>

                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-50/50">
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{event.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(event.date), "EEE, d MMM yyyy")} · {showtime}
                            </p>
                            <p className="text-sm text-muted-foreground">{event.venue}</p>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                            Selected Seats ({selectedSeats.length})
                        </h4>
                        <div className="space-y-2">
                            {selectedSeats.map(({ seat, section }) => (
                                <div key={seat.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50">
                                    <span className="font-medium">{section.sectionName} — {seat.row}{seat.col}</span>
                                    <span className="font-bold">{section.price === 0 ? "Free" : `₹${section.price}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total Amount</span>
                        <span className="text-2xl font-black" style={{ color: total === 0 ? "#16a34a" : "#F84464" }}>{total === 0 ? "Free" : `₹${total}`}</span>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-2xl mx-auto flex justify-between items-center px-4">
                    <div>
                        <div className="text-2xl font-black text-gray-800">{total === 0 ? "Free" : `₹${total}`}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-tighter">{selectedSeats.length} Seat{selectedSeats.length !== 1 ? "s" : ""}</div>
                    </div>
                    <Button
                        className="px-12 py-7 rounded-xl text-lg font-bold shadow-lg text-white"
                        style={{ backgroundColor: total === 0 ? "#16a34a" : "#F84464" }}
                        onClick={onProceed}
                    >
                        {total === 0 ? "CONFIRM BOOKING" : "PROCEED TO PAY"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────── Main Page ──────────────────── */

export default function SeatsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { events, loading } = useEvents();
    const { user } = useAuth();
    const { member: loggedInMember, loading: memberLoading } = useMemberAuth();
    const { toast } = useToast();

    const [step, setStep] = useState<BookingStep>("showtime");
    const [selectedShowtime, setSelectedShowtime] = useState("");
    const searchParams = useSearchParams();
    const initialTickets = Math.min(6, Math.max(1, parseInt(searchParams.get("tickets") || "1", 10) || 1));
    const [ticketCount, setTicketCount] = useState(initialTickets);
    const [selectedSeats, setSelectedSeats] = useState<{ seat: Seat; section: { sectionName: string; price: number } }[]>([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [reservedSeats, setReservedSeats] = useState<string[]>([]);
    const [bookingsVersion, setBookingsVersion] = useState(0); // Increment to trigger refetch
    const [seatTiers, setSeatTiers] = useState<Record<string, SeatAccessTierType>>({});

    // Member state
    const [memberStatus, setMemberStatus] = useState<{
      isMember: boolean;
      alreadyUsed: boolean;
      name?: string;
      memberId?: number;
      categoryAcronym?: string;
    } | null>(null);
    const [checkingMember, setCheckingMember] = useState(true);

    const event = events.find((e) => e.id === id);

    // Also update ticketCount when search params change (e.g. back navigation)
    useEffect(() => {
        const t = parseInt(searchParams.get("tickets") || "1", 10) || 1;
        setTicketCount(Math.min(6, Math.max(1, t)));
    }, [searchParams]);

    // Check member status on mount
    useEffect(() => {
        const check = async () => {
            if (!user) {
                setCheckingMember(false);
                return;
            }
            const uid = (user as any).uid || (user as any).id;
            if (!uid) { setCheckingMember(false); return; }
            const res = await verifyMemberForSeatSelection(uid, id);
            if (res.success) {
                setMemberStatus(res.isMember ? {
                    isMember: true,
                    alreadyUsed: res.alreadyUsed || false,
                    name: res.member?.name,
                    memberId: res.member?.memberId,
                    categoryAcronym: res.member?.categoryAcronym,
                } : null);
            }
            setCheckingMember(false);
        };
        check();
    }, [user, id]);

    // Also detect member logged in via separate member auth (JWT cookie)
    useEffect(() => {
        if (memberLoading) return;
        if (loggedInMember && !memberStatus) {
            setMemberStatus({
                isMember: true,
                alreadyUsed: false,
                name: loggedInMember.name,
                memberId: loggedInMember.memberId,
                categoryAcronym: loggedInMember.categoryAcronym || "Member",
            });
        }
    }, [loggedInMember, memberLoading, memberStatus]);

    // Fetch seat access tiers
    useEffect(() => {
        if (!id) return;
        getSeatAccessTiers(id).then((res) => {
            if (res.success && res.tiers) {
                setSeatTiers(res.tiers);
            }
        });
    }, [id]);

    // Fetch booked and reserved seats
    useEffect(() => {
        const fetch = async () => {
            if (!id) return;
            const bookedRes = await getBookedSeats(id);
            if (bookedRes.success && bookedRes.seatIds) {
                setBookedSeats(bookedRes.seatIds);
            }
            if (bookedRes.success && bookedRes.reservedSeats) {
                const myMemberId = memberStatus?.memberId;
                const reservedKeys = Object.keys(bookedRes.reservedSeats);
                
                // Exclude seats that are reserved by the currently logged-in member
                // so they appear as available to them.
                const othersReserved = myMemberId 
                    ? reservedKeys.filter(seatId => bookedRes.reservedSeats[seatId].memberId !== myMemberId)
                    : reservedKeys;
                    
                setReservedSeats(othersReserved);
            }
        };
        fetch();
    }, [id, bookingsVersion, memberStatus?.memberId]);

    useEffect(() => {
        if (event && !selectedShowtime && event.showtimes?.length > 0) {
            setSelectedShowtime(event.showtimes[0]);
        }
    }, [event, selectedShowtime]);

    const stepNumber = useMemo(() => {
        if (step === "showtime") return 1;
        if (step === "seats") return 2;
        return 3;
    }, [step]);

    if (loading || !event) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    const goToSeats = (showtime: string) => {
        setSelectedShowtime(showtime);
        setStep("seats");
    };

    const goToSummary = (seats: { seat: Seat; section: { sectionName: string; price: number } }[]) => {
        setSelectedSeats(seats);
        setStep("summary");
    };

    const handleBack = () => {
        if (step === "summary") setStep("seats");
        else if (step === "seats") setStep("showtime");
        else router.back();
    };

    const handleProceedToPay = () => {
        if (selectedSeats.length === 0) {
            toast({ variant: "destructive", title: "No seats selected", description: "Please select at least one seat to proceed." });
            return;
        }
        if (!user && !loggedInMember) {
            toast({ variant: "destructive", title: "Login Required", description: "Please log in to continue with your booking." });
            router.push(`/login?redirect=/events/${id}/seats`);
            return;
        }
        setCheckoutOpen(true);
    };

    const convertedSeats = selectedSeats.map(({ seat, section }) => ({
        seat: { id: seat.id, row: seat.row, col: seat.col, isBooked: seat.isBooked },
        section: { sectionName: section.sectionName, price: section.price, rows: [], className: "" },
    }));

    // Derive member info to pass to checkout dialog (bypasses unreliable auto-verify)
    const memberInfo = memberStatus?.isMember
        ? { name: memberStatus.name || 'Member', memberId: memberStatus.memberId || 0, categoryAcronym: memberStatus.categoryAcronym || '' }
        : (loggedInMember
            ? { name: loggedInMember.name, memberId: loggedInMember.memberId, categoryAcronym: loggedInMember.categoryAcronym || '' }
            : null);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="bg-[#333545] text-white py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleBack}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">{event.name}</h1>
                            <p className="text-xs text-gray-400">{event.venue} | {format(new Date(event.date), "EEE, d MMM, yyyy")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {step === "seats" && (
                            <div className="hidden sm:flex items-center gap-2 border border-gray-500 rounded px-3 py-1">
                                <span className="text-xs font-bold uppercase tracking-wider">{ticketCount} Ticket{ticketCount !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                        {!checkingMember && (
                            memberStatus?.isMember ? (
                                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
                                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-300">{memberStatus.name || "Member"}</span>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-white hover:bg-white/10 text-xs gap-1"
                                >
                                    <Link href={`/login?mode=member&redirect=/events/${id}/seats`}>
                                        <LogIn className="h-3.5 w-3.5" /> Member Login
                                    </Link>
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <Stepper currentStep={stepNumber} />

            {/* Context bar */}
            <div className="bg-[#F5F5F5] py-2 border-b">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-600">
                        {event.venue} | {format(new Date(event.date), "EEE, d MMM")} | {selectedShowtime || "—"}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {step === "showtime" && (
                    <div className="flex-1 overflow-y-auto">
                        <ShowtimeSelection event={event} onNext={goToSeats} />
                    </div>
                )}

                {step === "seats" && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <SeatingChart
                                event={event}
                                ticketCount={ticketCount}
                                onTicketCountChange={setTicketCount}
                                onProceed={goToSummary}
                                layout={RIC_AUDITORIUM}
                                isMember={memberStatus?.isMember ?? false}
                                memberLabel={memberStatus?.name ? `${memberStatus.name} (${memberStatus.categoryAcronym || "Member"})` : undefined}
                                bookedSeats={bookedSeats}
                                reservedSeats={reservedSeats}
                                seatTiers={seatTiers}
                                memberCategory={memberStatus?.categoryAcronym}
                            />
                        </div>
                    </div>
                )}

                {step === "summary" && (
                    <div className="flex-1 overflow-y-auto">
                        <BookingSummary
                            event={event}
                            showtime={selectedShowtime}
                            selectedSeats={selectedSeats}
                            onProceed={handleProceedToPay}
                            onBack={() => setStep("seats")}
                        />
                    </div>
                )}
            </main>

            {/* Checkout Dialog */}
            {event && (
                <CheckoutDialog
                    isOpen={checkoutOpen}
                    onOpenChange={(open) => {
                        // Refetch seats when dialog closes (booking may have happened)
                        if (!open) {
                            setBookingsVersion(v => v + 1);
                        }
                        setCheckoutOpen(open);
                    }}
                    event={event}
                    selectedSeats={convertedSeats}
                    memberInfo={memberInfo}
                />
            )}

            {/* Member login moved to /member-login */}
        </div>
    );
}
