"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/app/admin/events/events-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Booking, Event } from "@/lib/types";
import { getUserBookings } from "@/app/actions/booking-actions";
import { cancelBooking } from "@/app/actions/cancel-actions";
import { getLinkedMember } from "@/app/actions/member-link-actions";
import { BookingDetailsDialog } from "@/components/account/booking-details-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Ticket, Clock, ChevronRight, XCircle, Crown, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [registeredBookings, setRegisteredBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Member linking state
  const [linkedMember, setLinkedMember] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      const redirectPath = redirect ? `?redirect=${redirect}` : '';
      router.push(`/login${redirectPath}`);
    }
  }, [user, loading, router, redirect]);

  // Fetch bookings + linked member
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const userId = (user as any).uid || (user as any).id;

      // Fetch bookings
      setBookingsLoading(true);
      try {
        const res = await getUserBookings(userId);
        if (res.success && res.bookings) {
          const bookingsData = res.bookings.map(data => ({
            ...data,
            eventDate: data.eventDate.toISOString(),
            bookingDate: data.bookingDate.toISOString(),
          })) as Booking[];
          setRegisteredBookings(bookingsData);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setBookingsLoading(false);
      }

      // Fetch linked member
      const memberRes = await getLinkedMember(userId);
      if (memberRes.success && memberRes.member) {
        setLinkedMember(memberRes.member);
      }
    };

    if (user) fetchData();
  }, [user]);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const getEventForBooking = (booking: Booking): Event | undefined => {
    return events.find(event => event.id === booking.eventId);
  };

  const getAttendeeCount = (booking: Booking) => {
    const attendees = booking.attendees as any[];
    return Array.isArray(attendees) ? attendees.length : 0;
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const res = await cancelBooking(bookingId);
    if (res.success) {
      toast({ title: "Cancelled", description: "Booking cancelled successfully." });
      setRegisteredBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error || "Failed to cancel." });
    }
    setCancellingId(null);
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (loading || !user) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <Skeleton className="h-9 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-20 mb-2" />
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div>
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card><CardContent className="py-8"><Skeleton className="h-4 w-full mb-3" /><Skeleton className="h-4 w-3/4 mb-3" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{user.name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-2">
                    {user.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
                <Separator className="my-4" />

                {/* RIC Member Section */}
                <div className="mb-4">
                  {linkedMember ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <Crown className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-amber-800">{linkedMember.name}</p>
                      <p className="text-xs text-amber-600">Member ID: {linkedMember.memberId}</p>
                      <Badge variant="outline" className="mt-1 text-amber-600 border-amber-300 bg-amber-100/50 text-xs">
                        {linkedMember.categoryAcronym || "RIC Member"}
                      </Badge>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full gap-2 border-amber-200 text-amber-700 hover:bg-amber-50" asChild>
                      <Link href="/member-login?redirect=/account">
                        <Crown className="h-4 w-4" /> Link Member Account
                      </Link>
                    </Button>
                  )}
                </div>

                <Button variant="outline" className="w-full" onClick={() => user.role === 'ADMIN' && router.push('/admin')}>
                  {user.role === 'ADMIN' ? 'Admin Panel' : 'Upgrade to Admin'}
                </Button>
                <Button variant="ghost" className="w-full mt-2 text-destructive hover:text-destructive" onClick={logout}>
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Bookings</CardTitle>
                    <CardDescription>Events you have registered for</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{registeredBookings.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading || eventsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div>
                        <Skeleton className="h-9 w-28" />
                      </div>
                    ))}
                  </div>
                ) : registeredBookings.length > 0 ? (
                  <div className="space-y-3">
                    {registeredBookings.map(booking => {
                      const event = getEventForBooking(booking);
                      const attendees = getAttendeeCount(booking);
                      const isPast = new Date(booking.eventDate) < new Date();
                      return (
                        <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 rounded-lg p-3 text-center min-w-[60px]">
                              <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                              <span className="text-xs font-medium">{format(new Date(booking.eventDate), "dd MMM")}</span>
                            </div>
                            <div>
                              <p className="font-semibold">{booking.eventName}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Ticket className="h-3 w-3" />{attendees} ticket{attendees !== 1 ? 's' : ''}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />${booking.total}</span>
                                {isPast && <Badge variant="outline" className="text-xs">Past</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isPast && (
                              <Button variant="ghost" size="sm" onClick={() => handleCancel(booking.id)} disabled={cancellingId === booking.id} className="text-destructive hover:text-destructive gap-1">
                                {cancellingId === booking.id ? <Skeleton className="h-3 w-3" /> : <XCircle className="h-3.5 w-3.5" />}
                                Cancel
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleViewBooking(booking)} disabled={!event} className="gap-1">
                              View Details <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="font-semibold">No bookings yet</h3>
                    <p className="text-muted-foreground mt-1 mb-4">Browse events and book your first experience</p>
                    <Button asChild onClick={() => router.push('/events')}>Explore Events</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {selectedBooking && (
        <BookingDetailsDialog
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          booking={selectedBooking}
          event={getEventForBooking(selectedBooking)}
        />
      )}

      {/* Member linking moved to /member-login */}
    </>
  );
}
