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
  xStart: number;
  yStart: number;
  angle: number;
  arcRadius?: number;
}

// Row labels from A (front) to R (back)
const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];

export function generateRICMainHallLayout(): SectionConfig[] {
  const sections: SectionConfig[] = [];

  // Balcony Top (Arc)
  sections.push({
    sectionName: "Balcony",
    xStart: 350,
    yStart: 240,
    angle: 0,
    arcRadius: 320,
    rows: [
      { rowId: 'R', seats: 20, zone: 'Balcony', blocked: [] },
      { rowId: 'Q', seats: 20, zone: 'Balcony', blocked: [] },
      { rowId: 'P', seats: 20, zone: 'Balcony', blocked: [] },
      { rowId: 'O', seats: 20, zone: 'Balcony', blocked: [] },
      { rowId: 'N', seats: 20, zone: 'Balcony', blocked: [] },
    ]
  });

  // Center Left
  sections.push({
    sectionName: "Center Left",
    xStart: 240,
    yStart: 300,
    angle: 0,
    rows: [
      { rowId: 'M', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'L', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'K', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'J', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'I', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'H', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'G', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 5, zone: 'Standard', blocked: [] },
    ]
  });

  // Center Right
  sections.push({
    sectionName: "Center Right",
    xStart: 420,
    yStart: 300,
    angle: 0,
    rows: [
      { rowId: 'M', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'L', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'K', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'J', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'I', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'H', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'G', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 5, zone: 'Standard', blocked: [] },
    ]
  });

  // Center Front
  sections.push({
    sectionName: "Center Front",
    xStart: 295,
    yStart: 440,
    angle: 0,
    rows: [
      { rowId: 'E', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'D', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'C', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'B', seats: 8, zone: 'Premium', blocked: [] },
      { rowId: 'A', seats: 8, zone: 'Premium', blocked: [] },
    ]
  });

  // Left Top Wing
  sections.push({
    sectionName: "Left Top Wing",
    xStart: 70,
    yStart: 180,
    angle: 45,
    rows: [
      { rowId: 'Q', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'P', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'O', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'N', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'M', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'L', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'K', seats: 4, zone: 'Balcony', blocked: [] },
    ]
  });

  // Left Bottom Wing
  sections.push({
    sectionName: "Left Bottom Wing",
    xStart: 100,
    yStart: 400,
    angle: 45,
    rows: [
      { rowId: 'G', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'E', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'D', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'C', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'B', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'A', seats: 5, zone: 'Standard', blocked: [] },
    ]
  });

  // Right Top Wing
  sections.push({
    sectionName: "Right Top Wing",
    xStart: 700 - 70 - (4 * 20),
    yStart: 180,
    angle: -45,
    rows: [
      { rowId: 'Q', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'P', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'O', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'N', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'M', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'L', seats: 4, zone: 'Balcony', blocked: [] },
      { rowId: 'K', seats: 4, zone: 'Balcony', blocked: [] },
    ]
  });

  // Right Bottom Wing
  sections.push({
    sectionName: "Right Bottom Wing",
    xStart: 700 - 100 - (5 * 20),
    yStart: 400,
    angle: -45,
    rows: [
      { rowId: 'G', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'F', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'E', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'D', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'C', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'B', seats: 5, zone: 'Standard', blocked: [] },
      { rowId: 'A', seats: 5, zone: 'Standard', blocked: [] },
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
