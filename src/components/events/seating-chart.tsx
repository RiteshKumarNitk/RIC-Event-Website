"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Event, Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CheckoutDialog } from "../checkout/checkout-dialog";
import { getBookedSeats } from '@/app/actions/booking-actions';
import { getHallForEvent } from '@/app/actions/hall-actions';
import { Skeleton } from "../ui/skeleton";

type SeatZone = "VIP" | "Premium" | "Standard" | "Balcony";

interface GridSeat extends Seat {
    rowNum: number;
    colNum: number;
    price: number;
    zone: SeatZone;
}

const ZONE_COLORS: Record<SeatZone, { fill: string; stroke: string; text: string; dot: string }> = {
    VIP: { fill: "#f472b6", stroke: "#db2777", text: "#fff", dot: "#f472b6" },
    Premium: { fill: "#2dd4bf", stroke: "#0d9488", text: "#fff", dot: "#2dd4bf" },
    Standard: { fill: "#38bdf8", stroke: "#0284c7", text: "#fff", dot: "#38bdf8" },
    Balcony: { fill: "#a78bfa", stroke: "#7c3aed", text: "#fff", dot: "#a78bfa" },
};

const SEAT_W = 30;
const SEAT_H = 28;
const SEAT_GAP = 4;
const ROW_GAP = 8;

const SeatingChartSkeleton = () => (
    <div className="w-full bg-background relative rounded-lg border shadow-lg overflow-hidden p-8 animate-pulse">
        <div className="flex justify-center items-center gap-4">
            <Skeleton className="h-6 w-8" />
            <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                    {Array.from({ length: 12 }).map((_, j) => (
                        <Skeleton key={j} className="w-6 h-6 rounded-md" />
                    ))}
                    </div>
                ))}
            </div>
        </div>
        <Skeleton className="h-12 w-1/2 mx-auto mt-12 rounded-md" />
    </div>
)

function getPriceForZone(zone: SeatZone, ticketTypes: Event['ticketTypes']): number {
    if (ticketTypes.length === 0) return 0;
    const match = ticketTypes.find(t => t.type.toLowerCase() === zone.toLowerCase());
    if (match) return match.price;
    return ticketTypes[0].price;
}

export function SeatingChart({ event, ticketCount, onTicketCountChange }: { event: Event, ticketCount: number, onTicketCountChange: (count: number) => void }) {
    const [selectedSeats, setSelectedSeats] = useState<GridSeat[]>([]);
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const { toast } = useToast();
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [hallLayout, setHallLayout] = useState<any>(null);
    const [hoveredZone, setHoveredZone] = useState<SeatZone | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const hallId = (event as any).hallId;

    useEffect(() => {
        const loadHall = async () => {
            if (!hallId) return;
            const res = await getHallForEvent(hallId);
            if (res.success && res.hall) setHallLayout(res.hall);
        };
        loadHall();
    }, [hallId]);

    useEffect(() => {
        const fetchBookedSeats = async () => {
            if (!event.id || !hallLayout) return;
            setLoadingBookings(true);
            try {
                const res = await getBookedSeats(event.id);
                if (res.success && res.seatIds) setBookedSeats(res.seatIds);
                else throw new Error(res.error);
            } catch (error) {
                console.error("Error fetching booked seats:", error);
                toast({ variant: "destructive", title: "Could not load booked seats.", description: "There was a problem fetching seat availability from the database." });
            } finally {
                setLoadingBookings(false);
            }
        };
        if (hallLayout) fetchBookedSeats();
        else if (!hallId) setLoadingBookings(false);
    }, [event.id, hallLayout, toast]);

    useEffect(() => {
        if (selectedSeats.length > ticketCount) setSelectedSeats(prev => prev.slice(0, ticketCount));
    }, [ticketCount, selectedSeats.length]);

    const handleSelectSeat = (seat: GridSeat) => {
        if (seat.isBooked) return;
        setSelectedSeats((prev) => {
            const isSelected = prev.some(s => s.id === seat.id);
            if (isSelected) return prev.filter(s => s.id !== seat.id);
            if (prev.length < ticketCount) return [...prev, seat];
            toast({ variant: "destructive", title: `You can only select a maximum of ${ticketCount} seats.`, description: "Deselect a seat to choose another." });
            return prev;
        });
    };

    const handleCheckout = () => {
        if (selectedSeats.length === 0) {
            toast({ variant: "destructive", title: "No seats selected", description: `Please select at least one seat to proceed.` });
            return;
        }
        setCheckoutOpen(true);
    };

    const getTotalPrice = () => selectedSeats.reduce((total, s) => total + s.price, 0);

    const boundingBox = useMemo(() => {
        if (!hallLayout || !hallLayout.sections) return { minX: 0, minY: 0, width: 700, height: 550 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        (hallLayout.sections as any[]).forEach(section => {
            section.rows.forEach((row: any, rowIdx: number) => {
                const baseY = section.yStart + (rowIdx * (SEAT_H + ROW_GAP));
                for (let i = 0; i < row.seats; i++) {
                    const x = section.xStart + (i * (SEAT_W + SEAT_GAP));
                    if (x < minX) minX = x;
                    if (baseY < minY) minY = baseY;
                    if (x + SEAT_W > maxX) maxX = x + SEAT_W;
                    if (baseY + SEAT_H > maxY) maxY = baseY + SEAT_H;
                }
            });
        });
        if (minX === Infinity) return { minX: 0, minY: 0, width: 700, height: 550 };
        const pad = 60;
        return { minX: minX - pad, minY: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
    }, [hallLayout]);

    const convertedSelectedSeats = selectedSeats.map(s => ({
        seat: { id: s.id, row: s.row, col: s.col, isBooked: s.isBooked },
        section: { sectionName: s.zone, price: s.price, rows: [], className: '' }
    }));

    if (loadingBookings || (!hallLayout && hallId)) return <SeatingChartSkeleton />

    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-full md:w-80 border-r bg-white overflow-y-auto p-5 hidden md:block">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-1">{event.name}</h2>
                    <p className="text-xs text-muted-foreground">Hover a category to highlight seats</p>
                </div>

                <div className="space-y-2">
                    {event.ticketTypes.map((type) => {
                        const zone = type.type as SeatZone;
                        const count = (hallLayout?.sections as any[] || []).reduce((total, sec) =>
                            total + sec.rows.reduce((rTotal: number, row: any) =>
                                row.zone === zone ? rTotal + row.seats - (row.blocked?.length || 0) : rTotal, 0
                            ), 0
                        );
                        const isBookedOut = count === 0;
                        const isHovered = hoveredZone === zone;

                        return (
                            <div
                                key={type.type}
                                className={cn("flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all",
                                    isHovered ? "border-gray-400 bg-gray-50 shadow-sm" : "hover:bg-gray-50",
                                    isBookedOut && "opacity-40"
                                )}
                                onMouseEnter={() => setHoveredZone(zone)}
                                onMouseLeave={() => setHoveredZone(null)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ZONE_COLORS[zone]?.dot || '#000' }} />
                                        <span className="font-bold text-gray-700">₹{type.price}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{count} seats</span>
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{type.type}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white border-2 border-gray-300" /><span className="text-muted-foreground">Available</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-400" /><span className="text-muted-foreground">Booked</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#F84464]" /><span className="text-muted-foreground">Selected</span></div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 relative flex flex-col bg-[#1a1a2e] overflow-hidden" ref={containerRef}>
                {/* Stage Banner */}
                <div className="bg-gradient-to-b from-gray-700 to-gray-600 text-center py-1.5 shrink-0 shadow-md relative z-10">
                    <span className="text-white text-sm font-semibold tracking-[0.3em]">STAGE</span>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start min-h-0">
                    <svg
                        viewBox={`${boundingBox.minX} ${boundingBox.minY} ${boundingBox.width} ${boundingBox.height}`}
                        className="w-full max-w-3xl mx-auto"
                        style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 100ms ease-out" }}
                    >
                        {/* Sections */}
                        {hallLayout && (hallLayout.sections as any[]).map((sectionData) => (
                            <g key={sectionData.sectionName} transform={sectionData.angle !== 0 && !sectionData.arcRadius ? `rotate(${sectionData.angle}, ${sectionData.xStart}, ${sectionData.yStart})` : undefined}>
                                {sectionData.rows.map((row: any, rowIdx: number) => {
                                    const rowY = sectionData.yStart + (rowIdx * (SEAT_H + ROW_GAP));

                                    return (
                                        <g key={row.rowId}>
                                            {/* Row Label */}
                                            <text x={sectionData.xStart - 18} y={rowY + SEAT_H / 2 + 3} textAnchor="middle" fill="#71717a" fontSize="9" fontWeight="600">{row.rowId}</text>

                                            {Array.from({ length: row.seats }).map((_, seatIdx) => {
                                                const seatNum = seatIdx + 1;
                                                const seatX = sectionData.xStart + (seatIdx * (SEAT_W + SEAT_GAP));
                                                const seatId = `${row.rowId}${seatNum}`;
                                                const isSelected = selectedSeats.some(s => s.id === seatId);
                                                const isBooked = bookedSeats.includes(seatId) || row.blocked?.includes(seatNum);
                                                const zone = row.zone as SeatZone;
                                                const colors = ZONE_COLORS[zone] || ZONE_COLORS.Standard;
                                                const isDimmed = hoveredZone && hoveredZone !== zone;

                                                const gridSeat: GridSeat = {
                                                    id: seatId, row: row.rowId, col: seatNum, isBooked: !!isBooked,
                                                    rowNum: rowIdx, colNum: seatNum, price: getPriceForZone(zone, event.ticketTypes), zone,
                                                };

                                                return (
                                                    <g
                                                        key={seatNum}
                                                        className={isBooked ? "cursor-not-allowed" : "cursor-pointer"}
                                                        onClick={() => !isBooked && handleSelectSeat(gridSeat)}
                                                        opacity={isDimmed ? 0.25 : 1}
                                                    >
                                                        <rect x={seatX} y={rowY} width={SEAT_W} height={SEAT_H} rx="5"
                                                            fill={isBooked ? "#4b5563" : isSelected ? "#F84464" : colors.fill}
                                                            stroke={isBooked ? "#6b7280" : isSelected ? "#dc2626" : colors.stroke}
                                                            strokeWidth={isSelected ? 2 : 1.5}
                                                            className={isBooked ? "" : "hover:brightness-110 transition"}
                                                        />
                                                        <text x={seatX + SEAT_W / 2} y={rowY + SEAT_H / 2 + 3} textAnchor="middle"
                                                            fill={isBooked ? "#9ca3af" : isSelected ? "#fff" : colors.text}
                                                            fontSize="8" fontWeight="700" className="pointer-events-none select-none"
                                                        >{seatNum}</text>
                                                        <title>{`${sectionData.sectionName} - Row ${row.rowId} Seat ${seatNum} - ₹${gridSeat.price}${isBooked ? ' (Booked)' : ''}`}</title>
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </g>
                        ))}
                    </svg>
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-32 right-6 flex flex-col gap-1.5 z-20">
                    <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur border-0" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4 text-gray-600" /></Button>
                    <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur border-0" onClick={() => setZoom(1)}><Maximize2 className="h-4 w-4 text-gray-600" /></Button>
                    <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur border-0" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}><ZoomOut className="h-4 w-4 text-gray-600" /></Button>
                </div>

                {/* Bottom Bar */}
                <div className={cn(
                    "bg-white border-t p-4 flex justify-center transition-all duration-300 transform fixed bottom-0 left-0 right-0 z-50 shadow-xl",
                    selectedSeats.length > 0 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                )}>
                    <div className="max-w-7xl w-full flex justify-between items-center px-4">
                        <div className="flex flex-col">
                            <div className="text-xl font-bold text-gray-800">₹{getTotalPrice()}</div>
                            <div className="text-sm text-muted-foreground">
                                {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} | {selectedSeats.map(s => `${s.row}${s.colNum}`).join(', ')}
                            </div>
                        </div>
                        <Button className="bg-[#F84464] hover:bg-[#F84464]/90 text-white px-12 py-6 rounded-lg text-lg font-bold shadow-lg" onClick={handleCheckout}>
                            Proceed
                        </Button>
                    </div>
                </div>
            </div>

            <CheckoutDialog
                isOpen={isCheckoutOpen}
                onOpenChange={setCheckoutOpen}
                event={event}
                selectedSeats={convertedSelectedSeats}
            />
        </div>
    );
}
