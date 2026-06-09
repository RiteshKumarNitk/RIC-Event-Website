"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useEvents } from "@/app/admin/events/events-provider";
import { Event, Seat, SeatSection } from "@/lib/types";
import { SeatingChart } from "@/components/events/seating-chart";
import { RIC_AUDITORIUM } from "@/lib/seat-layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getBookedSeats } from "@/app/actions/booking-actions";
import { createMemberBooking } from "@/app/actions/member-booking-actions";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Crown,
  Calendar,
  MapPin,
  Clock,
  Info,
  Loader2,
  Ticket,
  ChevronLeft,
} from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Step = "showtime" | "seats" | "confirm";

function MemberSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#333545] py-3 px-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function MemberEventBookingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { member, loading: memberLoading } = useMemberAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("showtime");
  const [selectedShowtime, setSelectedShowtime] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<
    { seat: Seat; section: { sectionName: string; price: number } }[]
  >([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingsVersion, setBookingsVersion] = useState(0);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    bookingId?: string;
  } | null>(null);
  const [bookingTimestamp, setBookingTimestamp] = useState<Date | null>(null);

  const event = events.find((e) => e.id === id);

  // Redirect if not logged in
  useEffect(() => {
    if (!memberLoading && !member) {
      router.push(`/member-login?redirect=/member/events/${id}`);
    }
  }, [member, memberLoading, router, id]);

  // Set default showtime
  useEffect(() => {
    if (event && !selectedShowtime && event.showtimes?.length > 0) {
      setSelectedShowtime(event.showtimes[0]);
    }
  }, [event, selectedShowtime]);

  // Fetch booked seats (refetches when bookingsVersion changes)
  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const res = await getBookedSeats(id);
      if (res.success && res.seatIds) {
        setBookedSeats(res.seatIds);
      }
      if (res.success && res.reservedSeats) {
        setReservedSeats(Object.keys(res.reservedSeats));
      }
    };
    fetch();
  }, [id, bookingsVersion]);

  const handleGoToSeats = (showtime: string) => {
    setSelectedShowtime(showtime);
    setStep("seats");
  };

  const handleSeatsSelected = (
    seats: { seat: Seat; section: { sectionName: string; price: number } }[]
  ) => {
    setSelectedSeats(seats);
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!member || !event || selectedSeats.length === 0) return;

    setIsBooking(true);
    try {
      const seatIds = selectedSeats.map((s) => s.seat.id);
      const result = await createMemberBooking(event.id, seatIds, selectedShowtime);

      if (result.success) {
        setBookingResult({ success: true, bookingId: result.bookingId });
        setBookingTimestamp(new Date());
        setBookingsVersion(v => v + 1); // Trigger refetch of booked seats
        toast({
          title: "Booking Confirmed! 🎉",
          description: `Your free seat${selectedSeats.length > 1 ? "s have" : " has"} been booked successfully.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Booking Failed",
          description: result.error || "Could not complete the booking.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBack = () => {
    if (step === "seats") setStep("showtime");
    else if (step === "confirm") setStep("seats");
    else router.push("/member/events");
  };

  if (memberLoading || eventsLoading || !event) {
    return <MemberSkeleton />;
  }
  if (!member) return null;

  const convertedSeats = selectedSeats.map(({ seat, section }) => ({
    seat: { id: seat.id, row: seat.row, col: seat.col, isBooked: seat.isBooked },
    section: { sectionName: section.sectionName, price: section.price, rows: [], className: "" },
  }));

  // ─── CONFIRMATION SCREEN ───
  if (bookingResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto bg-green-100 rounded-full h-20 w-20 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-2">
              Your free seat{selectedSeats.length > 1 ? "s" : ""} for{" "}
              <span className="font-semibold text-foreground">{event.name}</span>{" "}
              {selectedSeats.length > 1 ? "are" : "is"} all set.
            </p>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-6">
              <Crown className="h-3.5 w-3.5 mr-1" />
              Member Benefit — Free Booking
            </Badge>

            <Card className="text-left mb-8 border-green-200">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono font-bold text-green-700">
                    {bookingResult.bookingId}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event</span>
                  <span className="font-medium">{event.name}</span>
                </div>
                {bookingTimestamp && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booked on</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium cursor-help border-b border-dotted border-muted-foreground/30">
                            {format(bookingTimestamp, "MMM d, h:mm a")}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {format(bookingTimestamp, "MMMM d, yyyy, h:mm:ss a")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {format(new Date(event.date), "EEE, MMM d, yyyy")}
                  </span>
                </div>
                {selectedShowtime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Showtime</span>
                    <span className="font-medium">{selectedShowtime}</span>
                  </div>
                )}
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground block mb-2">
                    Seats ({selectedSeats.length})
                  </span>
                  {selectedSeats.map((s, i) => (
                    <div
                      key={s.seat.id}
                      className="flex justify-between py-1 text-sm"
                    >
                      <span>
                        {s.section.sectionName} — {s.seat.row}
                        {s.seat.col}
                      </span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-green-600">Free</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => router.push("/member/events")}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Book Another Event
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/member/dashboard")}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Dark header bar */}
      <header className="bg-[#333545] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-sm font-bold leading-tight">{event.name}</h1>
              <p className="text-[10px] text-gray-400">
                Member Booking — {member.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">
              {member.memberId}
            </span>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b py-3">
        <div className="max-w-sm mx-auto flex items-center justify-center gap-0">
          {(["showtime", "seats", "confirm"] as Step[]).map((s, i) => {
            const labels: Record<Step, string> = {
              showtime: "Showtime",
              seats: "Seats",
              confirm: "Confirm",
            };
            const isActive = step === s;
            const isDone = step !== s && i < (["showtime", "seats", "confirm"].indexOf(step));

            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                      isActive
                        ? "bg-amber-500 text-white"
                        : isDone
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-tighter",
                      isActive
                        ? "text-amber-600"
                        : isDone
                        ? "text-green-600"
                        : "text-gray-400"
                    )}
                  >
                    {labels[s]}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={cn(
                      "w-12 h-[1px] mx-1 -mt-4",
                      isDone ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context bar */}
      <div className="bg-[#F5F5F5] py-2 border-b">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 text-xs font-medium text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(event.date), "EEE, d MMM")}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.venue}
          </span>
          {selectedShowtime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {selectedShowtime}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* STEP 1: Showtime */}
        {step === "showtime" && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-8 px-4 pb-32">
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-bold">Select Showtime</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {format(new Date(event.date), "EEEE, d MMMM yyyy")} —{" "}
                  <span className="text-amber-600 font-medium">Free for Members</span>
                </p>

                {event.showtimes && event.showtimes.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {event.showtimes.map((time) => (
                        <Button
                          key={time}
                          variant={
                            selectedShowtime === time ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedShowtime(time)}
                          className={cn(
                            "text-xs font-semibold py-1 px-3 h-8",
                            selectedShowtime === time
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                    <Separator className="mb-6" />
                  </>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Member Benefit — Free Booking
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      As a RIC member, you can book free seats in the exclusive
                      Members section. Select your showtime and choose your
                      seats.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed bottom bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-2xl mx-auto flex justify-between items-center px-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">
                      Selected Showtime
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      {selectedShowtime || "—"}
                    </p>
                  </div>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-7 rounded-xl text-lg font-bold shadow-lg"
                    onClick={() => handleGoToSeats(selectedShowtime)}
                    disabled={!selectedShowtime}
                  >
                    SELECT SEATS
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Seating Chart */}
        {step === "seats" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              {/* Multi-seat selector for members */}
              <div className="bg-white border-b px-4 py-3 flex items-center justify-center gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Number of seats
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                    disabled={ticketCount <= 1}
                  >
                    −
                  </Button>
                  <span className="text-lg font-black text-gray-800 min-w-[32px] text-center">
                    {ticketCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTicketCount(Math.min(6, ticketCount + 1))}
                    disabled={ticketCount >= 6}
                  >
                    +
                  </Button>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  All seats are free for members
                </span>
              </div>
              <SeatingChart
                event={event}
                ticketCount={ticketCount}
                onTicketCountChange={setTicketCount}
                onProceed={handleSeatsSelected}
                layout={RIC_AUDITORIUM}
                isMember={true}
                memberLabel={`${member.name} (${member.categoryAcronym || "Member"})`}
                bookedSeats={bookedSeats}
                reservedSeats={reservedSeats}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Confirm Booking */}
        {step === "confirm" && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-8 px-4 pb-32">
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-bold">Confirm Your Booking</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-amber-50/30">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{event.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(event.date), "EEE, d MMM yyyy")} ·{" "}
                        {selectedShowtime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.venue}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                      Selected Seats ({selectedSeats.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedSeats.map(({ seat, section }) => (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between text-sm p-3 rounded-lg bg-amber-50 border border-amber-100"
                        >
                          <span className="font-medium flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            {section.sectionName} — {seat.row}
                            {seat.col}
                          </span>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Free
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Member</span>
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-amber-500" />
                      {member.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Member ID</span>
                    <span className="font-mono text-sm">
                      {member.memberId}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-black text-green-600">
                      FREE
                    </span>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 items-start">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      This is a member benefit booking. No payment required.
                      Your free seat will be confirmed immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed bottom bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-2xl mx-auto flex justify-between items-center px-4">
                  <div>
                    <div className="text-2xl font-black text-green-600">
                      FREE
                    </div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
                      {selectedSeats.length} Seat
                      {selectedSeats.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-7 rounded-xl text-lg font-bold shadow-lg"
                    onClick={handleConfirmBooking}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Crown className="h-5 w-5 mr-2" />
                        CONFIRM FREE BOOKING
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
