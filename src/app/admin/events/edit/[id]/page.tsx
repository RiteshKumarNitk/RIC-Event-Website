"use client"

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, IndianRupee, Building2, Calendar, User, Clock, Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";
import { useEvents } from "../../events-provider";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { HALL_TEMPLATES, getDefaultHallId, getHallTemplate, SeatZone } from "@/lib/halls";

const eventSchema = z.object({
  name: z.string().min(5, "Event name must be at least 5 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  category: z.enum(["Music", "Sports", "Art", "Theater", "Seminar", "Cultural", "Talk", "Comedy"]),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  time: z.string().min(1, "Show time is required."),
  location: z.string().min(3, "Location is required."),
  venue: z.string().min(3, "Venue is required."),
  image: z.string().url("Please enter a valid URL."),
  hallId: z.string().min(1, "Please select a hall."),
  ageLimit: z.string().optional(),
  duration: z.coerce.number().min(0, "Duration must be 0 or more.").optional(),
  languages: z.string().optional(),
  artists: z.array(z.object({
    name: z.string().min(1, "Artist name is required."),
    photo: z.string().url("Please enter a valid URL."),
    category: z.string().min(1, "Category is required."),
  })).optional(),
  ticketTypes: z.array(z.object({
    type: z.string().min(1, "Ticket type name is required."),
    price: z.coerce.number().min(0, "Price must be 0 or more."),
  })).min(1, "At least one ticket type is required."),
});

const zoneColors: Record<SeatZone, string> = {
    VIP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    Premium: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    Standard: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    Balcony: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const { events, updateEvent } = useEvents();
    const eventId = params.id as string;
    const [showSeatPreview, setShowSeatPreview] = useState(false);

    const event = events.find(e => e.id === eventId);

    const form = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
    });

    const { fields: ticketFields, append: appendTicket, remove: removeTicket } = useFieldArray({
        control: form.control,
        name: "ticketTypes",
    });

    const { fields: artistFields, append: appendArtist, remove: removeArtist } = useFieldArray({
        control: form.control,
        name: "artists",
    });

    useEffect(() => {
        if (event) {
            const eventDate = new Date(event.date);
            const ticketTypes = event.ticketTypes && event.ticketTypes.length > 0
                ? event.ticketTypes
                : [{ type: "VIP", price: 0 }, { type: "Premium", price: 0 }, { type: "Standard", price: 0 }, { type: "Balcony", price: 0 }];
            const artists = (event as any).artists || [];
            const languages = (event as any).languages ? (event as any).languages.join(", ") : "";
            form.reset({
                name: event.name,
                description: event.description,
                category: event.category,
                date: eventDate.toISOString().split("T")[0],
                time: eventDate.toTimeString().slice(0, 5),
                location: event.location || "Jaipur, Rajasthan",
                venue: event.venue,
                image: event.image,
                hallId: (event as any).hallId || getDefaultHallId(),
                ageLimit: (event as any).ageLimit || "All ages",
                duration: (event as any).duration || 120,
                languages,
                artists,
                ticketTypes,
            });
        }
    }, [event, form]);

    async function onSubmit(values: z.infer<typeof eventSchema>) {
        if (!event) return;
        const dateTimeStr = `${values.date}T${values.time}`;
        const updatedEventData = {
            name: values.name,
            description: values.description,
            category: values.category,
            date: new Date(dateTimeStr),
            location: values.location,
            venue: values.venue,
            image: values.image,
            showtimes: [new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })],
            hallId: values.hallId,
            ageLimit: values.ageLimit,
            duration: values.duration,
            languages: values.languages ? values.languages.split(",").map(l => l.trim()).filter(Boolean) : undefined,
            artists: values.artists || undefined,
            ticketTypes: values.ticketTypes.map(t => ({ type: t.type, price: t.price })),
        };
        await updateEvent(event.id, updatedEventData as any);
        router.push("/admin/events");
    }

    const selectedHall = getHallTemplate(form.watch("hallId") || getDefaultHallId());
    const seatZoneMap = useMemo(() => {
        if (!selectedHall) return [];
        const zoneCounts: Record<SeatZone, number> = { VIP: 0, Premium: 0, Standard: 0, Balcony: 0 };
        selectedHall.sections.forEach(section => {
            section.rows.forEach(row => {
                zoneCounts[row.zone] += row.seats;
            });
        });
        return Object.entries(zoneCounts).filter(([, count]) => count > 0);
    }, [selectedHall]);

    if (!event) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold">Event not found</h1>
                <Button asChild variant="link"><Link href="/admin/events">Go back</Link></Button>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/events">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Event</h1>
                    <p className="text-muted-foreground text-sm">{event.name}</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Event Details</CardTitle>
                                    <CardDescription>Basic information about your event</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="Enter event name" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe your event..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="category" render={({ field }) => (
                                            <FormItem><FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Music">Music</SelectItem>
                                                    <SelectItem value="Sports">Sports</SelectItem>
                                                    <SelectItem value="Art">Art</SelectItem>
                                                    <SelectItem value="Theater">Theater</SelectItem>
                                                    <SelectItem value="Seminar">Seminar</SelectItem>
                                                    <SelectItem value="Cultural">Cultural</SelectItem>
                                                    <SelectItem value="Talk">Talk</SelectItem>
                                                    <SelectItem value="Comedy">Comedy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="image" render={({ field }) => (
                                            <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" />Date, Time & Location</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="date" render={({ field }) => (
                                            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="time" render={({ field }) => (
                                            <FormItem><FormLabel>Show Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="venue" render={({ field }) => (
                                            <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="Venue name" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="location" render={({ field }) => (
                                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="City, State" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" />Artists</CardTitle>
                                    <CardDescription>Add performers and their details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {artistFields.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No artists added yet</p>
                                    )}
                                    {artistFields.map((field, index) => (
                                        <div key={field.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Artist {index + 1}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeArtist(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                            <FormField control={form.control} name={`artists.${index}.name`} render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input placeholder="Artist name" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`artists.${index}.photo`} render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Photo URL</FormLabel><FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`artists.${index}.category`} render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Singer">Singer</SelectItem>
                                                        <SelectItem value="Musician">Musician</SelectItem>
                                                        <SelectItem value="Stand-up Comedian">Stand-up Comedian</SelectItem>
                                                        <SelectItem value="Dancer">Dancer</SelectItem>
                                                        <SelectItem value="Actor">Actor</SelectItem>
                                                        <SelectItem value="Speaker">Speaker</SelectItem>
                                                        <SelectItem value="Band">Band</SelectItem>
                                                        <SelectItem value="DJ">DJ</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage /></FormItem>
                                            )} />
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => appendArtist({ name: "", photo: "", category: "" })}>
                                        <Plus className="mr-2 h-4 w-4" />Add Artist
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />Additional Details</CardTitle>
                                    <CardDescription>Age limit, duration, languages</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="ageLimit" render={({ field }) => (
                                            <FormItem><FormLabel>Age Limit</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="All ages">All ages</SelectItem>
                                                    <SelectItem value="5+">5+</SelectItem>
                                                    <SelectItem value="12+">12+</SelectItem>
                                                    <SelectItem value="16+">16+</SelectItem>
                                                    <SelectItem value="18+">18+</SelectItem>
                                                    <SelectItem value="21+">21+</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="duration" render={({ field }) => (
                                            <FormItem><FormLabel>Duration (minutes)</FormLabel><FormControl><Input type="number" min="0" step="5" placeholder="120" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="languages" render={({ field }) => (
                                        <FormItem><FormLabel>Languages</FormLabel><FormControl><Input placeholder="Hindi, English" {...field} /></FormControl>
                                        <FormDescription className="text-xs">Comma-separated list of languages</FormDescription>
                                        <FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" />Hall</CardTitle>
                                    <CardDescription>Select the hall for this event</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="hallId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hall</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {HALL_TEMPLATES.map(hall => (
                                                        <SelectItem key={hall.id} value={hall.id}>{hall.name} ({hall.totalSeats} seats)</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {selectedHall && (
                                        <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                                            <div className="text-center text-xs font-semibold mb-2">Seat Zones</div>
                                            {seatZoneMap.map(([zone, count]) => (
                                                <div key={zone} className="flex justify-between items-center">
                                                    <Badge className={cn("text-xs", zoneColors[zone as SeatZone])}>{zone}</Badge>
                                                    <span className="text-xs text-muted-foreground">{count} seats</span>
                                                </div>
                                            ))}
                                            <Separator />
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span>Total</span>
                                                <span>{selectedHall.totalSeats} seats</span>
                                            </div>
                                        </div>
                                    )}

                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowSeatPreview(!showSeatPreview)}>
                                        {showSeatPreview ? "Hide" : "Preview"} Seat Map
                                    </Button>

                                    {showSeatPreview && selectedHall && (
                                        <div className="border rounded-lg p-3 bg-muted/30 max-h-64 overflow-auto">
                                            <div className="text-center text-xs text-muted-foreground mb-2 font-semibold">Stage</div>
                                            <div className="border-t-2 border-primary/50 mb-3" />
                                            {selectedHall.sections.map(section => (
                                                <div key={section.sectionName} className="space-y-1">
                                                    {section.rows.map(row => (
                                                        <div key={row.rowId} className="flex items-center gap-1">
                                                            <span className="w-5 text-xs font-semibold text-muted-foreground">{row.rowId}</span>
                                                            <div className="flex flex-wrap gap-px">
                                                                {Array.from({ length: Math.min(row.seats, 30) }).map((_, i) => (
                                                                    <div key={i} className={cn("w-3 h-3 rounded-sm border", zoneColors[row.zone])} />
                                                                ))}
                                                                {row.seats > 30 && (
                                                                    <span className="text-xs text-muted-foreground ml-1">+{row.seats - 30}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><IndianRupee className="h-5 w-5" />Ticket Pricing</CardTitle>
                                    <CardDescription>Set price per zone for this event</CardDescription>
                                </CardHeader>
                                                                <CardContent className="space-y-4">
                                                                    {ticketFields.map((field, index) => (
                                                                        <div key={field.id} className="flex gap-2 items-end">
                                                                            <div className="flex-1">
                                                                                <FormField control={form.control} name={`ticketTypes.${index}.type`} render={({ field }) => (
                                                                                    <FormItem><FormLabel className="text-xs">Zone</FormLabel><FormControl><Input placeholder="e.g. VIP, Standard" {...field} /></FormControl><FormMessage /></FormItem>
                                                                                )} />
                                                                            </div>
                                                                            <div className="w-24">
                                                                                <FormField control={form.control} name={`ticketTypes.${index}.price`} render={({ field }) => (
                                                                                    <FormItem><FormLabel className="text-xs">Price (₹)</FormLabel><FormControl><Input type="number" min="0" step="10" {...field} /></FormControl><FormMessage /></FormItem>
                                                                                )} />
                                                                            </div>
                                                                            {ticketFields.length > 1 && (
                                                                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeTicket(index)}>
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => appendTicket({ type: "", price: 0 })}>
                                                                        <Plus className="mr-2 h-4 w-4" />Add Ticket Type
                                                                    </Button>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {form.watch("ticketTypes").map((t, i) => (
                                            <Badge key={i} variant={t.price === 0 ? "outline" : "secondary"} className="text-xs">
                                                {t.type || "Untitled"} — ₹{t.price || 0}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/admin/events">Cancel</Link>
                                </Button>
                                <Button type="submit" className="flex-1">Save Changes</Button>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
