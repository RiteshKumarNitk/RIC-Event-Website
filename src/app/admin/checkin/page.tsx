"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "../events/events-provider";
import { useAuth } from "@/hooks/use-auth";
import {
  getBookingByQrData,
  checkInAttendee,
  checkInAllAttendees,
  getCheckedInCount,
} from "@/app/actions/checkin-actions";
import {
  QrCode, Camera, Search, CheckCircle2, XCircle,
  UserCheck, Users, Loader2, Calendar, MapPin, Clock, ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Html5Qrcode } from "html5-qrcode";

type AttendeeInfo = {
  seatId: string;
  price: number;
  attendeeName: string;
  memberId?: string;
  isMember: boolean;
  memberIdVerified: boolean;
  checkedIn: boolean;
  checkedInAt: string | null;
};

type BookingResult = {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  total: number;
  bookingDate: string;
  user: { name: string | null; email: string };
  attendees: AttendeeInfo[];
  allCheckedIn: boolean;
};

export default function AdminCheckinPage() {
  const { events } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [scanning, setScanning] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [manualId, setManualId] = useState("");
  const [scannerError, setScannerError] = useState("");
  const [stats, setStats] = useState<{ checkedIn: number; totalBookings: number; totalAttendees: number } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const startScanner = useCallback(async () => {
    setScannerError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          lookupBooking(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      setScannerError(err?.message || "Camera access denied. Use Manual Search instead.");
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      }
    };
  }, []);

  const lookupBooking = async (qrData: string) => {
    setLoading(true);
    setBooking(null);
    const res = await getBookingByQrData(qrData);
    if (res.success && res.booking) {
      setBooking(res.booking);
    } else {
      toast({ variant: "destructive", title: "Not Found", description: res.error || "Could not find booking." });
    }
    setLoading(false);
  };

  const handleManualSearch = async () => {
    if (!manualId.trim()) return;
    await lookupBooking(manualId.trim());
  };

  const handleCheckIn = async (seatId: string, attendeeName: string) => {
    if (!booking) return;
    setCheckingIn(true);
    const res = await checkInAttendee(booking.id, seatId, attendeeName, booking.eventId, (user as any)?.id);
    if (res.success) {
      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.seatId === seatId ? { ...a, checkedIn: true, checkedInAt: res.checkedInAt || new Date().toISOString() } : a
          ),
          allCheckedIn: prev.attendees.every((a) => a.seatId === seatId ? true : a.checkedIn),
        };
      });
      toast({ title: "Checked In", description: `${attendeeName} checked in successfully.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error || "Check-in failed." });
    }
    setCheckingIn(false);
  };

  const handleCheckInAll = async () => {
    if (!booking) return;
    const unchecked = booking.attendees.filter((a) => !a.checkedIn);
    if (unchecked.length === 0) {
      toast({ title: "All Checked In", description: "All attendees are already checked in." });
      return;
    }
    setCheckingIn(true);
    const res = await checkInAllAttendees(booking.id, booking.eventId, unchecked, (user as any)?.id);
    if (res.success) {
      const now = new Date().toISOString();
      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) => (a.checkedIn ? a : { ...a, checkedIn: true, checkedInAt: now })),
          allCheckedIn: true,
        };
      });
      toast({ title: "Done", description: res.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error || "Bulk check-in failed." });
    }
    setCheckingIn(false);
  };

  const fetchStats = async (eventId: string) => {
    if (eventId === "all") {
      setStats(null);
      return;
    }
    const res = await getCheckedInCount(eventId);
    if (res.success && res.stats) setStats(res.stats);
  };

  useEffect(() => {
    fetchStats(selectedEventId);
  }, [selectedEventId]);

  const resetView = () => {
    setBooking(null);
    setManualId("");
    setScannerError("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Check-In Scanner</h1>
          <p className="text-muted-foreground mt-1">Scan QR codes or search bookings to verify attendees</p>
        </div>
      </div>

      {/* Event filter + stats */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="shrink-0">Event:</Label>
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          {stats && (
            <div className="flex gap-4 ml-auto text-sm">
              <span className="text-muted-foreground">Checked in: <strong className="text-foreground">{stats.checkedIn}</strong> / {stats.totalAttendees}</span>
              <span className="text-muted-foreground">Bookings: <strong className="text-foreground">{stats.totalBookings}</strong></span>
            </div>
          )}
        </CardContent>
      </Card>

      {!booking ? (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === "scan" ? "default" : "outline"}
              onClick={() => setMode("scan")}
              className="gap-2"
            >
              <Camera className="h-4 w-4" /> Scan QR
            </Button>
            <Button
              variant={mode === "search" ? "default" : "outline"}
              onClick={() => setMode("search")}
              className="gap-2"
            >
              <Search className="h-4 w-4" /> Manual Search
            </Button>
          </div>

          {mode === "scan" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" /> QR Scanner
                </CardTitle>
                <CardDescription>Point your camera at the attendee&apos;s QR code</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div
                  id="qr-reader"
                  ref={scannerContainerRef}
                  className="w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-muted"
                />
                {!scanning && !scannerError && (
                  <Button onClick={startScanner} className="gap-2">
                    <Camera className="h-4 w-4" /> Start Camera
                  </Button>
                )}
                {scanning && (
                  <Button onClick={stopScanner} variant="outline" className="gap-2">
                    <XCircle className="h-4 w-4" /> Stop Scanner
                  </Button>
                )}
                {scannerError && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-destructive">{scannerError}</p>
                    <Button variant="outline" onClick={() => setMode("search")}>
                      Use Manual Search Instead
                    </Button>
                  </div>
                )}
                {loading && <Loader2 className="h-6 w-6 animate-spin" />}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" /> Manual Search
                </CardTitle>
                <CardDescription>Enter a Booking ID to look up</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Paste Booking ID here..."
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  />
                  <Button onClick={handleManualSearch} disabled={loading || !manualId.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Booking Result */
        <div className="space-y-4">
          <Button variant="ghost" onClick={resetView} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4" /> New Scan
          </Button>

          <Card className={cn("border-2", booking.allCheckedIn ? "border-green-500/50" : "border-amber-500/50")}>
            <CardHeader className={cn(
              "pb-4",
              booking.allCheckedIn ? "bg-green-500/5" : "bg-amber-500/5"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{booking.eventName}</CardTitle>
                    {booking.allCheckedIn ? (
                      <Badge className="bg-green-500 text-white gap-1"><CheckCircle2 className="h-3 w-3" /> All Checked In</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
                        <Users className="h-3 w-3" /> {booking.attendees.filter(a => !a.checkedIn).length} Pending
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(booking.eventDate), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {format(new Date(booking.bookingDate), "MMM d, h:mm a")}</span>
                  </CardDescription>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{booking.user.name || "Guest"}</p>
                  <p className="text-muted-foreground">{booking.user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Attendees ({booking.attendees.length})</Label>
                {!booking.allCheckedIn && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCheckInAll}
                    disabled={checkingIn}
                    className="gap-1.5"
                  >
                    {checkingIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                    Check In All
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {booking.attendees.map((attendee, i) => (
                  <div
                    key={attendee.seatId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      attendee.checkedIn ? "bg-green-500/5 border-green-500/20" : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                        attendee.checkedIn ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                      )}>
                        {attendee.checkedIn ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{attendee.attendeeName}</p>
                        <p className="text-xs text-muted-foreground">Seat {attendee.seatId}{attendee.isMember ? " · Member" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {attendee.checkedIn ? (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          Checked In
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(attendee.seatId, attendee.attendeeName)}
                          disabled={checkingIn}
                          className="h-8 gap-1"
                        >
                          {checkingIn ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
