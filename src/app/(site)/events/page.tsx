"use client";

import { EventList } from "@/components/events/event-list";
import { useEvents } from "@/app/admin/events/events-provider";
import { SkeletonCard } from "@/components/ui/skeleton";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function EventsPage() {
  const { events, loading } = useEvents();

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] bg-black overflow-hidden">
        <Image
          src="https://picsum.photos/seed/events-hero/1800/600"
          alt="Events"
          fill
          className="object-cover opacity-50"
          data-ai-hint="concert stage lights"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="container relative h-full flex flex-col items-center justify-center text-center px-4 -mt-4">
          <Badge variant="secondary" className="mb-4 text-xs font-medium px-4 py-1.5 bg-white/10 backdrop-blur-md border-white/20 text-white">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Discover Events
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Explore Our Events
          </h1>
          <p className="mt-3 text-lg text-white/70 max-w-xl">
            Discover a world of culture, knowledge, and entertainment
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <EventList events={events} />
        )}
      </div>
    </div>
  );
}
