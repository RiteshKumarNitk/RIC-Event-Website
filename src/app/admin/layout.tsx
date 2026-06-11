"use client"

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarContent, SidebarInset, SidebarFooter } from "@/components/ui/sidebar";
import { Home, Calendar, Users, ShieldAlert, BadgePercent, LogOut, LayoutGrid, Newspaper, QrCode, IndianRupee, ReceiptText, Bookmark, Crown } from "lucide-react";
import Link from "next/link";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MembersProvider } from "./members/members-provider";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/admin");
    }
  }, [user, loading, router]);

  const isActive = (path: string) => {
    return pathname.startsWith(path) && (pathname === path || path !== '/admin');
  };

  if (loading || !user) {
    return <div className="container text-center py-12">Loading admin dashboard...</div>;
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="mt-4">Not Authorized</CardTitle>
            <CardDescription>
              You do not have permission to access this page. Please sign in with an admin account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login?redirect=/admin">Login as Admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Image src="/ric-logo.png" alt="RIC Logo" width={40} height={40} className="object-contain" />

            <h1 className="font-semibold text-xl">Admin Panel</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/admin" passHref>
                <SidebarMenuButton isActive={pathname === '/admin'}>
                  <Home />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/events" passHref>
                <SidebarMenuButton isActive={isActive('/admin/events')}>
                  <Calendar />
                  <span>Events</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/admin/members" passHref>
                <SidebarMenuButton isActive={isActive('/admin/members')}>
                  <BadgePercent />
                  <span>Members</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/users" passHref>
                <SidebarMenuButton isActive={isActive('/admin/users')}>
                  <Users />
                  <span>Users</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/transactions" passHref>
                <SidebarMenuButton isActive={isActive('/admin/transactions')}>
                  <IndianRupee />
                  <span>Transactions</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/reservations" passHref>
                <SidebarMenuButton isActive={isActive('/admin/reservations')}>
                  <Bookmark />
                  <span>Reservations</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/member-bookings" passHref>
                <SidebarMenuButton isActive={isActive('/admin/member-bookings')}>
                  <Crown />
                  <span>Member Bookings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/checkin" passHref>
                <SidebarMenuButton isActive={isActive('/admin/checkin')}>
                  <QrCode />
                  <span>Check-In</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/fees" passHref>
                <SidebarMenuButton isActive={isActive('/admin/fees')}>
                  <ReceiptText />
                  <span>Fees & Taxes</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/admin/site-content" passHref>
                <SidebarMenuButton isActive={isActive('/admin/site-content')}>
                  <Newspaper />
                  <span>Home Page</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton>
                  <ShieldAlert />
                  <span>View Site</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => logout()}>
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          <ErrorBoundary fallbackTitle="Members Unavailable" fallbackDescription="Could not load members. Please try again later.">
            <MembersProvider>
              {children}
            </MembersProvider>
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
