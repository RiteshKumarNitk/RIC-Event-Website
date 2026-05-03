// Default RIC Main Hall seat layout configuration
// Stage at bottom center, rows A (front) to R (back)

export type SeatZone = "VIP" | "Premium" | "Standard" | "Balcony";

export interface SeatConfig {
  rowId: string;
  seats: number;
  zone: SeatZone;
  blocked: number[];
}

export interface SectionConfig {
  sectionName: string;
  rows: SeatConfig[];
}

// Row labels from A (front) to R (back)
const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];

export function generateRICMainHallLayout(): SectionConfig[] {
  const sections: SectionConfig[] = [];

  // Center Sections (white/neutral, vertical, centered)
  
  // Center Back - 3 rows × 14 seats (Rows R, Q, P)
  sections.push({
    sectionName: "Center Back",
    rows: [
      { rowId: 'R', seats: 14, zone: 'Balcony', blocked: [] },
      { rowId: 'Q', seats: 14, zone: 'Balcony', blocked: [] },
      { rowId: 'P', seats: 14, zone: 'Balcony', blocked: [] },
    ]
  });

  // Upper Center Left - 5 rows × 5 seats (Rows O, N, M, L, K)
  sections.push({
    sectionName: "Upper Center Left",
    rows: [
      { rowId: 'O', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'N', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'M', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'L', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'K', seats: 5, zone: 'Premium', blocked: [] },
    ]
  });

  // Upper Center Right - 5 rows × 5 seats (Rows O, N, M, L, K) - mirror
  sections.push({
    sectionName: "Upper Center Right",
    rows: [
      { rowId: 'O', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'N', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'M', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'L', seats: 5, zone: 'Premium', blocked: [] },
      { rowId: 'K', seats: 5, zone: 'Premium', blocked: [] },
    ]
  });

  // Center Front - 4 rows × 8 seats (Rows D, C, B, A)
  sections.push({
    sectionName: "Center Front",
    rows: [
      { rowId: 'D', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'C', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'B', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'A', seats: 8, zone: 'Premium', blocked: [] },
    ]
  });

  // Left Sections (angled inward, pointing toward stage)

  // Left Far - 9 rows × 5 seats (Rows Q, P, O, N, M, L, K, J, I)
  sections.push({
    sectionName: "Left Far",
    rows: [
      { rowId: 'Q', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'P', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'O', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'N', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'M', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'L', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'K', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'J', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'I', seats: 5, zone: 'Balcony', blocked: [] },
    ]
  });

  // Left Wing Upper - 6 rows × 6 seats (Rows O, N, M, L, K, J)
  sections.push({
    sectionName: "Left Wing Upper",
    rows: [
      { rowId: 'O', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'N', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'M', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'L', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'K', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'J', seats: 6, zone: 'Standard', blocked: [] },
    ]
  });

  // Left Wing Mid A - 4 rows × 3 seats (Rows I, H, G, F)
  sections.push({
    sectionName: "Left Wing Mid A",
    rows: [
      { rowId: 'I', seats: 3, zone: 'Standard', blocked: [] },
      { rowId: 'H', seats: 3, zone: 'Standard', blocked: [] },
      { rowId: 'G', seats: 3, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 3, zone: 'Standard', blocked: [] },
    ]
  });

  // Left Wing Mid B - 5 rows × 4 seats (Rows E, D, C, B, A)
  sections.push({
    sectionName: "Left Wing Mid B",
    rows: [
      { rowId: 'E', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'D', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'C', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'B', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'A', seats: 4, zone: 'Standard', blocked: [] },
    ]
  });

  // Left Wing Lower - 7 rows × 6 seats (Rows G, F, E, D, C, B, A)
  sections.push({
    sectionName: "Left Wing Lower",
    rows: [
      { rowId: 'G', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'E', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'D', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'C', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'B', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'A', seats: 6, zone: 'Standard', blocked: [] },
    ]
  });

  // Right Sections (mirror of left, counter-clockwise)

  // Right Far - 9 rows × 5 seats
  sections.push({
    sectionName: "Right Far",
    rows: [
      { rowId: 'Q', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'P', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'O', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'N', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'M', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'L', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'K', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'J', seats: 5, zone: 'Balcony', blocked: [] },
      { rowId: 'I', seats: 5, zone: 'Balcony', blocked: [] },
    ]
  });

  // Right Wing Upper - 6 rows × 6 seats
  sections.push({
    sectionName: "Right Wing Upper",
    rows: [
      { rowId: 'O', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'N', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'M', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'L', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'K', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'J', seats: 6, zone: 'Standard', blocked: [] },
    ]
  });

  // Right Wing Mid A - 4 rows × 3 seats
  sections.push({
    sectionName: "Right Wing Mid A",
    rows: [
      { rowId: 'I', seats: 3, zone: 'Standard', blocked: [] },
      { rowId: 'H', seats: 3, zone: 'Standard', blocked: [] },
      { rowId: 'G', seats: 3, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 3, zone: 'Standard', blocked: [] },
    ]
  });

  // Right Wing Mid B - 5 rows × 4 seats
  sections.push({
    sectionName: "Right Wing Mid B",
    rows: [
      { rowId: 'E', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'D', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'C', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'B', seats: 4, zone: 'Standard', blocked: [] },
      { rowId: 'A', seats: 4, zone: 'Standard', blocked: [] },
    ]
  });

  // Right Wing Lower - 7 rows × 6 seats
  sections.push({
    sectionName: "Right Wing Lower",
    rows: [
      { rowId: 'G', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'E', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'D', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'C', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'B', seats: 6, zone: 'Standard', blocked: [] },
      { rowId: 'A', seats: 6, zone: 'Standard', blocked: [] },
    ]
  });

  return sections;
}

export function calculateTotalSeats(sections: SectionConfig[]): number {
  return sections.reduce((total, section) => {
    return total + section.rows.reduce((sectionTotal, row) => {
      return sectionTotal + (row.seats - row.blocked.length);
    }, 0);
  }, 0);
}
