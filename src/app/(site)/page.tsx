"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EventCard } from "@/components/events/event-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clapperboard, Lightbulb, Users, Calendar, Music, Award, MapPin } from "lucide-react";
import { useEvents } from "@/app/admin/events/events-provider";
import { SkeletonCard } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Home() {
  const { events, loading } = useEvents();
  const upcomingEvents = events
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const featuredEvents = upcomingEvents.slice(0, 10);
  const stats = [
    { number: "500+", label: "Events Hosted", icon: Calendar },
    { number: "50K+", label: "Visitors Yearly", icon: Users },
    { number: "200+", label: "Artists Featured", icon: Music },
    { number: "15+", label: "Awards Won", icon: Award },
  ];

  return (
    <>
      <section className="relative h-[85vh] min-h-[500px] bg-black">
        <Image
          src="https://picsum.photos/seed/ric-hero/1800/1200"
          alt="Rajasthan International Center"
          fill
          className="object-cover opacity-60"
          data-ai-hint="modern architecture building"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
        <div className="container relative h-full flex flex-col items-center justify-center text-center text-white px-4">
          <Badge variant="secondary" className="mb-6 text-sm font-medium px-4 py-1.5">
            Premier Cultural Destination
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">Rajasthan International Center</h1>
          <p className="mt-6 text-lg md:text-xl max-w-2xl text-white/80 leading-relaxed">Where culture, knowledge, and community converge in the heart of Jaipur</p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Button asChild size="lg" className="px-8 h-12 text-base">
              <Link href="/events">Explore Events</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 h-12 text-base bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="container mx-auto px-4">
        <section className="py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
                <Icon className="h-8 w-8 text-primary mb-3" />
                <span className="text-3xl font-bold">{stat.number}</span>
                <span className="text-sm text-muted-foreground mt-1">{stat.label}</span>
              </div>
            );
          })}
        </section>

        <section className="py-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4">About RIC</Badge>
            <h2 className="text-4xl font-bold mb-4">A Hub of Culture, Knowledge & Diplomacy</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Rajasthan International Centre is a world-class institution designed to be the epicenter of cultural exchange, intellectual dialogue, and social engagement in Rajasthan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="group p-8 rounded-2xl bg-card border hover:shadow-xl transition-all duration-300">
              <Clapperboard className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Culture & Arts</h3>
              <p className="text-muted-foreground leading-relaxed">Immerse yourself in diverse cultural performances, art exhibitions, and film screenings showcasing local and global talent.</p>
            </div>
            <div className="group p-8 rounded-2xl bg-card border hover:shadow-xl transition-all duration-300">
              <Lightbulb className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Knowledge & Ideas</h3>
              <p className="text-muted-foreground leading-relaxed">Engage in thought-provoking seminars, talks, and conferences featuring leading experts from various fields.</p>
            </div>
            <div className="group p-8 rounded-2xl bg-card border hover:shadow-xl transition-all duration-300">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community & Networking</h3>
              <p className="text-muted-foreground leading-relaxed">Connect with like-minded individuals and professionals in a dynamic environment built for collaboration.</p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <p className="text-muted-foreground mt-1">Don&apos;t miss our latest experiences</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/events">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No upcoming events</h3>
                <p className="text-muted-foreground mt-1">Check back soon for new experiences</p>
              </CardContent>
            </Card>
          )}
          {loading && (
            <div className="mt-8">
              <Carousel className="w-full">
                <CarouselContent>
                  {events.slice(0, 5).map((event) => (
                    <CarouselItem key={event.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                      <EventCard event={event} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          )}
        </section>

        <section className="py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Venues</Badge>
            <h2 className="text-3xl font-bold">Explore Our Spaces</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Main Auditorium", desc: "State-of-the-art acoustics and seating for large-scale performances", img: "venue1", hint: "modern auditorium interior" },
              { title: "Conference Halls", desc: "Flexible spaces equipped with the latest technology for meetings", img: "venue2", hint: "conference room empty" },
              { title: "Art Gallery", desc: "A modern space to exhibit art from local and international artists", img: "venue3", hint: "art gallery empty" },
            ].map((venue, i) => (
              <Link key={i} href="/about" className="group block">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
                  <Image
                    src={`https://picsum.photos/seed/${venue.img}/600/400`}
                    alt={venue.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint={venue.hint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-semibold text-white">{venue.title}</h3>
                    <p className="text-sm text-white/70 mt-1">{venue.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-16 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-12 text-center">
              <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-3">Visit Us</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
                Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Get Directions</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
