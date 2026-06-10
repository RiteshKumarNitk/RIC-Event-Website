"use client";

import { useMemberAuth } from "@/hooks/use-member-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Crown, User, Phone, Mail, IdCard, LogOut, Tag, Ticket, ArrowRight,
  Calendar, Clock, CheckCircle2, CalendarCheck,
  Sparkles, ChevronRight, Award, CircleDot,
  History, Star,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMemberEventBookings, type MemberEventBookingSummary } from "@/app/actions/member-bookings-action";

function MemberDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        {/* Main content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl md:col-span-1" />
          <Skeleton className="h-96 rounded-xl md:col-span-2" />
        </div>
      </div>
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

  if (loading) return <MemberDashboardSkeleton />;
  if (!member) return null;

  // ─── Derived data ───
  // Deduplicate by event: count seats per event
  const eventMap = new Map<string, MemberEventBookingSummary>();
  for (const b of memberBookings) {
    if (!eventMap.has(b.eventId)) {
      eventMap.set(b.eventId, { ...b });
    } else {
      const existing = eventMap.get(b.eventId)!;
      existing.bookingCount += b.bookingCount;
    }
  }
  const eventSummaries = Array.from(eventMap.values()).sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
  const totalUsed = memberBookings.reduce((sum, b) => sum + b.bookingCount, 0);
  const upcomingBookings = eventSummaries.filter((b) => new Date(b.eventDate) > new Date());
  const pastBookings = eventSummaries.filter((b) => new Date(b.eventDate) <= new Date());
  const uniqueEvents = eventSummaries.length;

  // Get member initials for avatar
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);


  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ─── Stats ───
  const stats = [
    {
      label: "Total Bookings",
      value: totalUsed,
      icon: Ticket,
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      label: "Events Attended",
      value: uniqueEvents,
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-100",
      color: "text-emerald-600",
    },
    {
      label: "Upcoming",
      value: upcomingBookings.length,
      icon: Calendar,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-100",
      color: "text-amber-600",
    },
    {
      label: "Past Events",
      value: pastBookings.length,
      icon: History,
      gradient: "from-purple-500 to-violet-600",
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting}, {member.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={memberLogout}
            className="gap-2 border-amber-200/50 hover:border-amber-300 hover:bg-amber-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className={cn("h-1.5 bg-gradient-to-r", stat.gradient)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ─── Left Column: Profile Card ─── */}
          <div className="space-y-6">
            {/* Profile */}
            <Card className="border-0 shadow-sm overflow-hidden">
              {/* Gradient header */}
              <div className="h-24 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <CardContent className="pt-12 pb-4 text-center">
                <h2 className="text-xl font-bold">{member.name}</h2>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Tag className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {member.categoryAcronym || member.categoryType}
                  </span>
                </div>

                {/* Stats row in profile */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{totalUsed}</p>
                    <p className="text-[10px] text-muted-foreground">Seats<br />Booked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{uniqueEvents}</p>
                    <p className="text-[10px] text-muted-foreground">Events<br />Attended</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{upcomingBookings.length}</p>
                    <p className="text-[10px] text-muted-foreground">Upcoming<br />Events</p>
                  </div>
                </div>

                {/* Membership badge */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg py-2 px-3">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    Member since{" "}
                    <span className="font-medium text-foreground">
                      {member.memberId
                        ? `ID ${member.memberId.toString().slice(0, 2)}xxx`
                        : "N/A"}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <IdCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Member ID</p>
                    <p className="text-sm font-medium truncate">{member.memberId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Category</p>
                    <p className="text-sm font-medium truncate">{member.categoryType} ({member.categoryAcronym})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium truncate">{member.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right Column (2 cols): Quick Actions + Booking History ─── */}
          <div className="md:col-span-2 space-y-6">

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Use your member benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/member/events"
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50/50 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Ticket className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-800 text-sm">Book Free Seats</h3>
                      <p className="text-xs text-amber-600">Browse events and reserve your complimentary tickets</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-amber-500 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>

                  <Link
                    href="/member/events"
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-800 text-sm">Upcoming Events</h3>
                      <p className="text-xs text-blue-600">{upcomingBookings.length} event{upcomingBookings.length !== 1 ? "s" : ""} with free seats available</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Booking History */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Booking History
                    </CardTitle>
                    <CardDescription>
                      {totalUsed > 0
                        ? `${totalUsed} free seat${totalUsed !== 1 ? "s" : ""} booked across ${uniqueEvents} event${uniqueEvents !== 1 ? "s" : ""}`
                        : "Your free seat bookings will appear here"}
                    </CardDescription>
                  </div>
                  {eventSummaries.length > 0 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {eventSummaries.length} events
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                ) : eventSummaries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                      <Ticket className="h-8 w-8 text-amber-300" />
                    </div>
                    <p className="font-medium text-muted-foreground">No bookings yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
                      Browse events and book your first free seat
                    </p>
                    <Button asChild className="bg-amber-600 hover:bg-amber-700">
                      <Link href="/member/events">
                        <Ticket className="h-4 w-4 mr-2" />
                        Browse Events
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {eventSummaries.map((b) => {
                      const isPast = new Date(b.eventDate) < new Date();
                      const isUpcoming = new Date(b.eventDate) > new Date();
                      const isToday = format(new Date(b.eventDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                      return (
                        <Link
                          key={b.eventId}
                          href={`/confirmation/${b.bookingId}`}
                          className={cn(
                            "flex items-center gap-4 p-3.5 rounded-xl border transition-all group",
                            isPast
                              ? "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                              : "bg-white border-amber-100 hover:border-amber-300 hover:shadow-md"
                          )}
                        >
                          {/* Date badge */}
                          <div className={cn(
                            "h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0",
                            isPast
                              ? "bg-gray-50 border border-gray-100"
                              : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
                          )}>
                            <span className={cn(
                              "text-[10px] font-bold uppercase",
                              isPast ? "text-gray-400" : "text-amber-600"
                            )}>
                              {format(new Date(b.eventDate), "MMM")}
                            </span>
                            <span className={cn(
                              "text-lg font-black leading-none",
                              isPast ? "text-gray-500" : "text-amber-700"
                            )}>
                              {format(new Date(b.eventDate), "d")}
                            </span>
                          </div>

                          {/* Event info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-sm font-semibold truncate",
                                isPast ? "text-gray-600" : "text-foreground group-hover:text-amber-700 transition-colors"
                              )}>
                                {b.eventName}
                              </p>
                              {isToday && (
                                <Badge className="bg-green-500 text-white text-[9px] h-4 px-1.5 border-none shrink-0">
                                  Today
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(b.eventDate), "EEE, MMM d, yyyy")}
                              </span>
                              <span className="text-[8px] text-muted-foreground">•</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help border-b border-dotted border-muted-foreground/30">
                                        Booked {format(new Date(b.bookingDate), "MMM d")}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      {format(new Date(b.bookingDate), "MMMM d, yyyy, h:mm a")}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                            </div>
                          </div>

                          {/* Status + count */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge
                              variant={isUpcoming ? "default" : "secondary"}
                              className={cn(
                                "text-[10px] h-5 gap-1",
                                isUpcoming && "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                              )}
                            >
                              <Ticket className="h-3 w-3" />
                              {b.bookingCount} {b.bookingCount === 1 ? "seat" : "seats"}
                            </Badge>
                            <span className={cn(
                              "text-[10px] font-medium",
                              isUpcoming ? "text-amber-600" : "text-gray-400"
                            )}>
                              {isUpcoming ? "Upcoming" : isToday ? "Today!" : "Past"}
                            </span>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-amber-500 transition-colors shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Footer summary */}
                {eventSummaries.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CircleDot className="h-3 w-3 text-amber-500" />
                      <span>
                        {upcomingBookings.length} upcoming · {pastBookings.length} past
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <Crown className="h-3.5 w-3.5" />
                      {totalUsed} total free seats
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Benefits */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50/60 to-white border border-amber-200/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Your RIC Membership Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-amber-100/50">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Ticket className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Free Event Seats</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Complementary tickets for RIC members</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-amber-100/50">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Priority Access</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Reserve seats before public release</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-amber-100/50">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Easy Check-In</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Quick QR-based entry at events</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
