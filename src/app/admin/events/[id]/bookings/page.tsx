
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventBookings } from '@/app/actions/booking-actions';
import type { Booking, Attendee } from '@/lib/types';
import { useEvents } from '../../events-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Ticket, DollarSign, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EnrichedBooking extends Booking {
  userDisplayName?: string;
  userEmail?: string;
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16" />
            </CardContent>
        </Card>
    )
}

export default function EventBookingsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { events, loading: eventsLoading } = useEvents();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const event = events.find(e => e.id === eventId);
  
  const totalRevenue = bookings.reduce((acc, booking) => acc + booking.total, 0);
  const totalSeatsSold = bookings.reduce((acc, booking) => acc + booking.attendees.length, 0);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!eventId) return;
      setLoading(true);

      try {
         const res = await getEventBookings(eventId);
        if (res.success && res.bookings) {
             const bookingsData = res.bookings.map(data => ({
              ...data,
              eventDate: data.eventDate.toISOString(),
              bookingDate: data.bookingDate.toISOString(),
              attendees: data.attendees as Attendee[],
              userDisplayName: (data as any).user?.name,
              userEmail: (data as any).user?.email,
            })) as EnrichedBooking[];
            setBookings(bookingsData);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [eventId]);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  if (eventsLoading) return (
     <div>
        <Skeleton className="h-10 w-40 mb-4" />
        <div className="mb-8 text-center">
            <Skeleton className="h-9 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-5 w-2/3 mx-auto" />
        </div>
         <div className="grid gap-4 md:grid-cols-3 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-7 w-40" /></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booked By</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>Total Paid</TableHead>
                            <TableHead>Booking Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">Loading event details...</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )

  return (
    <div>
        <div className="mb-4 flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/admin/events">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Events
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href={`/admin/events/${eventId}/seats-control`}>
                    <Shield className="mr-2 h-4 w-4" />
                    Manage Seats
                </Link>
            </Button>
        </div>
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Bookings for {event?.name || 'Event'}</h1>
            <p className="text-muted-foreground">A summary of all bookings for this event.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{totalSeatsSold}</div>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{bookings.length}</div>}
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Individual Bookings</CardTitle>
                <CardDescription>A detailed list of all users who have booked tickets for this event.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booked By</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>Total Paid</TableHead>
                            <TableHead>Booking Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                </TableRow>
                            ))
                        ) : paginatedBookings.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center">No bookings found for this event.</TableCell>
                            </TableRow>
                        ) : (
                            paginatedBookings.map(booking => (
                                <TableRow key={booking.id}>
                                    <TableCell>{booking.userDisplayName || 'N/A'}</TableCell>
                                    <TableCell>{booking.userEmail || 'N/A'}</TableCell>
                                    <TableCell>{booking.attendees.map(a => `${a.seatId.split('-')[0].charAt(0)}-${a.seatId.split('-')[1]}` || 'GA').join(', ')}</TableCell>
                                    <TableCell>₹{booking.total.toFixed(2)}</TableCell>
                                    <TableCell>{new Date(booking.bookingDate).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {!loading && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <p>
                        Showing {bookings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, bookings.length)} of {bookings.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">Rows per page:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                        >
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder="10" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4 mr-1" />Prev
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) page = i + 1;
                        else if (currentPage <= 3) page = i + 1;
                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                        else page = currentPage - 2 + i;
                        return (
                          <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(page)}>
                            {page}
                          </Button>
                        );
                      })}
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                        Next<ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
