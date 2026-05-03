"use client";

import { useState, useMemo } from "react";
import type { Event, EventCategory } from "@/lib/types";
import { EventCard } from "./event-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories: (EventCategory | "All")[] = ["All", "Music", "Sports", "Art", "Theater", "Seminar", "Cultural", "Talk"];

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => activeCategory === "All" || event.category === activeCategory)
      .filter((event) => event.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, activeCategory, searchTerm]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: events.length };
    events.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [events]);

  return (
    <section id="events" className="scroll-mt-20">
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur border-b -mx-4 px-4 py-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by name..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "h-7 text-xs transition-all",
                    activeCategory === category ? "shadow-sm" : ""
                  )}
                >
                  {category}
                  <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] font-normal">
                    {categoryCounts[category] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-3">
            Found {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} for &ldquo;{searchTerm}&rdquo;
          </p>
        )}
      </div>

      {filteredEvents.length > 0 ? (
        <div className={cn(
          "grid gap-5",
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" : "grid-cols-1 max-w-3xl"
        )}>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No events found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or selecting a different category</p>
        </div>
      )}
    </section>
  );
}
