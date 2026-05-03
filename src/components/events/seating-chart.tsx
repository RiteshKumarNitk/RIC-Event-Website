"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Event, Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Plus, Minus } from "lucide-react";
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

const zoneColors: Record<SeatZone, string> = {
    VIP: "bg-yellow-400/30 border-yellow-500/50 hover:bg-yellow-400/50",
    Premium: "bg-blue-400/30 border-blue-500/50 hover:bg-blue-400/50",
    Standard: "bg-green-400/30 border-green-500/50 hover:bg-green-400/50",
    Balcony: "bg-gray-400/30 border-gray-500/50 hover:bg-gray-400/50",
};

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
    const containerRef = useRef<HTMLDivElement>(null);

    const hallId = (event as any).hallId;

    useEffect(() => {
        const loadHall = async () => {
            if (!hallId) return;
            const res = await getHallForEvent(hallId);
            if (res.success && res.hall) {
                setHallLayout(res.hall);
            }
        };
        loadHall();
    }, [hallId]);

    useEffect(() => {
        const fetchBookedSeats = async () => {
            if (!event.id || !hallLayout) return;
            setLoadingBookings(true);
            try {
                const res = await getBookedSeats(event.id);
                if (res.success && res.seatIds) {
                    setBookedSeats(res.seatIds);
                } else {
                    throw new Error(res.error);
                }
            } catch (error) {
                console.error("Error fetching booked seats:", error);
                toast({
                    variant: "destructive",
                    title: "Could not load booked seats.",
                    description: "There was a problem fetching seat availability from the database.",
                })
            } finally {
                setLoadingBookings(false);
            }
        };

        if (hallLayout) {
            fetchBookedSeats();
        } else if (!hallId) {
            setLoadingBookings(false);
        }
    }, [event.id, hallLayout, toast]);

    useEffect(() => {
        if (selectedSeats.length > ticketCount) {
            setSelectedSeats(prev => prev.slice(0, ticketCount));
        }
    }, [ticketCount, selectedSeats.length]);

    const gridSeats = useMemo(() => {
        if (!hallLayout) return [];

        const sections = hallLayout.sections as any[];
        const seats: GridSeat[] = [];
        let rowIdx = 0;

        sections.forEach(section => {
            section.rows.forEach((row: any) => {
                rowIdx++;
                for (let c = 1; c <= row.seats; c++) {
                    const seatId = `${row.rowId}${c}`;
                    const isBlocked = row.blocked?.includes(c);
                    const price = getPriceForZone(row.zone, event.ticketTypes);
                    seats.push({
                        id: seatId,
                        row: row.rowId,
                        col: c,
                        isBooked: bookedSeats.includes(seatId) || !!isBlocked,
                        rowNum: rowIdx,
                        colNum: c,
                        price,
                        zone: row.zone,
                    });
                }
            });
        });

        return seats;
    }, [hallLayout, bookedSeats, event.ticketTypes]);

    const handleSelectSeat = (seat: GridSeat) => {
        if (seat.isBooked) return;

        setSelectedSeats((prev) => {
            const isSelected = prev.some(s => s.id === seat.id);
            if (isSelected) {
                return prev.filter(s => s.id !== seat.id);
            }
            if (prev.length < ticketCount) {
                return [...prev, seat];
            } else {
                toast({
                    variant: "destructive",
                    title: `You can only select a maximum of ${ticketCount} seats.`,
                    description: "Deselect a seat to choose another.",
                });
                return prev;
            }
        });
    };

    const handleCheckout = () => {
        if (selectedSeats.length === 0) {
            toast({
                variant: "destructive",
                title: "No seats selected",
                description: `Please select at least one seat to proceed.`,
            });
            return;
        }
        if (selectedSeats.length !== ticketCount) {
            toast({
                variant: "destructive",
                title: `Incorrect number of seats`,
                description: `Please select exactly ${ticketCount} seats.`,
            });
            return;
        }
        setCheckoutOpen(true);
    };

    const handleGeneralAdmissionCheckout = () => {
        if (ticketCount > 0) {
            const price = event.ticketTypes[0]?.price || 0;
            setSelectedSeats(Array.from({ length: ticketCount }).map((_, i) => ({
                id: `GA-${i + 1}`,
                row: 'GA',
                col: i + 1,
                isBooked: false,
                rowNum: 0,
                colNum: i + 1,
                price,
                zone: 'Standard' as SeatZone,
            })));
            setCheckoutOpen(true);
        } else {
             toast({
                variant: "destructive",
                title: "No tickets selected",
                description: `Please select at least one ticket to proceed.`,
            });
        }
    }

    const getTotalPrice = () => {
        return selectedSeats.reduce((total, s) => total + s.price, 0);
    };

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));

    const seatsByRow = useMemo(() => {
        if (!hallLayout) return [];
        const sections = hallLayout.sections as any[];
        const map = new Map<string, GridSeat[]>();
        sections.forEach(section => {
            section.rows.forEach((row: any) => {
                const rowLabel = row.rowId;
                const rowSeats = gridSeats.filter(s => s.row === rowLabel);
                if (rowSeats.length > 0) {
                    map.set(rowLabel, rowSeats);
                }
            });
        });
        return Array.from(map.entries());
    }, [gridSeats, hallLayout]);

    if (loadingBookings || (!hallLayout && hallId)) {
        return <SeatingChartSkeleton />
    }

    if (!hallLayout || !hallLayout.sections) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <h2 className="text-xl font-semibold">General Admission Event</h2>
                <p>Click proceed to confirm your booking for {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}.</p>
                <Button className="mt-4" onClick={handleGeneralAdmissionCheckout}>Proceed</Button>
                <CheckoutDialog isOpen={isCheckoutOpen} onOpenChange={setCheckoutOpen} event={event} selectedSeats={selectedSeats.map(s => ({ seat: { id: s.id, row: s.row, col: s.col, isBooked: s.isBooked }, section: { sectionName: s.zone, price: s.price, rows: [], className: '' } }))} />
            </div>
        );
    }

    const convertedSelectedSeats = selectedSeats.map(s => ({
        seat: { id: s.id, row: s.row, col: s.col, isBooked: s.isBooked },
        section: { sectionName: s.zone, price: s.price, rows: [], className: '' }
    }));

    return (
        <>
            <div className="w-full bg-background relative rounded-lg border shadow-lg overflow-hidden">
                 <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <p className="font-semibold hidden sm:block">Tickets:</p>
                     <div className="flex items-center gap-2 bg-background p-1 rounded-md border">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onTicketCountChange(Math.max(1, ticketCount - 1))} disabled={ticketCount <= 1}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-bold w-10 text-center">{ticketCount}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onTicketCountChange(Math.min(6, ticketCount + 1))}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    <Button variant="outline" size="icon" onClick={handleZoomOut}><ZoomOut /></Button>
                    <Button variant="outline" size="icon" onClick={handleZoomIn}><ZoomIn /></Button>
                </div>
                <div ref={containerRef} className="overflow-auto p-4 md:p-8 pt-20">
                    <div
                        className="transition-transform duration-300 inline-block"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    >
                        <div className="mb-8 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 text-white text-center py-3 rounded-lg font-bold text-xl tracking-widest shadow-lg">
                            STAGE
                        </div>
                        <div className="space-y-1.5">
                            {seatsByRow.map(([rowLabel, seats]) => (
                                <div key={rowLabel} className="flex items-center justify-center gap-2">
                                    <div className="w-8 text-right font-semibold text-sm text-muted-foreground">{rowLabel}</div>
                                    <div className="flex gap-1 flex-wrap justify-center">
                                        {seats.map(seat => (
                                            <div
                                                key={seat.id}
                                                onClick={() => handleSelectSeat(seat)}
                                                className={cn(
                                                    "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all duration-150 border cursor-pointer",
                                                    zoneColors[seat.zone],
                                                    seat.isBooked
                                                        ? "!bg-red-500/50 !border-red-600/50 !text-white/50 cursor-not-allowed"
                                                        : "hover:scale-110",
                                                    selectedSeats.some(s => s.id === seat.id) && "!bg-primary !border-primary !text-primary-foreground"
                                                )}
                                                title={`${seat.zone} - Row ${seat.row} Seat ${seat.colNum} - ₹${seat.price}`}
                                            >
                                                {seat.colNum <= 99 ? seat.colNum : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="mt-8 flex justify-center items-center gap-6 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-md border", zoneColors.VIP)}></div>
                                <span>VIP</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-md border", zoneColors.Premium)}></div>
                                <span>Premium</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-md border", zoneColors.Standard)}></div>
                                <span>Standard</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-md border", zoneColors.Balcony)}></div>
                                <span>Balcony</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-md bg-primary border-primary"></div>
                                <span>Selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-md bg-red-500/50 border-red-600/50"></div>
                                <span>Booked/Blocked</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn("fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30 transition-transform duration-300", selectedSeats.length > 0 ? "translate-y-0" : "translate-y-full")}>
                    <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col text-center sm:text-left">
                             <p className="text-lg font-bold">₹{getTotalPrice().toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {selectedSeats.map(s => `${s.row}${s.colNum}`).join(', ') || 'No seats selected'}
                            </p>
                        </div>
                        <Button onClick={handleCheckout} size="lg" className="w-full sm:w-auto">
                           {`Proceed with ${selectedSeats.length} ${selectedSeats.length === 1 ? 'seat' : 'seats'}`}
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
        </>
    );
}
