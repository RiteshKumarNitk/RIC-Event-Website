import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const isUpcoming = new Date(event.date) > new Date();

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50">
        <div className="relative overflow-hidden">
          <Image
            src={event.image}
            alt={event.name}
            width={400}
            height={260}
            className="object-cover w-full h-36 transition-transform duration-500 group-hover:scale-105"
            data-ai-hint={`${event.category.toLowerCase()} event`}
          />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shadow-sm">{event.category}</Badge>
            {!isUpcoming && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">Past</Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <div className="bg-background/90 backdrop-blur rounded-md px-2 py-1 text-center shadow-sm">
              <span className="block text-[10px] font-medium text-muted-foreground uppercase leading-none">{format(new Date(event.date), "MMM")}</span>
              <span className="block text-sm font-bold leading-none">{format(new Date(event.date), "d")}</span>
            </div>
          </div>
        </div>
        <CardContent className="flex-1 flex flex-col p-3 gap-1.5">
          <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {event.name}
          </h3>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{format(new Date(event.date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex justify-between items-center">
          <span className="text-xs font-medium text-primary">View Details</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary transition-transform group-hover:translate-x-1" />
        </CardFooter>
      </Card>
    </Link>
  );
}
