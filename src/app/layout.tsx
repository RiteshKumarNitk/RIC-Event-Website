import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { EventsProvider } from "@/app/admin/events/events-provider";
import { MemberAuthProvider } from "@/hooks/use-member-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import { ScrollToTop } from "@/components/scroll-to-top";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rajasthan International Center",
  description: "Premier events at the heart of Rajasthan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider>
            <ErrorBoundary fallbackTitle="Events Unavailable" fallbackDescription="Could not load events. Please try again later.">
              <EventsProvider>
                <MemberAuthProvider>
                  <ScrollToTop />
                  {children}
                  <Toaster />
                </MemberAuthProvider>
              </EventsProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
