"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useEvents } from "@/app/admin/events/events-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Crown,
  LogOut,
  Search,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { getMemberEventBookings, type MemberEventBookingSummary } from "@/app/actions/member-bookings-action";

function EventsSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-12 space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function MemberEventsPage() {
  const { member, loading: memberLoading, memberLogout } = useMemberAuth();
  const { events, loading: eventsLoading } = useEvents();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [memberBookings, setMemberBookings] = useState<MemberEventBookingSummary[]>([]);

  // Fetch member's booking history
  useEffect(() => {
    if (member) {
      getMemberEventBookings().then((res) => {
        if (res.success && res.bookings) {
          setMemberBookings(res.bookings);
        }
      });
    }
  }, [member]);

  // Build a lookup: eventId -> booking summary
  const bookingMap = useMemo(() => {
    const map = new Map<string, MemberEventBookingSummary>();
    for (const b of memberBookings) {
      // Keep the most recent booking per event
      const existing = map.get(b.eventId);
      if (!existing || new Date(b.bookingDate) > new Date(existing.bookingDate)) {
        map.set(b.eventId, b);
      }
    }
    return map;
  }, [memberBookings]);

  // Redirect if not logged in
  useEffect(() => {
    if (!memberLoading && !member) {
      router.push("/member-login?redirect=/member/events");
    }
  }, [member, memberLoading, router]);

  // Filter to only upcoming events
  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => new Date(e.date) > new Date())
      .filter((e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchTerm]);

  if (memberLoading || eventsLoading) return <EventsSkeleton />;
  if (!member) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/member/dashboard")}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Crown className="h-7 w-7 text-amber-500" />
                Member Booking
              </h1>
              <p className="text-sm text-muted-foreground">
                Book free seats as a RIC member — welcome, {member.name}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={memberLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9 h-11 bg-white border-amber-200/50 focus-visible:border-amber-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Events Grid */}
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => {
              const minPrice = event.ticketTypes.length > 0
                ? Math.min(...event.ticketTypes.map((t) => t.price))
                : 0;

              const bookingInfo = bookingMap.get(event.id);
              return (
                <Link
                  key={event.id}
                  href={`/member/events/${event.id}`}
                  className="group block"
                >
                  <Card className="h-full overflow-hidden border-amber-200/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 bg-white">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={event.image}
                        alt={event.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {bookingInfo && (
                        <div className="absolute inset-0 bg-blue-900/20 backdrop-brightness-75" />
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge className="bg-amber-500 text-white border-none text-[10px] px-2 py-0.5">
                          {event.category}
                        </Badge>
                        {bookingInfo ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-500 text-white border-none text-[10px] px-2 py-0.5"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-0.5 inline" />
                            Booked
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-green-500 text-white border-none text-[10px] px-2 py-0.5"
                          >
                            Free for Members
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white text-sm leading-tight drop-shadow-lg">
                          {event.name}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {format(new Date(event.date), "EEE, MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      {event.showtimes?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {event.showtimes.join(", ")}
                          </span>
                        </div>
                      )}
                      {bookingInfo && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md -mx-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dotted border-blue-400/40">
                                  Booked {format(new Date(bookingInfo.bookingDate), "MMM d, h:mm a")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {format(new Date(bookingInfo.bookingDate), "MMMM d, yyyy, h:mm:ss a")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      <div className="pt-2 flex items-center justify-between border-t border-amber-100 mt-2">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Crown className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">FREE</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 group-hover:text-amber-700 transition-colors">
                          <Ticket className="h-3.5 w-3.5" />
                          {bookingInfo ? "Book Again" : "Book Seats"}
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Crown className="h-12 w-12 mx-auto mb-4 text-amber-300" />
            <h3 className="text-lg font-semibold">No upcoming events</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm
                ? "No events match your search. Try a different term."
                : "There are no upcoming events available for booking right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
