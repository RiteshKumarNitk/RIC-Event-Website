"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Users, Ticket, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvents } from "@/app/admin/events/events-provider";
import { getAdminMemberBookings, getMemberBookingStats, type MemberBookingRecord } from "@/app/actions/admin-member-bookings-actions";

export default function AdminMemberBookingsPage() {
  const { events, loading: eventsLoading } = useEvents();
  const [records, setRecords] = useState<MemberBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");
  const [stats, setStats] = useState({ totalBookings: 0, totalFreeSeats: 0, uniqueMembers: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const options = {
        eventId: selectedEvent !== "all" ? selectedEvent : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        timeFilter,
      };
      const [recordsRes, statsRes] = await Promise.all([
        getAdminMemberBookings(options),
        getMemberBookingStats(options),
      ]);
      if (recordsRes.success && recordsRes.records) {
        setRecords(recordsRes.records);
        setCurrentPage(1);
      }
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      setLoading(false);
    };
    fetchData();
  }, [selectedEvent, selectedCategory, timeFilter]);

  const totalPages = Math.ceil(records.length / itemsPerPage);
  const paginatedRecords = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-7 w-7 text-amber-500" />
            Member Bookings
          </h1>
          <p className="text-muted-foreground mt-1">
            All free member bookings across events
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12 inline-block" /> : stats.totalBookings}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12 inline-block" /> : stats.totalFreeSeats}</p>
                <p className="text-xs text-muted-foreground">Free Seats Booked</p>
              </div>
              <Ticket className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12 inline-block" /> : stats.uniqueMembers}</p>
                <p className="text-xs text-muted-foreground">Unique Members</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">₹0</p>
                <p className="text-xs text-muted-foreground">Revenue (Free Benefit)</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={timeFilter} onValueChange={(val: any) => setTimeFilter(val)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[280px] max-w-full">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            {records.length} member booking{records.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Event Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No member bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((r) => (
                  <TableRow key={r.bookingId}>
                    <TableCell className="font-medium">{r.memberName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {r.memberId}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.eventName}</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {r.seatCount} {r.seatCount === 1 ? "seat" : "seats"} free
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(r.bookingDate), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(r.eventDate), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <p>
                  Showing {records.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, records.length)} of {records.length}
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
