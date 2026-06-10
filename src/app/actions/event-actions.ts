"use server";

import { prisma } from "@/lib/prisma";
import { Event } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/server-auth";

const createEventSchema = z.object({
  name: z.string().min(5, "Event name must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  date: z.coerce.date().refine((d) => !isNaN(d.getTime()), "Invalid date"),
  location: z.string().min(3, "Location is required"),
  venue: z.string().min(3, "Venue is required"),
  image: z.string().url("Image must be a valid URL"),
  showtimes: z.array(z.string()).min(1, "At least one showtime is required"),
  artists: z.any().optional(),
  ageLimit: z.string().optional(),
  duration: z.number().min(0).optional(),
  languages: z.array(z.string()).optional(),
  ticketTypes: z.array(z.object({ type: z.string(), price: z.number().min(0) })).min(1, "At least one ticket type is required"),
  seatingChart: z.any().optional(),
});

export async function getEvents() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" }
    });
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function addEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt">) {
  try {
    await requireAdminSession();
    const parsed = createEventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }
    const d = parsed.data;
    const event = await prisma.event.create({
      data: {
        name: d.name,
        description: d.description,
        category: d.category,
        date: d.date,
        location: d.location,
        venue: d.venue,
        image: d.image,
        showtimes: d.showtimes,
        artists: d.artists as any,
        ageLimit: d.ageLimit,
        duration: d.duration,
        languages: d.languages || [],
        ticketTypes: d.ticketTypes as any,
        seatingChart: d.seatingChart as any,
      }
    });
    return { success: true, event };
  } catch (error: any) {
    console.error("Error creating event:", error);
    return { success: false, error: error.message || "Failed to create event" };
  }
}

export async function updateEvent(id: string, data: Partial<Event>) {
  try {
    await requireAdminSession();
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.date && { date: data.date }),
        ...(data.location && { location: data.location }),
        ...(data.venue && { venue: data.venue }),
        ...(data.image && { image: data.image }),
        ...(data.showtimes && { showtimes: data.showtimes }),
        ...(data.artists !== undefined && { artists: data.artists as any }),
        ...(data.ageLimit !== undefined && { ageLimit: data.ageLimit }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.languages !== undefined && { languages: data.languages }),
        ...(data.ticketTypes && { ticketTypes: data.ticketTypes as any }),
        ...(data.seatingChart !== undefined && { seatingChart: data.seatingChart as any }),
      }
    });
    return { success: true, event };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    await requireAdminSession();
    await prisma.event.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

/** @requiresAdmin */
export async function seedEvents(sampleEvents: any[]) {
  try {
    await requireAdminSession();
    const existingEvents = await prisma.event.count();
    if (existingEvents > 0) {
      return { success: false, error: "Database already has events" };
    }

    for (const event of sampleEvents) {
      await prisma.event.create({
        data: {
          name: event.name,
          description: event.description,
          category: event.category,
          date: new Date(event.date),
          location: event.location,
          venue: event.venue,
          image: event.image,
          showtimes: event.showtimes,
          artists: event.artists || undefined,
          ageLimit: event.ageLimit || undefined,
          duration: event.duration || undefined,
          languages: event.languages || undefined,
          ticketTypes: event.ticketTypes,
          seatingChart: event.seatingChart || null,
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error seeding events:", error);
    return { success: false, error: "Failed to seed events" };
  }
}

/** @requiresAdmin - Destructive action */
export async function deleteAllEvents() {
  try {
    await requireAdminSession();
    await prisma.booking.deleteMany({});
    await prisma.event.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Error deleting all events:", error);
    return { success: false, error: "Failed to delete all events" };
  }
}
