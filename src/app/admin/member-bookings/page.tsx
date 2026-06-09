"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Users, Ticket, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useEvents } from "@/app/admin/events/events-provider";
import { getAdminMemberBookings, getMemberBookingStats, type MemberBookingRecord } from "@/app/actions/admin-member-bookings-actions";

export default function AdminMemberBookingsPage() {
  const { events, loading: eventsLoading } = useEvents();
  const [records, setRecords] = useState<MemberBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [stats, setStats] = useState({ totalBookings: 0, totalFreeSeats: 0, uniqueMembers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [recordsRes, statsRes] = await Promise.all([
        getAdminMemberBookings(selectedEvent !== "all" ? selectedEvent : undefined),
        getMemberBookingStats(),
      ]);
      if (recordsRes.success) setRecords(recordsRes.records);
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      setLoading(false);
    };
    fetchData();
  }, [selectedEvent]);

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

      {/* Event filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={selectedEvent === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedEvent("all")}
          className="shrink-0"
        >
          All Events
        </Button>
        {events.map((e) => (
          <Button
            key={e.id}
            variant={selectedEvent === e.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedEvent(e.id)}
            className="shrink-0"
          >
            {e.name}
          </Button>
        ))}
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
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No member bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
