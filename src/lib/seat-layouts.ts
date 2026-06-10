// ─── TYPES & INTERFACES ───

export type SeatCategory = "Standard" | "Premium" | "VIP" | "Balcony" | "Members";

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
  colOffset?: number; // Starting number for first column (legacy)
  colOffsetsPerRow?: number[]; // Dynamic starting number for each row
  hideLeftLabel?: boolean;
  hideRightLabel?: boolean;
  align?: "left" | "center" | "right"; // Alignment of seats within the block
  membersOnly?: boolean; // Only visible to verified members
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
  Members: 0,
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
    // ── MEMBERS EXCLUSIVE (Front rows, free for members) ──
    // { id: "MEM", category: "Members", rows: 3, cols: 16, colsPerRow: [14, 16, 16], colOffsetsPerRow: [0, 0, 0], position: { top: 608, left: 380 }, rotation: 0, rowLabelOffset: 0, colOffset: 0, align: "center", membersOnly: true },

    // ── FRONT TIER (A-E) ──
    { id: "FLW", category: "Standard", rows: 5, cols: 15, colsPerRow: [14, 15, 15, 15, 15], colOffsetsPerRow: [0, 0, 0, 0, 0], position: { top: 550, left: 131 }, rotation: -16, rowLabelOffset: 0, colOffset: 0, hideLeftLabel: true, align: "right" },
    { id: "FC", category: "Standard", rows: 5, cols: 7, colsPerRow: [7, 6, 6, 6, 6], colOffsetsPerRow: [14, 15, 15, 15, 15], position: { top: 440, left: 526 }, rotation: 0, rowLabelOffset: 0, colOffset: 7, hideLeftLabel: true, hideRightLabel: true, align: "center" },
    { id: "FRW", category: "VIP", rows: 5, cols: 21, colsPerRow: [21, 21, 20, 14, 15], colOffsetsPerRow: [21, 21, 21, 21, 21], position: { top: 453, left: 753 }, rotation: 16, rowLabelOffset: 0, colOffset: 25, hideRightLabel: true, align: "left" },

    // ── MIDDLE TIER (F-M) ──
    { id: "ML", category: "Standard", rows: 8, cols: 12, colsPerRow: [9, 10, 10, 11, 11, 12, 5, 10], colOffsetsPerRow: [0, 0, 0, 0, 0, 0, 0, 0], position: { top: 290, left: 78 }, rotation: -13, rowLabelOffset: 5, colOffset: 0, hideLeftLabel: true, align: "right" },
    { id: "MC", category: "Standard", rows: 8, cols: 20, colsPerRow: [16, 16, 16, 19, 20, 20, 10, 20], colOffsetsPerRow: [9, 10, 10, 11, 11, 12, 5, 10], position: { top: 219, left: 390 }, rotation: 0, rowLabelOffset: 5, colOffset: 0, hideLeftLabel: true, hideRightLabel: true, align: "center" },
    { id: "MR", category: "Standard", rows: 8, cols: 12, colsPerRow: [9, 10, 10, 11, 11, 12, 5, 10], colOffsetsPerRow: [25, 26, 26, 30, 31, 32, 15, 30], position: { top: 230, left: 870 }, rotation: 13, rowLabelOffset: 5, colOffset: 0, hideRightLabel: true, align: "left" },

    // ── BALCONY (N-R) ──
    { id: "BLW", category: "Balcony", rows: 5, cols: 12, colsPerRow: [11, 11, 12, 12, 6], colOffsetsPerRow: [0, 0, 0, 0, 0], position: { top: 100, left: 16 }, rotation: -13, rowLabelOffset: 10, colOffset: 0, hideLeftLabel: true, align: "right" },
    { id: "BC", category: "Standard", rows: 5, cols: 24, colsPerRow: [23, 24, 24, 24, 13], colOffsetsPerRow: [11, 11, 12, 12, 6], position: { top: 30, left: 348 }, rotation: 0, rowLabelOffset: 13, colOffset: 10, hideLeftLabel: true, hideRightLabel: true, align: "center" },
    { id: "BRW", category: "Balcony", rows: 5, cols: 12, colsPerRow: [11, 11, 12, 12, 6], colOffsetsPerRow: [34, 35, 36, 36, 19], position: { top: 45, left: 932 }, rotation: 13, rowLabelOffset: 5, colOffset: 30, hideRightLabel: true, align: "left" },
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