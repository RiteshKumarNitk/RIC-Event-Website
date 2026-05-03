"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">RIC</span>
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">RIC Jaipur</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground text-muted-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account"><User className="mr-2 h-4 w-4" />My Account</Link>
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><Settings className="mr-2 h-4 w-4" />Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}><LogOut className="mr-2 h-4 w-4" />Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>RIC Jaipur</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-6">
                  {navLinks.map(link => (
                    <Link key={link.href} href={link.href} className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t mt-4 pt-4">
                    {user ? (
                      <>
                        <Link href="/account" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                          <User className="mr-3 h-4 w-4" />My Account
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                            <Settings className="mr-3 h-4 w-4" />Admin Panel
                          </Link>
                        )}
                        <button onClick={() => logout()} className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-destructive">
                          <LogOut className="mr-3 h-4 w-4" />Sign Out
                        </button>
                      </>
                    ) : (
                      <Link href="/login" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                        Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
