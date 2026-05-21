"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { EventCard } from "@/components/events/event-card";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useEvents } from "@/app/admin/events/events-provider";
import { getSiteContent, type SiteContentSection } from "@/app/actions/site-content-actions";
import {
  Calendar, Music, Award, MapPin, ArrowRight,
  Clapperboard, Lightbulb, Users, ChevronRight,
  Sparkles, TrendingUp, Shield, Star, Handshake
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/ui/countdown-timer";

const ICON_MAP: Record<string, any> = {
  Calendar, Music, Award, MapPin,
  Clapperboard, Lightbulb, Users,
};

function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

const CATEGORIES = ["All", "Music", "Cultural", "Art", "Theater", "Seminar", "Talk"];

export default function Home() {
  const { events, loading } = useEvents();
  const [siteContent, setSiteContent] = useState<Record<string, SiteContentSection>>({});
  const [contentLoading, setContentLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetch = async () => {
      const res = await getSiteContent();
      if (res.success) setSiteContent(res.data);
      setContentLoading(false);
    };
    fetch();
  }, []);

  const upcomingEvents = events
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredEvents = selectedCategory === "All"
    ? upcomingEvents
    : upcomingEvents.filter(e => e.category === selectedCategory);

  const featuredEvents = upcomingEvents.slice(0, 8);
  const nextEvent = upcomingEvents[0];

  const hero = siteContent.hero?.content ?? {};
  const stats = siteContent.stats?.content?.items ?? [];
  const aboutContent = siteContent.about?.content ?? {};
  const venuesContent = siteContent.venues?.content ?? {};
  const ctaContent = siteContent.cta?.content ?? {};

  const heroTitle = siteContent.hero?.title ?? "Rajasthan International Center";
  const heroSubtitle = siteContent.hero?.subtitle ?? "Where culture, knowledge, and community converge in the heart of Jaipur";

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center bg-black overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={hero.image || "https://picsum.photos/seed/ric-hero/1800/1200"}
            alt=""
            fill
            className="object-cover opacity-50 scale-105 animate-fade-in"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 px-4 pt-20 pb-16">
          <div className="max-w-3xl animate-fade-in-up">
            <Badge className="mb-6 bg-white/10 backdrop-blur-md text-white border-white/20 px-4 py-1.5 text-sm font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
              {hero.badge || "Premier Cultural Destination"}
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight">
              {heroTitle}
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              {(hero.buttons || []).map((btn: any, i: number) => (
                <Button
                  key={i}
                  asChild
                  size="lg"
                  className={cn(
                    "h-13 px-8 text-base rounded-full transition-all duration-300",
                    i === 0
                      ? "bg-white text-black hover:bg-white/90 hover:scale-105 shadow-xl shadow-white/10"
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur"
                  )}
                >
                  <Link href={btn.href || "/events"}>
                    {btn.label || "Explore Events"}
                    {i === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Link>
                </Button>
              ))}
            </div>

            {nextEvent && (
              <div className="mt-16 space-y-4">
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Next Event</p>
                      <p className="text-white font-medium text-sm">{nextEvent.name}</p>
                    </div>
                  </div>
                </div>
                <CountdownTimer targetDate={nextEvent.date} />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ===== STATS SECTION ===== */}
      {stats.length > 0 && (
        <AnimatedSection className="container mx-auto px-4 -mt-20 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat: any, i: number) => {
              const Icon = ICON_MAP[stat.icon] || Calendar;
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-150" />
                  <Icon className="h-6 w-6 text-primary mb-3 relative z-10" />
                  <span className="text-3xl font-bold block relative z-10">{stat.number}</span>
                  <span className="text-sm text-muted-foreground mt-0.5 block relative z-10">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      )}

      <div className="container mx-auto px-4">
        {/* ===== FEATURED EVENTS / NOW SHOWING ===== */}
        <AnimatedSection delay={100}>
          <section className="py-16 md:py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Now Showing</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Featured Events</h2>
                <p className="text-muted-foreground mt-1 text-sm">Discover the best experiences at RIC</p>
              </div>
              <Button asChild variant="ghost" className="group gap-2">
                <Link href="/events">
                  View All Events <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none -mx-4 px-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shrink-0",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {filteredEvents.slice(0, 8).map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No upcoming events</h3>
                  <p className="text-muted-foreground mt-1">Check back soon for new experiences</p>
                  {selectedCategory !== "All" && (
                    <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory("All")}>
                      Show All Categories
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </AnimatedSection>

        {/* ===== ABOUT SECTION ===== */}
        <AnimatedSection delay={150}>
          <section className="py-16 md:py-24 border-t border-border/40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                  {aboutContent.badge || "About RIC"}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  {siteContent.about?.title || "A Hub of Culture, Knowledge & Diplomacy"}
                </h2>
                <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
                  {siteContent.about?.subtitle}
                </p>
                <div className="mt-8 space-y-4">
                  {(aboutContent.features || []).slice(0, 3).map((feature: any, i: number) => {
                    const Icon = ICON_MAP[feature.icon] || Clapperboard;
                    return (
                      <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <Image
                    src="https://picsum.photos/seed/ric-about/800/1000"
                    alt="Rajasthan International Center"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-card border rounded-2xl p-6 shadow-xl max-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats[0]?.number || "500+"}</p>
                      <p className="text-xs text-muted-foreground">{stats[0]?.label || "Events Hosted"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ===== VENUES SECTION ===== */}
        <AnimatedSection delay={200}>
          <section className="py-16 md:py-24 border-t border-border/40">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                {venuesContent.badge || "Venues"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                {siteContent.venues?.title || "Explore Our Spaces"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(venuesContent.items || []).map((venue: any, i: number) => (
                <Link key={i} href="/about" className="group block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5]">
                    <Image
                      src={`https://picsum.photos/seed/${venue.image}/600/750`}
                      alt={venue.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-bold text-white">{venue.title}</h3>
                      <p className="text-sm text-white/70 mt-1.5 leading-relaxed">{venue.description}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm text-white/50 group-hover:text-white transition-colors">
                        <span>Explore</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* ===== MISSION / WHY RIC SECTION ===== */}
        <AnimatedSection delay={220}>
          <section className="py-16 md:py-24 border-t border-border/40">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Our Mission</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Why Rajasthan International Centre?</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                A space where art meets ideas, tradition meets innovation, and community meets culture.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "World-Class Facilities",
                  description: "State-of-the-art auditorium with cutting-edge acoustics, lighting, and projection systems for an unparalleled experience.",
                },
                {
                  icon: Star,
                  title: "Curated Experiences",
                  description: "Every event at RIC is carefully selected to bring the finest in music, theater, art, and intellectual discourse to Jaipur.",
                },
                {
                  icon: Handshake,
                  title: "Community First",
                  description: "We believe in making culture accessible. Our member programs and community initiatives ensure everyone can participate.",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 relative z-10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 relative z-10">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </AnimatedSection>

        {/* ===== CTA SECTION ===== */}
        <AnimatedSection delay={250}>
          <section className="py-16 md:py-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-background border border-primary/20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
              <CardContent className="relative z-10 p-12 md:p-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  {siteContent.cta?.title || "Visit Us"}
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                  {siteContent.cta?.subtitle}
                </p>
                <Button asChild size="lg" className="rounded-full px-8 h-12 shadow-xl shadow-primary/20">
                  <Link href={ctaContent.buttonHref || "/contact"}>
                    {ctaContent.buttonLabel || "Get Directions"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </div>
          </section>
        </AnimatedSection>
      </div>
    </>
  );
}
