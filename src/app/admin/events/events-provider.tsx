"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Event } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getEvents as serverGetEvents, addEvent as serverAddEvent, updateEvent as serverUpdateEvent, deleteEvent as serverDeleteEvent, deleteAllEvents as serverDeleteAllEvents } from '@/app/actions/event-actions';

interface EventsContextType {
  events: Event[];
  loading: boolean;
  refreshEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  seedDatabase: () => Promise<void>;
  deleteAllEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchedRef = useRef(false);

  const fetchEvents = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return;
    setLoading(true);
    try {
      const data = await serverGetEvents();
      const formattedEvents = data.map((e: any) => ({
        ...e,
        date: new Date(e.date).toISOString()
      })) as Event[];
      setEvents(formattedEvents);
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching events: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch events from the database." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refreshEvents = useCallback(async () => {
    fetchedRef.current = false;
    await fetchEvents(true);
  }, [fetchEvents]);

  const addEvent = async (event: Omit<Event, 'id'>) => {
    try {
      const res = await serverAddEvent({
        ...event,
        date: new Date(event.date)
      } as any);
      
      if (res.success) {
        toast({ title: "Success", description: "Event created successfully." });
        await refreshEvents();
      } else {
        throw new Error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error adding event: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not create event." });
    }
  };

  const updateEvent = async (id: string, event: Partial<Event>) => {
    try {
      const dataToUpdate = { ...event } as any;
      if (event.date) {
        dataToUpdate.date = new Date(event.date);
      }
      const res = await serverUpdateEvent(id, dataToUpdate);
      
      if (res.success) {
        toast({ title: "Success", description: "Event updated successfully." });
        await refreshEvents();
      } else {
        throw new Error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error updating event: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not update event." });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const res = await serverDeleteEvent(id);
      if (res.success) {
        toast({ title: "Success", description: "Event deleted successfully." });
        await refreshEvents();
      } else {
        throw new Error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not delete event." });
    }
  };

  const seedDatabase = async () => {
    try {
      const { sampleEvents } = await import('@/lib/dummy-data');
      const { seedEvents } = await import('@/app/actions/event-actions');
      const res = await seedEvents(sampleEvents);
      if (res.success) {
        toast({ title: 'Database Seeded', description: 'Sample events have been added.' });
        await fetchEvents();
      } else {
        toast({ title: 'Database Not Empty', description: res.error || 'Seeding was skipped because events already exist.' });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Seeding Failed', description: 'Could not seed database.' });
    }
  };
  
  const deleteAllEvents = async () => {
    try {
      const res = await serverDeleteAllEvents();
      if (res.success) {
        toast({ title: 'Events Cleared', description: 'All events and associated bookings have been deleted.' });
        await refreshEvents();
      } else {
        toast({ variant: 'destructive', title: 'Failed', description: res.error || 'Could not delete all events.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not delete all events.' });
    }
  };

  return (
    <EventsContext.Provider value={{ events, loading, refreshEvents, addEvent, updateEvent, deleteEvent, seedDatabase, deleteAllEvents }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
