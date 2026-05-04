export type SeatCategory = "Standard" | "Premium" | "VIP" | "Balcony";

export interface SeatBlock {
  id: string;
  category: SeatCategory;
  rows: number;
  cols: number;
  colsPerRow?: number[]; // Optional: specifies number of seats in each row
  position: {
    top: number;
    left: number;
  };
  rotation: number; // degrees
  rowLabelOffset?: number; // 0 for A, 1 for B, etc.
  colOffset?: number; // Starting number for first column
}

export interface AuditoriumLayoutConfig {
  name: string;
  blocks: SeatBlock[];
}

export interface SeatLayoutConfig {
  rows: {
    rowLabel: string;
    seats: number;
    category: SeatCategory;
    gapAfter?: number;
  }[];
}

export const SEAT_LAYOUTS: Record<string, SeatLayoutConfig> = {
  default: {
    rows: [
      { rowLabel: "A", seats: 12, category: "VIP" },
      { rowLabel: "B", seats: 12, category: "VIP" },
      { rowLabel: "C", seats: 14, category: "VIP" },
      { rowLabel: "D", seats: 14, category: "VIP" },
      { rowLabel: "E", seats: 16, category: "VIP" },
      { rowLabel: "F", seats: 18, category: "Premium" },
      { rowLabel: "G", seats: 18, category: "Premium" },
      { rowLabel: "H", seats: 20, category: "Premium" },
      { rowLabel: "I", seats: 20, category: "Premium" },
      { rowLabel: "J", seats: 22, category: "Standard" },
      { rowLabel: "K", seats: 22, category: "Standard" },
      { rowLabel: "L", seats: 24, category: "Standard" },
      { rowLabel: "M", seats: 24, category: "Standard" },
      { rowLabel: "N", seats: 28, category: "Balcony" },
      { rowLabel: "O", seats: 28, category: "Balcony" },
      { rowLabel: "P", seats: 30, category: "Balcony" },
      { rowLabel: "Q", seats: 30, category: "Balcony" },
      { rowLabel: "R", seats: 32, category: "Balcony" },
    ],
  },
};

// Mirrors the RIC auditorium image exactly
export const RIC_AUDITORIUM: AuditoriumLayoutConfig = {
  name: "RIC Auditorium",
  blocks: [
    // ── FRONT TIER (A-E) ──
    { id: "FLW", category: "Premium", rows: 5, cols: 7, colsPerRow: [4, 5, 6, 7, 7], position: { top: 380, left: 160 }, rotation: -20, rowLabelOffset: 0, colOffset: 0 },
    { id: "FC", category: "VIP", rows: 5, cols: 12, colsPerRow: [10, 12, 14, 16, 18], position: { top: 400, left: 400 }, rotation: 0, rowLabelOffset: 0, colOffset: 7 },
    { id: "FRW", category: "Premium", rows: 5, cols: 7, colsPerRow: [4, 5, 6, 7, 7], position: { top: 380, left: 700 }, rotation: 20, rowLabelOffset: 0, colOffset: 25 },

    // ── MIDDLE TIER (F-M) ──
    { id: "MLW", category: "Standard", rows: 8, cols: 6, colsPerRow: [4, 4, 5, 5, 6, 6, 6, 6], position: { top: 220, left: 100 }, rotation: -25, rowLabelOffset: 5, colOffset: 0 },
    { id: "MCL", category: "Standard", rows: 8, cols: 6, colsPerRow: [5, 5, 6, 6, 7, 7, 8, 8], position: { top: 200, left: 340 }, rotation: -8, rowLabelOffset: 5, colOffset: 6 },
    { id: "MCR", category: "Standard", rows: 8, cols: 6, colsPerRow: [5, 5, 6, 6, 7, 7, 8, 8], position: { top: 200, left: 540 }, rotation: 8, rowLabelOffset: 5, colOffset: 14 },
    { id: "MRW", category: "Standard", rows: 8, cols: 6, colsPerRow: [4, 4, 5, 5, 6, 6, 6, 6], position: { top: 220, left: 780 }, rotation: 25, rowLabelOffset: 5, colOffset: 22 },

    // ── BALCONY (N-R) ──
    { id: "BLW", category: "Balcony", rows: 5, cols: 10, colsPerRow: [6, 7, 8, 9, 10], position: { top: 60, left: 60 }, rotation: -35, rowLabelOffset: 13, colOffset: 0 },
    { id: "BC", category: "Balcony", rows: 5, cols: 20, colsPerRow: [14, 16, 18, 20, 20], position: { top: 40, left: 300 }, rotation: 0, rowLabelOffset: 13, colOffset: 10 },
    { id: "BRW", category: "Balcony", rows: 5, cols: 10, colsPerRow: [6, 7, 8, 9, 10], position: { top: 60, left: 780 }, rotation: 35, rowLabelOffset: 13, colOffset: 30 },
  ],
};

export function generateSeatsFromAuditorium(
  layout: AuditoriumLayoutConfig,
  prices: Record<SeatCategory, number>,
  unavailableSeats: string[] = []
): Seat[] {
  const seats: Seat[] = [];

  for (const block of layout.blocks) {
    for (let r = 0; r < block.rows; r++) {
      for (let c = 0; c < block.cols; c++) {
        const index = r * block.cols + c;
        const id = `${block.id}-${index}`;
        seats.push({
          id,
          blockId: block.id,
          row: r,
          col: c,
          category: block.category,
          price: prices[block.category],
          status: unavailableSeats.includes(id) ? "unavailable" : "available",
        });
      }
    }
  }

  return seats;
}

export interface Seat {
  id: string;
  blockId: string;
  row: number;
  col: number;
  category: SeatCategory;
  price: number;
  status: "available" | "unavailable" | "selected";
}

// Default prices
export const DEFAULT_PRICES: Record<SeatCategory, number> = {
  Standard: 299,
  Premium: 599,
  VIP: 999,
  Balcony: 449,
};