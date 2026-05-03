"use client";

import { notFound, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Share2, Languages, PersonStanding, Ticket, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";
import { useEvents } from "@/app/admin/events/events-provider";
import { Button } from "@/components/ui/button";
import { TicketSelection } from "@/components/events/ticket-selection";
import { Skeleton } from "@/components/ui/skeleton";

function EventPageSkeleton() {
  return (
    <div className="bg-muted/40">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            <Skeleton className="h-8 w-24 rounded-full mb-8" />
            <div className="bg-background p-8 rounded-lg shadow">
              <Skeleton className="h-8 w-1/3 mb-4" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}


export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  const { events, loading } = useEvents();
  const router = useRouter();

  const event = events.find((e) => e.id === id);

  if (loading) {
    return <EventPageSkeleton />;
  }
  
  if (!event) {
    notFound();
  }

  const handleProceed = (ticketCount: number) => {
    router.push(`/events/${event.id}/seats?tickets=${ticketCount}`);
  };
  
  return (
    <div className="bg-muted/40">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{event.name}</h1>
                <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                    <span className="sr-only">Share</span>
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 shadow-lg">
                        <Image
                        src={event.image}
                        alt={event.name}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={`${event.category.toLowerCase()} event poster`}
                        />
                    </div>
                     <Badge variant="outline" className="text-base py-1 px-3">
                        {event.category}
                    </Badge>
                     <div className="prose prose-lg max-w-none mt-8 bg-background p-8 rounded-lg shadow">
                        <h2 className="font-bold text-2xl mb-4">About the event</h2>
                        <p className="text-base text-muted-foreground">{event.description}</p>
                    </div>
                </div>
                <div className="lg:col-span-1">
                   <TicketSelection event={event} onProceed={handleProceed} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                 <div className="bg-background p-8 rounded-lg shadow">
                    <h2 className="font-bold text-2xl mb-4">Event Details</h2>
                     <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-center gap-4">
                            <Calendar className="h-5 w-5 text-primary" />
                            <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                        </li>
                            <li className="flex items-center gap-4">
                            <Clock className="h-5 w-5 text-primary" />
                            <span>{event.showtimes.join(' / ')}</span>
                        </li>
                            <li className="flex items-center gap-4">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span>{event.venue}, {event.location}</span>
                        </li>
                            <li className="flex items-center gap-4">
                            <Ticket className="h-5 w-5 text-primary" />
                            <span>{event.category}</span>
                        </li>
                            <li className="flex items-center gap-4">
                            <PersonStanding className="h-5 w-5 text-primary" />
                            <span>18+</span>
                        </li>
                            <li className="flex items-center gap-4">
                            <Languages className="h-5 w-5 text-primary" />
                            <span>English, Hindi</span>
                        </li>
                    </ul>
                </div>
                 <div className="bg-background p-8 rounded-lg shadow">
                    <h2 className="font-bold text-2xl mb-4">Facilities</h2>
                    <div className="border rounded-lg p-4 flex items-center gap-4">
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        <span className="text-muted-foreground">Outside Food Not Allowed</span>
                    </div>
                </div>
            </div>

            <div className="bg-background p-8 rounded-lg shadow mt-8">
                <h2 className="font-bold text-2xl mb-4">M-Ticket</h2>
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 flex items-center gap-4">
                    <Ticket className="h-6 w-6 text-red-600" />
                    <div>
                        <p className="font-semibold">Contactless Ticketing & Fast-track Entry with M-ticket.</p>
                        <a href="#" className="text-red-600 font-semibold hover:underline">Learn How</a>
                    </div>
                </div>
            </div>
            <div className="bg-background p-8 rounded-lg shadow mt-8">
                 <h2 className="font-bold text-2xl mb-4">Terms & Conditions</h2>
                 <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. </p>
            </div>
        </div>
    </div>
  );
}
