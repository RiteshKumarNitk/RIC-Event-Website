export type SeatZone = "VIP" | "Premium" | "Standard" | "Balcony";

export type HallRow = {
    rowId: string;
    seats: number;
    zone: SeatZone;
};

export type HallSection = {
    sectionName: string;
    rows: HallRow[];
};

export type HallTemplate = {
    id: string;
    name: string;
    description: string;
    sections: HallSection[];
    totalSeats: number;
};

export const MAIN_HALL_ROWS = 20;
export const MAIN_HALL_COLS = 30;

function generateMainHallRows(): HallRow[] {
    const rows: HallRow[] = [];
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

    for (let i = 0; i < MAIN_HALL_ROWS; i++) {
        let zone: SeatZone;
        if (i < 4) zone = "VIP";
        else if (i < 9) zone = "Premium";
        else if (i < 15) zone = "Standard";
        else zone = "Balcony";

        rows.push({
            rowId: rowLabels[i],
            seats: MAIN_HALL_COLS,
            zone,
        });
    }
    return rows;
}

export const HALL_TEMPLATES: HallTemplate[] = [
    {
        id: "main-hall",
        name: "Main Hall",
        description: "Primary auditorium with 600 seats across 4 zones",
        sections: [
            {
                sectionName: "Main Hall",
                rows: generateMainHallRows(),
            },
        ],
        totalSeats: 600,
    },
];

export function getHallTemplate(id: string): HallTemplate | undefined {
    return HALL_TEMPLATES.find(h => h.id === id);
}

export function getDefaultHallId(): string {
    return HALL_TEMPLATES[0].id;
}
