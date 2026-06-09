"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Event, Seat, SeatSection } from "@/lib/types";

type BookingStep = "showtime" | "seats" | "summary" | "payment" | "confirmation";

export interface BookingFlowState {
  step: BookingStep;
  event: Event | null;
  selectedDate: string;
  selectedShowtime: string;
  ticketCount: number;
  ticketCategories: Record<string, number>;
  selectedSeats: { seat: Seat; section: SeatSection }[];
  bookingId: string | null;
}

interface BookingFlowContextValue {
  state: BookingFlowState;
  setEvent: (event: Event) => void;
  selectDate: (date: string) => void;
  selectShowtime: (time: string) => void;
  setTicketCount: (count: number) => void;
  setTicketCategories: (categories: Record<string, number>) => void;
  updateTicketCategory: (type: string, delta: number) => void;
  setSelectedSeats: (seats: { seat: Seat; section: SeatSection }[]) => void;
  goTo: (step: BookingStep) => void;
  goBack: () => void;
  setBookingId: (id: string) => void;
  reset: () => void;
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

const STEP_ORDER: BookingStep[] = ["showtime", "seats", "summary", "payment", "confirmation"];

function getInitialStep(event: Event | null): BookingStep {
  if (!event) return "showtime";
  if (event.seatingChart) return "seats";
  return "summary";
}

export function BookingFlowProvider({ children, initialEvent }: { children: ReactNode; initialEvent?: Event }) {
  const [state, setState] = useState<BookingFlowState>({
    step: getInitialStep(initialEvent ?? null),
    event: initialEvent ?? null,
    selectedDate: initialEvent?.date ?? "",
    selectedShowtime: initialEvent?.showtimes?.[0] ?? "",
    ticketCount: 1,
    ticketCategories: {},
    selectedSeats: [],
    bookingId: null,
  });

  const setEvent = useCallback((event: Event) => {
    setState((prev) => ({
      ...prev,
      event,
      selectedDate: prev.selectedDate || event.date,
      selectedShowtime: prev.selectedShowtime || (event.showtimes?.[0] ?? ""),
    }));
  }, []);

  const selectDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date }));
  }, []);

  const selectShowtime = useCallback((time: string) => {
    setState((prev) => ({ ...prev, selectedShowtime: time }));
  }, []);

  const setTicketCount = useCallback((count: number) => {
    setState((prev) => ({ ...prev, ticketCount: count }));
  }, []);

  const setTicketCategories = useCallback((categories: Record<string, number>) => {
    setState((prev) => ({ ...prev, ticketCategories: categories }));
  }, []);

  const updateTicketCategory = useCallback((type: string, delta: number) => {
    setState((prev) => {
      const current = prev.ticketCategories[type] || 0;
      const newCount = Math.max(0, current + delta);
      const newCategories = { ...prev.ticketCategories, [type]: newCount };
      const totalCount = Object.values(newCategories).reduce((sum, c) => sum + c, 0);
      return { ...prev, ticketCategories: newCategories, ticketCount: totalCount };
    });
  }, []);

  const setSelectedSeats = useCallback((seats: { seat: Seat; section: SeatSection }[]) => {
    setState((prev) => ({ ...prev, selectedSeats: seats }));
  }, []);

  const goTo = useCallback((step: BookingStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      const prevStep = idx > 0 ? STEP_ORDER[idx - 1] : prev.step;
      return { ...prev, step: prevStep };
    });
  }, []);

  const setBookingId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, bookingId: id }));
  }, []);

  const reset = useCallback(() => {
    setState({
      step: "showtime",
      event: null,
      selectedDate: "",
      selectedShowtime: "",
      ticketCount: 1,
      ticketCategories: {},
      selectedSeats: [],
      bookingId: null,
    });
  }, []);

  return (
    <BookingFlowContext.Provider
      value={{
        state,
        setEvent,
        selectDate,
        selectShowtime,
        setTicketCount,
        setTicketCategories,
        updateTicketCategory,
        setSelectedSeats,
        goTo,
        goBack,
        setBookingId,
        reset,
      }}
    >
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow must be used within BookingFlowProvider");
  return ctx;
}
