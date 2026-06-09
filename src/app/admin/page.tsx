"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, Users, Calendar, Database, AlertTriangle, Ticket, TrendingUp, Shield, QrCode, IndianRupee, Crown } from "lucide-react";
import { useEvents } from "./events/events-provider";
import { useMembers } from "./members/members-provider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getAdminStats } from "@/app/actions/booking-actions";
import { seedDefaultAdmin } from "@/app/actions/admin-actions";
import { getMemberBookingStats } from "@/app/actions/admin-member-bookings-actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32 mt-1" />
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { seedDatabase, events, deleteAllEvents, loading: eventsLoading } = useEvents();
  const { members, loading: membersLoading } = useMembers();
  const { toast } = useToast();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [seedingAdmin, setSeedingAdmin] = useState(false);
  const [memberBookingStats, setMemberBookingStats] = useState({ totalFreeSeats: 0, uniqueMembers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [statsRes, memberRes] = await Promise.all([
          getAdminStats(),
          getMemberBookingStats(),
        ]);
        if (statsRes.success && statsRes.stats) {
          setTotalRevenue(statsRes.stats.totalRevenue);
          setTotalUsers(statsRes.stats.totalUsers);
          setTotalBookings(statsRes.stats.totalBookings);
        }
        if (memberRes.success && memberRes.stats) {
          setMemberBookingStats(memberRes.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [events]);

  const upcomingEvents = events.filter(e => new Date(e.date) > new Date());
  const isLoading = loadingStats || eventsLoading;

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, desc: "Across all events", icon: DollarSign, color: "text-green-500" },
    { title: "Registered Users", value: totalUsers.toString(), desc: "Total accounts", icon: Users, color: "text-blue-500" },        {title: "Total Events", value: events.length.toString(), desc: `${upcomingEvents.length} upcoming`, icon: Calendar, color: "text-purple-500" },
    { title: "Members", value: members.length.toString(), desc: "Registered members", icon: Ticket, color: "text-amber-500" },
    { title: "Member Bookings", value: memberBookingStats.totalFreeSeats.toString(), desc: `${memberBookingStats.uniqueMembers} members used`, icon: Crown, color: "text-amber-500" },
  ];

  const handleClearAndReseed = async () => {
    await deleteAllEvents();
    await seedDatabase();
  };

  const handleSeedAdmin = async () => {
    setSeedingAdmin(true);
    const res = await seedDefaultAdmin();
    if (res.success) {
      toast({ title: "Admin Account", description: res.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error || "Failed to seed admin." });
    }
    setSeedingAdmin(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/events/create">+ New Event</Link></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next 5 scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.venue}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">No upcoming events</p>
                <Button asChild className="mt-4" variant="outline" size="sm"><Link href="/admin/events/create">Create Event</Link></Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link href="/admin/events">View All Events <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/admin/events">Manage Events <ChevronRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/admin/members">Manage Members <ChevronRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/admin/users">Manage Users <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/admin/checkin">QR Check-In <QrCode className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/admin/transactions">Transactions <IndianRupee className="h-4 w-4" /></Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  <Shield className="mr-2 h-4 w-4" />
                  {seedingAdmin ? "Creating..." : "Setup Default Admin"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create Default Admin</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create an admin account with email <strong>admin@ric.com</strong> and password <strong>admin123</strong>. Use this to log in at /login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSeedAdmin} disabled={seedingAdmin}>Create Admin</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  <Database className="mr-2 h-4 w-4" />
                  Seed Sample Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Seed Database</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will add sample events if the database is empty. Existing data won't be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={seedDatabase}>Seed Data</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="sm">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Clear & Reseed Events
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all events and replace them with sample data. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAndReseed}>Yes, clear and reseed</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
