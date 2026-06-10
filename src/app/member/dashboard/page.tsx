"use client";

import { useMemberAuth } from "@/hooks/use-member-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Crown, User, Phone, Mail, IdCard, LogOut, Tag, Ticket, ArrowRight, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberEventBookings, type MemberEventBookingSummary } from "@/app/actions/member-bookings-action";

function MemberSkeleton() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function MemberDashboardPage() {
  const { member, loading, memberLogout } = useMemberAuth();
  const router = useRouter();
  const [memberBookings, setMemberBookings] = useState<MemberEventBookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    const res = await getMemberEventBookings();
    if (res.success && res.bookings) {
      setMemberBookings(res.bookings);
    }
    setBookingsLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !member) {
      router.push("/member-login");
    }
  }, [member, loading, router]);

  useEffect(() => {
    if (member) {
      fetchBookings();
    }
  }, [member, fetchBookings]);

  if (loading) return <MemberSkeleton />;
  if (!member) return null;

  // Deduplicate by event: count seats per event (most recent booking wins)
  const eventMap = new Map<string, MemberEventBookingSummary>();
  for (const b of memberBookings) {
    if (!eventMap.has(b.eventId)) {
      eventMap.set(b.eventId, { ...b });
    } else {
      // Sum up seat counts across multiple bookings for the same event
      const existing = eventMap.get(b.eventId)!;
      existing.bookingCount += b.bookingCount;
    }
  }
  const eventSummaries = Array.from(eventMap.values()).sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
  const totalUsed = memberBookings.reduce((sum, b) => sum + b.bookingCount, 0);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold">Member Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {member.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={memberLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Crown className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <p className="text-sm text-muted-foreground">Member ID: {member.memberId}</p>
              <div className="flex items-center gap-1 mt-2">
                <Tag className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {member.categoryAcronym || member.categoryType}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Quick Actions + Booking History */}
          <Card className="border-amber-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" /> Member Benefits</CardTitle>
              <CardDescription>Book free seats for upcoming events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/member/events"
                className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group"
              >
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Ticket className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-800">Book Free Seats</h3>
                  <p className="text-xs text-amber-600">
                    Browse events and book your complimentary member tickets
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Booking Usage Summary */}
              <div className="pt-2 border-t border-amber-100">
                <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Your Free Bookings
                </h4>
                {bookingsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : eventSummaries.length === 0 ? (
                  <div className="text-center py-4 px-3 rounded-lg bg-amber-50/50">
                    <p className="text-xs text-amber-600">
                      You haven't booked any free seats yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Browse events above to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {eventSummaries.map((b) => {
                      const isPast = new Date(b.eventDate) < new Date();
                      return (
                        <Link
                          key={b.eventId}
                          href={`/confirmation/${b.bookingId}`}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-100 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{b.eventName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(b.eventDate), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[10px] text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
                                      Booked {format(new Date(b.bookingDate), "MMM d, h:mm a")}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {format(new Date(b.bookingDate), "MMMM d, yyyy, h:mm:ss a")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {isPast && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Past</Badge>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={isPast ? "secondary" : "default"}
                            className="ml-2 shrink-0 text-xs gap-1"
                          >
                            <Ticket className="h-3 w-3" />
                            {b.bookingCount} {b.bookingCount === 1 ? "seat" : "seats"}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {eventSummaries.length > 0 && (
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-amber-100">
                    <span className="text-xs text-muted-foreground">Total free seats booked</span>
                    <span className="text-sm font-bold text-amber-700">{totalUsed}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <IdCard className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member ID</p>
                    <p className="font-medium">{member.memberId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Tag className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{member.categoryType} ({member.categoryAcronym})</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
