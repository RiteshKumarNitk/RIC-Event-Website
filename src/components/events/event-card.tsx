import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, ArrowRight, Ticket } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact" | "hero" | "featured";
}

const categoryColors: Record<string, string> = {
  Music: "bg-violet-500 text-white",
  Sports: "bg-emerald-500 text-white",
  Art: "bg-amber-500 text-white",
  Theater: "bg-rose-500 text-white",
  Seminar: "bg-blue-500 text-white",
  Cultural: "bg-orange-500 text-white",
  Talk: "bg-cyan-500 text-white",
  Comedy: "bg-pink-500 text-white",
};

const categoryGradients: Record<string, string> = {
  Music: "bg-gradient-to-br from-violet-600 to-violet-900",
  Sports: "bg-gradient-to-br from-emerald-600 to-emerald-900",
  Art: "bg-gradient-to-br from-amber-600 to-amber-900",
  Theater: "bg-gradient-to-br from-rose-600 to-rose-900",
  Seminar: "bg-gradient-to-br from-blue-600 to-blue-900",
  Cultural: "bg-gradient-to-br from-orange-600 to-orange-900",
  Talk: "bg-gradient-to-br from-cyan-600 to-cyan-900",
  Comedy: "bg-gradient-to-br from-pink-600 to-pink-900",
};

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const isUpcoming = new Date(event.date) > new Date();
  const day = format(new Date(event.date), "d");
  const month = format(new Date(event.date), "MMM");
  const minPrice = event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map((t: any) => t.price)) : 0;
  const categoryColor = categoryColors[event.category] || "bg-primary text-primary-foreground";
  const categoryGradient = categoryGradients[event.category] || "bg-gradient-to-br from-primary to-primary/90";

  // Featured variant - larger card for the slider
  if (variant === "featured") {
    return (
      <Link href={`/events/${event.id}`} className="group block">
        <div className="relative h-[420px] rounded-2xl overflow-hidden bg-card">
          <Image
            src={event.image}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500", categoryGradient)} />

          {/* Date chip */}
          <div className="absolute top-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 text-center shadow-lg">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{month}</span>
              <span className="block text-xl font-bold text-foreground leading-none mt-0.5">{day}</span>
            </div>
          </div>

          {/* Category badge */}
          <div className="absolute top-4 right-4">
            <Badge className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold shadow-md", categoryColor)}>
              {event.category}
            </Badge>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{event.venue}</span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 mb-2">
              {event.name}
            </h3>
            <div className="flex items-center gap-3 text-white/70 text-xs mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(event.date), "EEE, MMM d")}
              </span>
              {event.showtimes.length > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.showtimes[0]}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                {minPrice === 0 ? (
                  <span className="text-sm font-bold text-emerald-400">FREE</span>
                ) : (
                  <span className="text-sm text-white/60">From <span className="text-white font-bold">₹{minPrice}</span></span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/20 transition-all duration-300">
                Book Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Hero variant - full coverage
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
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold", categoryColor)}>
              {event.category}
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight mb-2">{event.name}</h3>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(event.date), "MMM d, yyyy")}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.venue}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Link href={`/events/${event.id}`} className="group block">
        <div className="flex gap-4 p-3 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
            <Image src={event.image} alt={event.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className={cn("text-[9px] px-1.5 py-0 h-4 rounded-full mb-1.5", categoryColor)}>
              {event.category}
            </Badge>
            <h4 className="font-semibold text-sm line-clamp-1 mb-1">{event.name}</h4>
            <p className="text-xs text-muted-foreground">{format(new Date(event.date), "MMM d, yyyy")}</p>
          </div>
          <div className="flex items-center shrink-0">
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - standard card
  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <div className="h-full flex flex-col rounded-2xl overflow-hidden bg-card border border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 hover:border-primary/20">
        {/* Image section */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={event.image}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500", categoryGradient)} />

          {/* Date chip - top right */}
          <div className="absolute top-3 right-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-lg">
              <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">{month}</span>
              <span className="block text-base font-bold text-foreground leading-none mt-0.5">{day}</span>
            </div>
          </div>

          {/* Category badge - top left */}
          <div className="absolute top-3 left-3">
            <Badge className={cn("text-[10px] px-2 py-0.5 h-5 rounded-full font-semibold shadow-md", categoryColor)}>
              {event.category}
            </Badge>
          </div>

          {/* Status badges */}
          {!isUpcoming && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2">
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5 h-5 rounded-full">Past Event</Badge>
            </div>
          )}

          {/* Event name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pt-8">
            <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
              {event.name}
            </h3>
          </div>

          {/* Hover CTA overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-foreground shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Ticket className="w-4 h-4 text-primary" />
              Book Tickets
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="flex-1 flex flex-col p-3 gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 flex-shrink-0 text-primary/60" />
            <span className="truncate">{format(new Date(event.date), "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0 text-primary/60" />
            <span className="truncate">{event.venue}</span>
          </div>
          {event.showtimes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0 text-primary/60" />
              <span className="truncate">{event.showtimes.slice(0, 2).join(", ")}</span>
            </div>
          )}
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-border/50">
            <span className="text-xs font-bold text-primary">
              {minPrice === 0 ? "FREE" : `From ₹${minPrice}`}
            </span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
