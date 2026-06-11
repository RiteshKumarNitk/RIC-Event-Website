"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  Ticket,
  Download,
  Printer,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface BookingData {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  total: number;
  bookingDate: string;
  attendees: {
    seatId: string;
    price: number;
    attendeeName: string;
    isMember?: boolean;
    memberId?: string;
  }[];
}

export default function MemberTicketPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { member, loading: memberLoading } = useMemberAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!memberLoading && !member) {
      router.push(`/member-login?redirect=/member/ticket/${bookingId}`);
    }
  }, [member, memberLoading, router, bookingId]);

  useEffect(() => {
    if (!member || !bookingId) return;

    const fetchBooking = async () => {
      setLoading(true);
      try {
        const { getMemberBookingDetails } = await import(
          "@/app/actions/member-booking-actions"
        );
        const res = await getMemberBookingDetails(bookingId);

        if (res.success && res.booking) {
          setBooking({
            id: res.booking.id,
            eventId: res.booking.eventId,
            eventName: res.booking.eventName,
            eventDate: res.booking.eventDate.toISOString(),
            total: res.booking.total,
            bookingDate: res.booking.bookingDate.toISOString(),
            attendees: res.booking.attendees,
          });
        } else {
          setError(res.error || "Booking not found.");
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [member, bookingId]);

  if (memberLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!member) return null;

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
        <div className="container max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "We could not find this booking."}
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild>
              <Ticket className="mr-2 h-4 w-4" />
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const qrValue = JSON.stringify({
    bookingId: booking.id,
    eventName: booking.eventName,
    user: member.email,
    seats: booking.attendees.map((a) => a.seatId).join(", "),
  });

  const totalPaid = booking.attendees.reduce(
    (acc, att) => acc + (att.isMember ? 0 : att.price),
    0
  );

  const handleDownloadPDF = async () => {
    const element = ticketRef.current;
    if (!element) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ric-ticket-${booking.id}.pdf`);
      toast({ title: "Downloaded!", description: "Your ticket PDF has been saved." });
    } catch (err) {
      console.error("PDF export failed:", err);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate PDF. Please try again." });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Your Ticket</h1>
            <p className="text-sm text-muted-foreground">
              Show this QR code at the venue entrance
            </p>
          </div>
        </div>

        {/* Print-only style */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
          }
        `}</style>

        {/* Printable ticket area */}
        <div ref={ticketRef} className="bg-white">
        {/* QR Code Card */}
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">
                Check-in QR Code
              </span>
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                <QRCode value={qrValue} size={180} />
              </div>
            </div>
            <p className="text-xs text-center text-amber-700">
              Scan this code at the venue entrance for quick check-in
            </p>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-bold text-green-700">
                Booking Confirmed
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono font-bold text-green-700">
                {booking.id}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Event</span>
              <span className="font-medium">{booking.eventName}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {format(new Date(booking.eventDate), "EEE, MMM d, yyyy")}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Booked on</span>
              <span className="font-medium">
                {format(new Date(booking.bookingDate), "MMM d, h:mm a")}
              </span>
            </div>

            <Separator />

            <div className="text-sm">
              <span className="text-muted-foreground block mb-2">
                Seats ({booking.attendees.length})
              </span>
              {booking.attendees.map((attendee, index) => (
                <div
                  key={index}
                  className="flex justify-between py-1 text-sm"
                >
                  <span>
                    {attendee.attendeeName} — {attendee.seatId}
                  </span>
                  <span className="text-green-600 font-medium">
                    {attendee.isMember ? "Free" : `₹${attendee.price}`}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-green-600">
                {totalPaid === 0 ? "Free" : `₹${totalPaid}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Member Badge */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Member Benefit — Free Booking
                </p>
                <p className="text-xs text-amber-700">
                  {member.name} • ID: {member.memberId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 no-print">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Generating..." : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Ticket
          </Button>
          <Button
            onClick={() => router.push("/member/dashboard")}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block mt-6 text-center text-xs text-gray-500 border-t pt-4">
          <p>RIC Event Ticket — Generated from ric-event-website.vercel.app</p>
          <p>Present this ticket at the venue entrance for check-in.</p>
        </div>
      </div>
    </div>
  );
}
