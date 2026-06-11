"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings, Crown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const headerClass = cn(
    "sticky top-0 z-50 w-full transition-all duration-300",
    scrolled
      ? "border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-sm"
      : "bg-transparent border-transparent"
  );

  return (
    <header className={headerClass}>
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-8 flex items-center gap-2.5 group">
          <Image src="/ric-logo.png" alt="RIC Logo" width={100} height={100} className="object-contain group-hover:scale-105 transition-transform" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/member-login"
            className="px-3 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-500/10 transition-all duration-200 flex items-center gap-1.5"
          >
            <Crown className="h-3.5 w-3.5" />
            Member Login
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 transition-colors">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
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
                  <Link href="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />My Account
                  </Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild size="sm" variant="ghost" className="text-muted-foreground">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="font-semibold">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted/50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="p-6 pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <Image src="/ric-logo.png" alt="RIC Logo" width={28} height={28} className="object-contain" />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/member-login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-amber-500/10 text-amber-600 transition-colors"
                  >
                    <Crown className="mr-3 h-4 w-4" />Member Login
                  </Link>
                  <div className="border-t my-2" />
                  {user ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                      >
                        <User className="mr-3 h-4 w-4" />My Account
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                        >
                          <Settings className="mr-3 h-4 w-4" />Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
