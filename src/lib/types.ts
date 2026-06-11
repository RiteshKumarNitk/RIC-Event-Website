
export type EventCategory = "Music" | "Sports" | "Art" | "Theater" | "Seminar" | "Cultural" | "Talk" | "Comedy";

export type TicketType = {
  type: string;
  price: number;
};

export type Seat = {
  id: string; // e.g., "A1"
  row: string;
  col: number;
  isBooked: boolean;
};

export type SeatRow = {
    rowId: string;
    seats: number;
    offset?: number;
};

export type SeatSection = {
  sectionName: string;
  price: number;
  rows: SeatRow[];
  className: string;
}

export type SeatingChartTiers = {
    tierName: string;
    sections: SeatSection[];
}[];


export type SeatingChartData = {
  tiers?: SeatingChartTiers;
  rows?: number;
  cols?: number;
  totalSeats?: number;
  layout?: string;
};

export type Artist = {
  name: string;
  photo: string;
  category: string;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  venue: string;
  image: string;
  showtimes: string[];
  artists?: Artist[];
  ageLimit?: string;
  duration?: number;
  languages?: string[];
  ticketTypes: TicketType[];
  hallId?: string;
  seatingChart?: SeatingChartData;
};

export type Attendee = {
  seatId: string;
  price: number;
  attendeeName: string;
  memberId?: string;
  isMember: boolean;
  memberIdVerified: boolean;
};

export type Booking = {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  attendees: Attendee[];
  total: number;
  bookingDate: string;
};

export interface Member {
    id: string;
    memberId: number;
    categoryType: string;
    categoryAcronym: string;
    doa: string; // Date of Association
    name: string;
    phone: string;
    email: string;
    dob: string;
    address: string;
    emergencyContact: string;
};
