"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, ArrowLeft, Calendar, MapPin, Clock, Ticket } from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { format } from "date-fns";
import type { Booking, Event, Attendee } from "@/lib/types";
import { getUserBookings } from "@/app/actions/booking-actions";
import { CanvaslyExportButton } from "@/components/CanvaslyExportButton";

export default function ConfirmationPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/confirmation/${bookingId}`);
      return;
    }

    const fetchBooking = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await getUserBookings((user as any).uid || (user as any).id);
        if (res.success && res.bookings) {
          const found = res.bookings.find((b: any) => b.id === bookingId);
          if (found) {
            const bookingData = {
              ...found,
              eventDate: found.eventDate.toISOString(),
              bookingDate: found.bookingDate.toISOString(),
              attendees: found.attendees as Attendee[],
            } as Booking;
            setBooking(bookingData);
          }
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBooking();
    }
  }, [user, authLoading, bookingId, router]);

  if (authLoading || loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-9 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Separator />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="mx-auto bg-red-100 dark:bg-red-900/50 rounded-full h-16 w-16 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We could not find a booking with the ID <code className="bg-muted px-1 py-0.5 rounded text-sm">{bookingId}</code>.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = (booking.attendees as Attendee[]).reduce(
    (acc, att) => acc + (att.isMember ? 0 : att.price),
    0
  );

  const qrValue = JSON.stringify({
    bookingId: booking.id,
    eventName: booking.eventName,
    user: user?.email,
    seats: (booking.attendees as Attendee[]).map(a => a.seatId).join(", "),
  });

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="mx-auto bg-green-100 dark:bg-green-900/50 rounded-full h-16 w-16 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Your booking for <strong>{booking.eventName}</strong> is complete.
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          A confirmation has been sent to {user?.email}.
        </p>
      </div>

      <div id={`invoice-${bookingId}`} ref={invoiceRef} className="p-6 rounded-lg border bg-background">
        <h3 className="font-bold text-lg mb-4 text-center">E-Ticket / Invoice</h3>
        
        <div className="flex justify-center mb-4">
          <div className="bg-white p-2 rounded-md">
            <QRCode value={qrValue} size={128} />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Booking ID:</span>
            <span className="font-mono text-xs">{booking.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Event:</span>
            <span>{booking.eventName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{format(new Date(booking.eventDate), "PP")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Booked By:</span>
            <span>{user?.displayName || user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Booking Date:</span>
            <span>{format(new Date(booking.bookingDate), "PPp")}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <h4 className="font-semibold mb-2">Attendees & Seats</h4>
        <div className="space-y-2">
          {(booking.attendees as Attendee[]).map((attendee, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {attendee.attendeeName}
                <Badge variant={attendee.isMember ? "default" : "secondary"} className="ml-2 text-xs">
                  {attendee.isMember ? "Member" : "Guest"}
                </Badge>
              </span>
              <span className="font-mono text-xs">
                {attendee.seatId}
              </span>
              <span className="font-semibold">
                {attendee.isMember ? "Free" : `₹${attendee.price.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-bold text-base">
          <span>Total Paid:</span>
          <span>₹{totalPaid.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
        <CanvaslyExportButton
          elementId={`invoice-${bookingId}`}
          filename={`ric-booking-${bookingId}`}
          buttonText="Download Invoice"
        />
        <Button asChild variant="outline">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            My Bookings
          </Link>
        </Button>
        <Button asChild>
          <Link href="/events">
            <Ticket className="mr-2 h-4 w-4" />
            Browse Events
          </Link>
        </Button>
      </div>
    </div>
  );
}
