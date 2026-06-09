"use client"

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarContent, SidebarInset, SidebarFooter } from "@/components/ui/sidebar";
import { Home, Calendar, Users, ShieldAlert, BadgePercent, LogOut, LayoutGrid, Newspaper, QrCode, IndianRupee, ReceiptText, Bookmark, Crown } from "lucide-react";
import Link from "next/link";
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
                <SidebarTrigger />
                <svg className="h-8 w-8 text-primary" viewBox="0 0 214 214" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M107 214C166.11 214 214 166.11 214 107C214 47.8903 166.11 0 107 0C47.8903 0 0 47.8903 0 107C0 166.11 47.8903 214 107 214Z" fill="currentColor"/>
                  <path d="M106.999 187.25C151.102 187.25 187.249 151.103 187.249 107C187.249 62.8971 151.102 26.75 106.999 26.75C62.8962 26.75 26.749 62.8971 26.749 107C26.749 151.103 62.8962 187.25 106.999 187.25Z" fill="white"/>
                  <path d="M107 167.75C140.692 167.75 167.75 140.692 167.75 107C167.75 73.3076 140.692 46.25 107 46.25C73.3076 46.25 46.25 73.3076 46.25 107C46.25 140.692 73.3076 167.75 107 167.75Z" fill="currentColor"/>
                </svg>
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
                  <Link href="/admin/halls" passHref>
                    <SidebarMenuButton isActive={isActive('/admin/halls')}>
                      <LayoutGrid />
                      <span>Hall Manager</span>
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
            <div className="p-4 md:p-8">
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
