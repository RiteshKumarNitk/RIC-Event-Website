"use client";

import { notFound, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Share2, Languages, PersonStanding, Ticket, UtensilsCrossed, ChevronLeft, ChevronRight, ExternalLink, Car, Music, Heart, Hourglass, MicVocal } from "lucide-react";
import { format } from "date-fns";
import { useEvents } from "@/app/admin/events/events-provider";
import { TicketSelection } from "@/components/events/ticket-selection";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/components/events/event-card";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

function EventPageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12 animate-pulse">
      <Skeleton className="h-9 w-3/4 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-video w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-24 rounded-full mb-8" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

const GALLERY_IMAGES = [
  "https://picsum.photos/seed/gallery1/800/450",
  "https://picsum.photos/seed/gallery2/800/450",
  "https://picsum.photos/seed/gallery3/800/450",
  "https://picsum.photos/seed/gallery4/800/450",
];

export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  const { events, loading } = useEvents();
  const router = useRouter();
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const event = events.find((e) => e.id === id);

  const similarEvents = useMemo(() => {
    if (!event) return [];
    return events
      .filter((e) => e.id !== event.id && e.category === event.category && new Date(e.date) > new Date())
      .slice(0, 4);
  }, [events, event]);

  if (loading) return <EventPageSkeleton />;
  if (!event) notFound();

  const handleProceed = (ticketCount: number) => {
    router.push(`/events/${event.id}/seats?tickets=${ticketCount}`);
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${event.name} at Rajasthan International Center!`;
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(event.name)}&body=${encodeURIComponent(text + "\n\n" + url)}`,
    };
    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      setShareOpen(false);
      return;
    }
    window.open(urls[platform], "_blank", "noopener");
    setShareOpen(false);
  };

  const isUpcoming = new Date(event.date) > new Date();
  const venueAddress = `${event.venue}, ${event.location}, Jaipur, Rajasthan`;
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(venueAddress)}`;

  const [interested, setInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(`interested_${event.id}`);
    if (stored) setInterested(true);
    const count = parseInt(localStorage.getItem(`interested_count_${event.id}`) || "0", 10);
    setInterestedCount(count);
  }, [event.id]);

  const handleInterested = () => {
    const newVal = !interested;
    setInterested(newVal);
    const count = parseInt(localStorage.getItem(`interested_count_${event.id}`) || "0", 10);
    const newCount = newVal ? count + 1 : Math.max(0, count - 1);
    localStorage.setItem(`interested_${event.id}`, newVal ? "true" : "");
    localStorage.setItem(`interested_count_${event.id}`, String(newCount));
    setInterestedCount(newCount);
  };

  const artists = (event as any).artists || [];
  const ageLimit = (event as any).ageLimit || "All ages";
  const duration = (event as any).duration;
  const languages = (event as any).languages || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] bg-black">
        <Image src={event.image} alt={event.name} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto max-w-6xl">
            <Badge className="mb-3 bg-white/20 backdrop-blur text-white border-white/30">{event.category}</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white max-w-3xl">{event.name}</h1>
            <div className="flex flex-wrap gap-4 mt-4 text-white/70 text-sm">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {event.showtimes.join(" / ")}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.venue}</span>
            </div>
            {isUpcoming && (
              <div className="mt-6">
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">Event starts in</p>
                <CountdownTimer targetDate={event.date} />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="relative aspect-video">
                <Image src={GALLERY_IMAGES[galleryIdx]} alt="Event gallery" fill className="object-cover" />
              </div>
              <button onClick={() => setGalleryIdx((g) => (g - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setGalleryIdx((g) => (g + 1) % GALLERY_IMAGES.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {GALLERY_IMAGES.map((_, i) => (
                  <button key={i} onClick={() => setGalleryIdx(i)} className={cn("w-2 h-2 rounded-full transition", i === galleryIdx ? "bg-white" : "bg-white/40")} />
                ))}
              </div>
            </div>

            {/* About */}
            <div className="bg-card rounded-xl p-6 md:p-8 border">
              <h2 className="text-2xl font-bold mb-4">About the event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            {/* Artists */}
            {artists.length > 0 && (
              <div className="bg-card rounded-xl p-6 md:p-8 border">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MicVocal className="h-6 w-6 text-primary" /> Artists & Performers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {artists.map((artist: any, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="relative h-20 w-20 rounded-full overflow-hidden mb-3 ring-2 ring-primary/20">
                        <Image src={artist.photo} alt={artist.name} fill className="object-cover" />
                      </div>
                      <h4 className="font-semibold text-sm leading-tight">{artist.name}</h4>
                      <Badge variant="secondary" className="mt-1.5 text-[10px] px-2">{artist.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Events */}
            {similarEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">You might also like</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {similarEvents.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TicketSelection event={event} onProceed={handleProceed} />

            {/* Interested */}
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Interested</h3>
              <p className="text-xs text-muted-foreground mb-3">{interestedCount} people are interested in this event</p>
              <Button
                variant={interested ? "default" : "outline"}
                size="sm"
                className="w-full gap-2"
                onClick={handleInterested}
              >
                <Heart className={cn("h-4 w-4", interested && "fill-current")} />
                {interested ? "Interested" : "I'm Interested"}
              </Button>
            </div>

            {/* Venue Map */}
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Venue</h3>
              </div>
              <div className="aspect-video bg-muted relative">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: "absolute", inset: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GMAPS_KEY || ""}&q=${encodeURIComponent(venueAddress)}&center=26.8272,75.8063&zoom=15`}
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium">{event.venue}</p>
                <p className="text-xs text-muted-foreground">{venueAddress}</p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-2">
                  <a href={googleMapsUrl} target="_blank" rel="noopener">Open in Maps <ExternalLink className="h-3 w-3" /></a>
                </Button>
              </div>
            </div>

            {/* Share */}
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /> Share</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleShare("whatsapp")}>
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleShare("twitter")}>
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleShare("copy")}>
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details + Facilities Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="bg-card rounded-xl border p-6 md:p-8">
            <h2 className="font-bold text-2xl mb-6">Event Details</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-center gap-4"><Calendar className="h-5 w-5 text-primary shrink-0" /><span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span></li>
              <li className="flex items-center gap-4"><Clock className="h-5 w-5 text-primary shrink-0" /><span>{event.showtimes.join(" / ")}</span></li>
              <li className="flex items-center gap-4"><Hourglass className="h-5 w-5 text-primary shrink-0" /><span>{duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "N/A"}</span></li>
              <li className="flex items-center gap-4"><MapPin className="h-5 w-5 text-primary shrink-0" /><span>{event.venue}, {event.location}</span></li>
              <li className="flex items-center gap-4"><Ticket className="h-5 w-5 text-primary shrink-0" /><span>{event.category}</span></li>
              <li className="flex items-center gap-4"><PersonStanding className="h-5 w-5 text-primary shrink-0" /><span>{ageLimit}</span></li>
              <li className="flex items-center gap-4"><Languages className="h-5 w-5 text-primary shrink-0" /><span>{languages.length > 0 ? languages.join(", ") : "English, Hindi"}</span></li>
            </ul>
          </div>
          <div className="bg-card rounded-xl border p-6 md:p-8">
            <h2 className="font-bold text-2xl mb-6">Facilities & Parking</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <UtensilsCrossed className="h-5 w-5 text-muted-foreground shrink-0" />
                <div><p className="font-medium text-sm">Outside Food Not Allowed</p><p className="text-xs text-muted-foreground">Food court available inside</p></div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                <div><p className="font-medium text-sm">Parking Available</p><p className="text-xs text-muted-foreground">Ample parking space for 200+ vehicles</p></div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Music className="h-5 w-5 text-muted-foreground shrink-0" />
                <div><p className="font-medium text-sm">Wheelchair Accessible</p><p className="text-xs text-muted-foreground">Full accessibility throughout the venue</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* M-Ticket */}
        <div className="bg-card rounded-xl border p-6 md:p-8 mt-8">
          <h2 className="font-bold text-2xl mb-4">M-Ticket</h2>
          <div className="bg-primary/5 border-l-4 border-primary p-4 flex items-center gap-4 rounded-r-lg">
            <Ticket className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">Contactless Ticketing & Fast-track Entry with M-ticket.</p>
              <p className="text-sm text-muted-foreground mt-1">Show your QR code at the venue entrance for quick check-in. No physical ticket needed.</p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-card rounded-xl border p-6 md:p-8 mt-8">
          <h2 className="font-bold text-2xl mb-4">Terms & Conditions</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Tickets once booked cannot be exchanged or refunded.</li>
            <li>Entry is permitted only with a valid ticket and ID proof.</li>
            <li>Outside food and beverages are not allowed inside the venue.</li>
            <li>The management reserves the right to cancel or reschedule events.</li>
            <li>Recording of the event without prior permission is prohibited.</li>
            <li>Children below 5 years may enter free (if accompanied by an adult).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
