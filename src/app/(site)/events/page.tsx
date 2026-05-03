"use client";

import { EventList } from "@/components/events/event-list";
import { useEvents } from "@/app/admin/events/events-provider";
import { SkeletonCard } from "@/components/ui/skeleton";
import Image from "next/image";

export default function EventsPage() {
  const { events, loading } = useEvents();

  return (
    <div className="bg-background">
      <section className="relative h-[35vh] min-h-[250px] bg-muted/50">
        <Image
          src="https://picsum.photos/seed/events-hero/1800/600"
          alt="Events"
          fill
          className="object-cover"
          data-ai-hint="concert stage lights"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container relative h-full flex flex-col items-center justify-center text-center px-4 -mt-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Explore Our Events</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">Discover a world of culture, knowledge, and entertainment</p>
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
