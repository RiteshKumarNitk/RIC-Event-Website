"use server";

import { prisma } from "@/lib/prisma";
import { Event } from "@prisma/client";

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
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        date: data.date,
        location: data.location,
        venue: data.venue,
        image: data.image,
        showtimes: data.showtimes,
        artists: data.artists as any,
        ageLimit: data.ageLimit,
        duration: data.duration,
        languages: data.languages,
        ticketTypes: data.ticketTypes as any,
        seatingChart: data.seatingChart as any,
      }
    });
    return { success: true, event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, data: Partial<Event>) {
  try {
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
    await prisma.event.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function seedEvents(sampleEvents: any[]) {
  try {
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

export async function deleteAllEvents() {
  try {
    await prisma.booking.deleteMany({});
    await prisma.event.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Error deleting all events:", error);
    return { success: false, error: "Failed to delete all events" };
  }
}
