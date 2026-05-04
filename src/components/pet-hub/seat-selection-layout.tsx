"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface Seat {
  id: string;
  row: string;
  number: number;
  category: "Standard" | "Premium";
  price: number;
  status: "available" | "unavailable" | "selected";
}

export interface SeatSelectionLayoutProps {
  serviceName: string;
  date: string;
  timeSlot: string;
  venue: string;
  seatsData: Seat[];
  maxSeats?: number;
  onProceed?: (selectedSeats: Seat[]) => void;
}

const CATEGORY_COLORS: Record<
  string,
  { available: string; selected: string; selectedBorder: string; label: string }
> = {
  Standard: {
    available: "bg-sky-500/80 hover:bg-sky-400",
    selected: "bg-emerald-500",
    selectedBorder: "border-emerald-400",
    label: "bg-sky-500",
  },
  Premium: {
    available: "bg-violet-500/80 hover:bg-violet-400",
    selected: "bg-emerald-500",
    selectedBorder: "border-emerald-400",
    label: "bg-violet-500",
  },
};

const mockSeatsData: Seat[] = (() => {
  const rows = ["A", "B", "C", "D", "E"];
  const seats: Seat[] = [];
  for (const row of rows) {
    for (let num = 1; num <= 10; num++) {
      const isPremium = row === "D" || row === "E";
      const rand = Math.random();
      const status: Seat["status"] =
        rand < 0.25 ? "unavailable" : rand < 0.3 ? "selected" : "available";
      seats.push({
        id: `${row}${num}`,
        row,
        number: num,
        category: isPremium ? "Premium" : "Standard",
        price: isPremium ? 599 : 299,
        status,
      });
    }
  }
  return seats;
})();

export { mockSeatsData };

export function SeatSelectionLayout({
  serviceName,
  date,
  timeSlot,
  venue,
  seatsData,
  maxSeats = 6,
  onProceed,
}: SeatSelectionLayoutProps) {
  const [seats, setSeats] = useState<Seat[]>(seatsData);

  const rowOrder = useMemo(() => {
    const order: string[] = [];
    for (const seat of seats) {
      if (!order.includes(seat.row)) order.push(seat.row);
    }
    return order.sort();
  }, [seats]);

  const colCount = useMemo(() => {
    const max = Math.max(...seats.map((s) => s.number));
    return max;
  }, [seats]);

  const seatsByRow = useMemo(() => {
    const map: Record<string, Seat[]> = {};
    for (const seat of seats) {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
    }
    for (const row of Object.keys(map)) {
      map[row].sort((a, b) => a.number - b.number);
    }
    return map;
  }, [seats]);

  const selectedSeats = useMemo(() => seats.filter((s) => s.status === "selected"), [seats]);

  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + s.price, 0),
    [selectedSeats]
  );

  const handleSeatClick = (seatId: string) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seatId) return s;
        if (s.status === "unavailable") return s;
        if (s.status === "selected") return { ...s, status: "available" as const };
        if (s.status === "available") {
          const currentSelected = prev.filter((x) => x.status === "selected").length;
          if (currentSelected >= maxSeats) return s;
          return { ...s, status: "selected" as const };
        }
        return s;
      })
    );
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    onProceed?.(selectedSeats);
  };

  const seatSizeClass = "w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10";

  return (
    <div className="min-h-screen bg-[#0f1118] text-white flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#1a1d2e] border-b border-white/5 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold leading-tight">{serviceName}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{venue}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-zinc-200">{date}</p>
              <p className="text-xs text-zinc-400">{timeSlot}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Seat Map Area */}
      <main className="flex-1 px-4 py-6 pb-36 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Screen / Stage Indicator */}
          <div className="flex justify-center mb-8">
            <div className="relative w-full max-w-md">
              <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent rounded-full" />
              <div
                className="absolute -top-0 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-b-full"
                style={{
                  background:
                    "radial-gradient(ellipse at top, rgba(16,185,129,0.12) 0%, transparent 70%)",
                }}
              />
              <p className="text-center text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-2 font-semibold">
                Service Counter
              </p>
            </div>
          </div>

          {/* Seat Grid */}
          <div className="flex flex-col items-center gap-2 mb-10">
            {rowOrder.map((row) => (
              <div key={row} className="flex items-center gap-1.5 sm:gap-2">
                {/* Row Label */}
                <div className="w-5 text-center text-xs font-bold text-zinc-500 shrink-0">
                  {row}
                </div>

                {/* Seats */}
                {seatsByRow[row]?.map((seat, idx) => {
                  const isAvailable = seat.status === "available";
                  const isSelected = seat.status === "selected";
                  const isUnavailable = seat.status === "unavailable";
                  const colors = CATEGORY_COLORS[seat.category] ?? CATEGORY_COLORS.Standard;

                  const isGap =
                    colCount >= 8 &&
                    ((colCount === 10 && (idx === 4)) ||
                      (colCount === 12 && (idx === 5)));

                  return (
                    <div key={seat.id} className="flex items-center">
                      {isGap && <div className="w-3 sm:w-5" />}
                      <button
                        type="button"
                        onClick={() => handleSeatClick(seat.id)}
                        disabled={isUnavailable}
                        title={`${seat.category} - ${seat.row}${seat.number} - ₹${seat.price}${isUnavailable ? " (Unavailable)" : ""}`}
                        className={cn(
                          seatSizeClass,
                          "rounded-md text-[9px] sm:text-[10px] font-bold border transition-all duration-150 shrink-0 flex items-center justify-center relative overflow-hidden",
                          isAvailable && cn(colors.available, "border-white/10 text-white/90 cursor-pointer active:scale-90"),
                          isSelected && cn("text-white border-2 shadow-lg shadow-emerald-500/20 scale-105", colors.selected, colors.selectedBorder),
                          isUnavailable && "bg-zinc-700/40 border-zinc-700/50 text-zinc-600 cursor-not-allowed"
                        )}
                        aria-label={`Seat ${seat.id}, ${seat.category}, ₹${seat.price}, ${seat.status}`}
                      >
                        <span className="relative z-10">{seat.number}</span>
                        {isSelected && (
                          <span className="absolute inset-0 bg-white/10 animate-pulse" />
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Row Label (right side) */}
                <div className="w-5 text-center text-xs font-bold text-zinc-500 shrink-0">
                  {row}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-sky-500/80 border border-white/10" />
              <span className="text-xs text-zinc-400">Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-violet-500/80 border border-white/10" />
              <span className="text-xs text-zinc-400">Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-emerald-500 border border-emerald-400" />
              <span className="text-xs text-zinc-400">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-zinc-700/40 border border-zinc-700/50" />
              <span className="text-xs text-zinc-400">Unavailable</span>
            </div>
          </div>

          {/* Max seats info */}
          <p className="text-center text-[11px] text-zinc-600">
            Max {maxSeats} {maxSeats === 1 ? "seat" : "seats"} per booking
          </p>
        </div>
      </main>

      {/* Bottom Sticky Panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
          selectedSeats.length > 0 ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-[#1a1d2e] border-t border-white/5 shadow-2xl shadow-black/40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xl font-black text-white">
                ₹{totalPrice.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {selectedSeats.length} {selectedSeats.length === 1 ? "Seat" : "Seats"}
                {selectedSeats.length > 0 && (
                  <span className="text-zinc-500 ml-1">
                    &middot; {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleProceed}
              disabled={selectedSeats.length === 0}
              className={cn(
                "px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all duration-200 shrink-0",
                selectedSeats.length > 0
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.97]"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              )}
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
