"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Users, Calendar, Database, AlertTriangle, Ticket, TrendingUp, Shield,
  QrCode, IndianRupee, Crown, ArrowUpRight, Landmark, Bookmark, LayoutGrid,
  ReceiptText, Newspaper, ChevronRight,
  Sparkles, Clock, MapPin, AlertCircle
} from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getBookingsChartData, type MonthlyBookingData } from "@/app/actions/chart-actions";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-36 mt-1.5" />
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { seedDatabase, events, deleteAllEvents, loading: eventsLoading } = useEvents();
  const { members } = useMembers();
  const { user } = useAuth();
  const { toast } = useToast();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [seedingAdmin, setSeedingAdmin] = useState(false);
  const [memberBookingStats, setMemberBookingStats] = useState({ totalFreeSeats: 0, uniqueMembers: 0 });
  const [chartData, setChartData] = useState<MonthlyBookingData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Fetch stats and chart data on mount and when events change
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingStats(true);
      setChartLoading(true);
      try {
        const [statsRes, memberRes, chartRes] = await Promise.all([
          getAdminStats(),
          getMemberBookingStats(),
          getBookingsChartData(),
        ]);
        if (statsRes.success && statsRes.stats) {
          setTotalRevenue(statsRes.stats.totalRevenue);
          setTotalUsers(statsRes.stats.totalUsers);
          setTotalBookings(statsRes.stats.totalBookings);
        }
        if (memberRes.success && memberRes.stats) {
          setMemberBookingStats(memberRes.stats);
        }
        if (chartRes.success && chartRes.data) {
          setChartData(chartRes.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
        setChartLoading(false);
      }
    };
    fetchAll();
  }, [events]);



  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const isLoading = loadingStats || eventsLoading;

  // ─── Stats cards with gradient accents ───
  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      desc: `${totalBookings} bookings across all events`,
      icon: IndianRupee,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Registered Users",
      value: totalUsers.toString(),
      desc: "Active platform accounts",
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Events",
      value: events.length.toString(),
      desc: `${upcomingEvents.length} upcoming · ${events.length - upcomingEvents.length} past`,
      icon: Calendar,
      gradient: "from-purple-500 to-violet-600",
      bgLight: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "RIC Members",
      value: members.length.toString(),
      desc: `Registered members`,
      icon: Crown,
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Free Member Seats",
      value: memberBookingStats.totalFreeSeats.toString(),
      desc: `${memberBookingStats.uniqueMembers} members used`,
      icon: Ticket,
      gradient: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  ];

  // ─── Quick action links ───
  const quickActions = [
    { label: "Create Event", href: "/admin/events/create", icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Manage Events", href: "/admin/events", icon: LayoutGrid, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Manage Members", href: "/admin/members", icon: Crown, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Manage Users", href: "/admin/users", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "QR Check-In", href: "/admin/checkin", icon: QrCode, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Transactions", href: "/admin/transactions", icon: IndianRupee, color: "text-cyan-600", bg: "bg-cyan-100" },
    { label: "Reservations", href: "/admin/reservations", icon: Bookmark, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Member Bookings", href: "/admin/member-bookings", icon: Ticket, color: "text-rose-600", bg: "bg-rose-100" },
    { label: "Fees & Taxes", href: "/admin/fees", icon: ReceiptText, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Hall Manager", href: "/admin/halls", icon: Landmark, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Home Page", href: "/admin/site-content", icon: Newspaper, color: "text-violet-600", bg: "bg-violet-100" },
    { label: "View Site", href: "/", icon: ArrowUpRight, color: "text-gray-600", bg: "bg-gray-100" },
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting}, {user?.name?.split(" ")[0] || "Admin"}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="default" className="shadow-md shadow-primary/20 gap-2">
            <Link href="/admin/events/create">
              <Calendar className="h-4 w-4" />
              New Event
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats.map((stat, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
              {/* Gradient top bar */}
              <div className={cn("h-1.5 bg-gradient-to-r", stat.gradient)} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground">{stat.title}</CardTitle>
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.iconBg)}>
                  <stat.icon className={cn("h-4.5 w-4.5", stat.iconColor)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left: Upcoming Events ─── */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Next scheduled events at a glance</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                {upcomingEvents.length} upcoming
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-1">
                {upcomingEvents.slice(0, 6).map((event, i) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}/bookings`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                  >
                    {/* Date badge */}
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center shrink-0 border border-primary/10">
                      <span className="text-[10px] font-bold uppercase text-primary/70">
                        {format(new Date(event.date), "MMM")}
                      </span>
                      <span className="text-lg font-black leading-none text-primary">
                        {format(new Date(event.date), "d")}
                      </span>
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {event.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {event.showtimes?.[0] || "TBD"}
                        </span>
                      </div>
                    </div>

                    {/* Category badge */}
                    <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">
                      {event.category}
                    </Badge>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-medium text-muted-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Create your first event to get started</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/admin/events/create">Create Event</Link>
                </Button>
              </div>
            )}
          </CardContent>
          {upcomingEvents.length > 0 && (
            <CardFooter className="pt-0">
              <Button asChild variant="ghost" size="sm" className="ml-auto gap-1">
                <Link href="/admin/events">
                  View all events <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* ─── Right: Quick Actions ─── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used admin tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-transparent hover:border-border hover:bg-accent/50 transition-all group text-center"
                >
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200", action.bg)}>
                    <action.icon className={cn("h-4.5 w-4.5", action.color)} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 pt-0 border-t mt-2">
            {/* Seed & Danger zone */}
            <div className="w-full pt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground/60 tracking-wider">Database Tools</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                    <Shield className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    {seedingAdmin ? "Creating..." : "Setup Default Admin"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create Default Admin</AlertDialogTitle>
                    <AlertDialogDescription>
                      Creates admin: <strong>admin@ric.com</strong> / <strong>admin123</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSeedAdmin} disabled={seedingAdmin}>Create</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                    <Database className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    Seed Sample Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Seed Database</AlertDialogTitle>
                    <AlertDialogDescription>Add sample events if the database is empty.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={seedDatabase}>Seed</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                    Clear & Reseed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Clear and reseed?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all events and replace them with sample data. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAndReseed} className="bg-destructive hover:bg-destructive/90">Clear & Reseed</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* ─── Chart: Bookings Over Time ─── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Bookings Overview
              </CardTitle>
              <CardDescription>Monthly bookings, revenue, and member activity over the last 12 months</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-[#2563eb]" />
                Paid Seats
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-[#f59e0b]" />
                Free (Member)
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chartData.length === 0 || chartData.every(d => d.bookings === 0) ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No booking data yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Bookings will appear here once users start booking events.</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey={(d) => `${d.month} ${d.year}`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const labels: Record<string, string> = {
                            paidSeats: "Paid Tickets",
                            freeSeats: "Free (Member)",
                            revenue: "Revenue",
                            bookings: "Total Bookings",
                          };
                          const numValue = Number(value);
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{labels[name as string] || name}:</span>
                              <span className="font-bold">
                                {name === "revenue" ? `₹${numValue.toLocaleString()}` : numValue}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="paidSeats"
                    name="paidSeats"
                    fill="#2563eb"
                    radius={[3, 3, 0, 0]}
                    stackId="seats"
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="freeSeats"
                    name="freeSeats"
                    fill="#f59e0b"
                    radius={[3, 3, 0, 0]}
                    stackId="seats"
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Bottom: Overview Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: totalBookings, icon: Ticket, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Members Used", value: memberBookingStats.uniqueMembers, icon: Crown, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Free Seats Given", value: memberBookingStats.totalFreeSeats, icon: Ticket, color: "text-rose-600", bg: "bg-rose-100" },
          { label: "Avg. Revenue/Event", value: events.length > 0 ? `₹${Math.round(totalRevenue / events.length).toLocaleString()}` : "₹0", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
        ].map((item, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
