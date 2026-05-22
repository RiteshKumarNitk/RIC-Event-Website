import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, MicVocal } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact" | "hero";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const isUpcoming = new Date(event.date) > new Date();
  const day = format(new Date(event.date), "d");
  const month = format(new Date(event.date), "MMM");

  if (variant === "hero") {
    return (
      <Link href={`/events/${event.id}`} className="group block h-full">
        <div className="relative h-full rounded-2xl overflow-hidden">
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className="mb-3 bg-white/20 backdrop-blur text-white border-white/30 text-xs">
              {event.category}
            </Badge>
            <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight">{event.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-white/70 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <div className="h-full flex flex-col rounded-xl overflow-hidden bg-card border border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={event.image}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shadow-sm backdrop-blur bg-background/80">
              {event.category}
            </Badge>
            {!isUpcoming && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">Past</Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <div className="bg-black/70 backdrop-blur rounded-lg px-2.5 py-1.5 text-center shadow-lg">
              <span className="block text-[10px] font-semibold text-white/80 uppercase leading-none tracking-wider">{month}</span>
              <span className="block text-lg font-bold text-white leading-none mt-0.5">{day}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 drop-shadow-sm">
              {event.name}
            </h3>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-3 gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{format(new Date(event.date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          {event.showtimes?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.showtimes.slice(0, 2).join(", ")}</span>
            </div>
          )}
          {(event as any).artists?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <MicVocal className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{(event as any).artists.length} artist(s)</span>
            </div>
          )}
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">
              {event.ticketTypes?.length > 0
                ? `From ₹${Math.min(...event.ticketTypes.map((t: any) => t.price))}`
                : "Book Now"}
            </span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
