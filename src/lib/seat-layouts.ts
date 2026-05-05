// ─── TYPES & INTERFACES ───

export type SeatCategory = "Standard" | "Premium" | "VIP" | "Balcony";

export interface Seat {
  id: string;
  blockId: string;
  row: number;
  col: number;
  category: SeatCategory;
  price: number;
  status: "available" | "unavailable" | "selected";
}

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
  hideLeftLabel?: boolean;
  hideRightLabel?: boolean;
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

// ─── CONSTANTS ───

// Default prices
export const DEFAULT_PRICES: Record<SeatCategory, number> = {
  Standard: 299,
  Premium: 599,
  VIP: 999,
  Balcony: 449,
};

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
    { id: "FRW", category: "VIP", rows: 5, cols: 7, colsPerRow: [4, 5, 6, 7, 7], position: { top: 453, left: 738 }, rotation: 16, rowLabelOffset: 0, colOffset: 25, hideRightLabel: true },
    { id: "FC", category: "Standard", rows: 5, cols: 12, colsPerRow: [10, 12, 14, 16, 18], position: { top: 430, left: 311 }, rotation: 0, rowLabelOffset: 0, colOffset: 7, hideLeftLabel: true, hideRightLabel: true },
    { id: "FLW", category: "Standard", rows: 5, cols: 7, colsPerRow: [4, 5, 6, 7, 7], position: { top: 494, left: 121 }, rotation: -16, rowLabelOffset: 0, colOffset: 0, hideLeftLabel: true },

    // ── MIDDLE TIER (F-M) ──
    { id: "MLW", category: "Standard", rows: 8, cols: 6, colsPerRow: [4, 4, 5, 5, 6, 6, 6, 6], position: { top: 257, left: 137 }, rotation: -13, rowLabelOffset: 5, colOffset: 0, hideLeftLabel: true },
    { id: "MCL", category: "Standard", rows: 8, cols: 6, colsPerRow: [5, 5, 6, 6, 7, 7, 8, 8], position: { top: 219, left: 311 }, rotation: -4.5, rowLabelOffset: 5, colOffset: 6, hideLeftLabel: true, hideRightLabel: true },
    { id: "MCR", category: "Standard", rows: 8, cols: 6, colsPerRow: [5, 5, 6, 6, 7, 7, 8, 8], position: { top: 206, left: 522 }, rotation: 4.5, rowLabelOffset: 5, colOffset: 14, hideLeftLabel: true, hideRightLabel: true },
    { id: "MRW", category: "Premium", rows: 8, cols: 6, colsPerRow: [4, 4, 5, 5, 6, 6, 6, 6], position: { top: 228, left: 740 }, rotation: 13, rowLabelOffset: 5, colOffset: 22, hideRightLabel: true },

    // ── BALCONY (N-R) ──
    { id: "BLW", category: "Balcony", rows: 5, cols: 10, colsPerRow: [6, 7, 8, 9, 10], position: { top: 93, left: 56 }, rotation: -13, rowLabelOffset: 10, colOffset: 0, hideLeftLabel: true },
    { id: "BC", category: "Standard", rows: 5, cols: 20, colsPerRow: [14, 16, 18, 20, 20], position: { top: 30, left: 290 }, rotation: 0, rowLabelOffset: 13, colOffset: 10, hideLeftLabel: true, hideRightLabel: true },
    { id: "BRW", category: "Balcony", rows: 5, cols: 10, colsPerRow: [6, 7, 8, 9, 10], position: { top: 45, left: 740 }, rotation: 13, rowLabelOffset: 5, colOffset: 30, hideRightLabel: true },
  ],
};

// ─── FUNCTIONS ───

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