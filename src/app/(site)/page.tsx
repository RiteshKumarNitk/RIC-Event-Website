"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { EventCard } from "@/components/events/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clapperboard, Lightbulb, Users, Calendar, Music, Award, MapPin, ChevronRight, Star, Ticket, CalendarDays, ChevronLeft } from "lucide-react";
import { useEvents } from "@/app/admin/events/events-provider";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";
import { AnimatedHero } from "@/components/events/animated-hero";

function AnimatedCounter({ target, label, icon: Icon }: { target: number; label: string; icon: any }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <span className="text-3xl font-bold tabular-nums">{count}+</span>
      <span className="text-sm text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function LatestEventsSlider({ events }: { events: Event[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (events.length === 0) return null;

  return (
    <div className="relative">
      {/* Navigation arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-12 w-12 rounded-full bg-background/90 backdrop-blur-sm border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-12 w-12 rounded-full bg-background/90 backdrop-blur-sm border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Fade edges */}
      {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />}
      {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
        role="region"
        aria-label="Latest Events"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") scroll("left");
          if (e.key === "ArrowRight") scroll("right");
        }}
      >
        {events.map((event, i) => (
          <div key={event.id} className="flex-none w-[350px] md:w-[420px]">
            <EventCard event={event} variant="featured" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { events, loading } = useEvents();
  const upcomingEvents = events
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const featuredEvents = upcomingEvents.slice(0, 5);
  const latestEvents = upcomingEvents.slice(0, 8);

  return (
    <>
      {/* Hero Section - Animated with Framer Motion */}
      <AnimatedHero events={upcomingEvents} loading={loading} />

      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <section className="py-16 -mt-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <AnimatedCounter target={500} label="Events Hosted" icon={Calendar} />
            <AnimatedCounter target={50} label="Visitors Yearly" icon={Users} />
            <AnimatedCounter target={200} label="Artists Featured" icon={Music} />
            <AnimatedCounter target={15} label="Awards Won" icon={Award} />
          </div>
        </section>

        {/* Latest Events - Horizontal Slider */}
        <FadeIn>
          <section className="py-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <Badge variant="outline" className="mb-3 gap-1.5">
                  <CalendarDays className="h-3 w-3" />
                  What&apos;s Next
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Latest Events</h2>
                <p className="text-muted-foreground mt-2">Swipe to discover our newest experiences</p>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link href="/events">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {loading ? (
              <div className="flex gap-5 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-none w-[350px] md:w-[420px]">
                    <div className="rounded-2xl overflow-hidden bg-muted animate-pulse">
                      <div className="aspect-[4/3] bg-muted-foreground/10" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                        <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : latestEvents.length > 0 ? (
              <LatestEventsSlider events={latestEvents} />
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground max-w-sm">Check back soon for new experiences.</p>
                  <Button asChild variant="outline" className="mt-6">
                    <Link href="/about">Learn About RIC</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            <div className="sm:hidden mt-6 text-center">
              <Button asChild variant="outline">
                <Link href="/events">View All Events <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </section>
        </FadeIn>

        {/* About Section */}
        <FadeIn>
          <section className="py-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 gap-1.5">
                <Star className="h-3 w-3" />
                About RIC
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                A Hub of Culture, Knowledge & Diplomacy
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The Rajasthan International Centre is a world-class institution designed to be the epicenter of cultural exchange, intellectual dialogue, and social engagement in Rajasthan.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Clapperboard, title: "Culture & Arts", desc: "Immerse yourself in diverse cultural performances, art exhibitions, and film screenings showcasing local and global talent.", color: "from-violet-500/10 to-violet-500/5" },
                { icon: Lightbulb, title: "Knowledge & Ideas", desc: "Engage in thought-provoking seminars, talks, and conferences featuring leading experts from various fields.", color: "from-amber-500/10 to-amber-500/5" },
                { icon: Users, title: "Community & Networking", desc: "Connect with like-minded individuals and professionals in a dynamic environment built for collaboration.", color: "from-emerald-500/10 to-emerald-500/5" },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 150}>
                  <div className={cn("group p-8 rounded-2xl bg-gradient-to-b border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full", item.color)}>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* Venues Section */}
        <FadeIn>
          <section className="py-16">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Venues</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Explore Our Spaces</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Main Auditorium", desc: "State-of-the-art acoustics and seating for large-scale performances", img: "venue1" },
                { title: "Conference Halls", desc: "Flexible spaces equipped with the latest technology for meetings", img: "venue2" },
                { title: "Art Gallery", desc: "A modern space to exhibit art from local and international artists", img: "venue3" },
              ].map((venue, i) => (
                <FadeIn key={i} delay={i * 150}>
                  <Link href="/about" className="group block">
                    <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
                      <Image
                        src={`https://picsum.photos/seed/${venue.img}/600/400`}
                        alt={venue.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-xl font-semibold text-white mb-1">{venue.title}</h3>
                        <p className="text-sm text-white/70">{venue.desc}</p>
                        <div className="flex items-center gap-1 mt-3 text-sm text-white/60 group-hover:text-white transition-colors">
                          Learn more <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* CTA Section */}
        <FadeIn>
          <section className="py-16 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <CardContent className="p-12 text-center relative">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Visit Us</h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                  Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004
                </p>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href="/contact">
                    Get Directions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </FadeIn>
      </div>
    </>
  );
}
