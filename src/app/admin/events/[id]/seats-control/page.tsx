"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Unlock, UserPlus, Loader2, Crown, Info,
  X,
} from "lucide-react";
import Link from "next/link";
import { RIC_AUDITORIUM } from "@/lib/seat-layouts";
import {
  getBlockedSeats, toggleBlockSeat, getAllMembers, adminCreateBooking,
  unblockAllSeats, getEventSeatDetails, type OccupiedSeatInfo,
} from "@/app/actions/seat-admin-actions";
import { useEvents } from "../../events-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Helpers ───
function getSeatOccupant(seatId: string, occupied: OccupiedSeatInfo[]): OccupiedSeatInfo | undefined {
  return occupied.find(o => o.seatId === seatId);
}

// ─── Component ───
export default function SeatControlPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { events } = useEvents();
  const { toast } = useToast();

  const event = events.find(e => e.id === eventId);

  const [blockedSeats, setBlockedSeats] = useState<Set<string>>(new Set());
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeatInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Tooltip state
  const [tooltipSeat, setTooltipSeat] = useState<string | null>(null);

  // Admin booking state
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    const [blockedRes, membersRes, detailsRes] = await Promise.all([
      getBlockedSeats(eventId),
      getAllMembers(),
      getEventSeatDetails(eventId),
    ]);
    if (blockedRes.success && blockedRes.seats) {
      setBlockedSeats(new Set(blockedRes.seats.map(s => s.seatId)));
    }
    if (membersRes.success && membersRes.members) {
      setMembers(membersRes.members);
    }
    if (detailsRes.success && detailsRes.details) {
      setOccupiedSeats(detailsRes.details.occupied);
    }
    setLoading(false);
    setMembersLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [eventId]);

  const handleToggleSeat = async (seatId: string) => {
    setToggling(seatId);
    const res = await toggleBlockSeat(eventId, seatId);
    if (res.success) {
      setBlockedSeats(prev => {
        const next = new Set(prev);
        if (res.nowBlocked) next.add(seatId);
        else next.delete(seatId);
        return next;
      });
      toast({ title: res.nowBlocked ? "Seat Blocked" : "Seat Unblocked", description: seatId });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setToggling(null);
  };

  const handleBookForMember = async () => {
    if (!selectedMemberId || selectedSeats.length === 0) {
      toast({ variant: "destructive", title: "Missing info", description: "Select a member and at least one seat." });
      return;
    }
    setCreating(true);
    const res = await adminCreateBooking({
      eventId,
      memberId: parseInt(selectedMemberId),
      seatIds: selectedSeats,
      total: 0,
    });
    if (res.success) {
      toast({ title: "Booking Created", description: `Booking ID: ${res.bookingId}` });
      setSelectedSeats([]);
      setSelectedMemberId("");
      await fetchAll(); // Refresh all seat data
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setCreating(false);
  };

  const handleSelectSeat = (seatId: string) => {
    if (blockedSeats.has(seatId)) return;
    if (occupiedSeats.some(o => o.seatId === seatId)) return; // Can't select occupied
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  // ─── Derive stats ───
  const bookedCount = occupiedSeats.filter(o => o.type === "booked").length;
  const reservedCount = occupiedSeats.filter(o => o.type === "reserved").length;

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Build seat list from layout ───
  const allSeats: { blockId: string; category: string; membersOnly?: boolean; seats: { id: string; label: string }[] }[] = [];

  for (const block of RIC_AUDITORIUM.blocks) {
    const blockSeats: { id: string; label: string }[] = [];
    for (let r = 0; r < block.rows; r++) {
      const rowLabel = String.fromCharCode(65 + r + (block.rowLabelOffset || 0));
      const rowCols = block.colsPerRow ? block.colsPerRow[r] : block.cols;
      const rowOffset = block.colOffsetsPerRow ? block.colOffsetsPerRow[r] : (block.colOffset || 0);
      for (let c = 0; c < rowCols; c++) {
        const seatNum = c + 1 + rowOffset;
        const id = `${block.id}-${rowLabel}-${seatNum}`;
        blockSeats.push({ id, label: `${rowLabel}${seatNum}` });
      }
    }
    allSeats.push({ blockId: block.id, category: block.category, membersOnly: block.membersOnly, seats: blockSeats });
  }

  const member = members.find(m => String(m.memberId) === selectedMemberId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/events/${eventId}/bookings`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Seat Control — {event.name}</h1>
        <p className="text-muted-foreground">Block/unblock seats, book seats for a member, or view occupancy.</p>
      </div>

      {/* ─── Legend ─── */}
      <div className="flex flex-wrap items-center gap-4 text-xs px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-white border border-gray-300" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-red-100 border border-red-300" />
          Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-100 border border-blue-400" />
          Booked <span className="text-muted-foreground">(member)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-amber-100 border border-amber-400" />
          Reserved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-green-500 border border-green-600" />
          Selected
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Seat Map ─── */}
        <div className="lg:col-span-2 space-y-6">
          {allSeats.map(block => {
            // Count occupied seats in this block
            const blockOccupied = occupiedSeats.filter(o =>
              block.seats.some(s => s.id === o.seatId)
            );
            return (
              <Card key={block.blockId}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {block.category}{block.membersOnly ? " (Members Only)" : ""}
                    <Badge variant="outline" className="text-xs">{block.seats.length} seats</Badge>
                    {blockOccupied.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {blockOccupied.length} occupied
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {block.seats.map(seat => {
                      const isBlocked = blockedSeats.has(seat.id);
                      const isSelected = selectedSeats.includes(seat.id);
                      const occupant = getSeatOccupant(seat.id, occupiedSeats);
                      const isBooked = occupant?.type === "booked";
                      const isReserved = occupant?.type === "reserved";

                      // Determine color class
                      const colorClass = isBlocked
                        ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
                        : isSelected
                        ? "bg-green-500 border-green-600 text-white ring-2 ring-green-400"
                        : isBooked
                        ? "bg-blue-100 border-blue-400 text-blue-700"
                        : isReserved
                        ? "bg-amber-100 border-amber-400 text-amber-700"
                        : block.membersOnly
                        ? "bg-white border-amber-300 text-amber-700 hover:border-amber-500"
                        : "bg-white border-gray-300 text-gray-700 hover:border-gray-500";

                      return (
                        <div key={seat.id} className="relative">
                          <button
                            onClick={() => {
                              if (isBlocked) handleToggleSeat(seat.id);
                              else if (!isBooked && !isReserved) handleSelectSeat(seat.id);
                              else {
                                setTooltipSeat(tooltipSeat === seat.id ? null : seat.id);
                              }
                            }}
                            disabled={toggling === seat.id}
                            onMouseEnter={() => (isBooked || isReserved) && setTooltipSeat(seat.id)}
                            onMouseLeave={() => setTooltipSeat(null)}
                            className={cn(
                              "w-8 h-8 text-[9px] font-bold rounded border flex items-center justify-center transition-all relative",
                              colorClass,
                              (isBooked || isReserved) && "cursor-default",
                              !isBlocked && !isBooked && !isReserved && "cursor-pointer"
                            )}
                            title={
                              isBlocked ? `${seat.label} (Blocked)` :
                              isSelected ? `${seat.label} (Selected)` :
                              isBooked ? `${seat.label} — ${occupant?.memberName || occupant?.attendeeName || "Booked"}` :
                              isReserved ? `${seat.label} — Reserved for ${occupant?.memberName || "member"}` :
                              seat.label
                            }
                          >
                            {/* Mini crown indicator for member-booked seats */}
                            {isBooked && (
                              <Crown className="absolute -top-1 -right-1 h-2.5 w-2.5 text-blue-600" />
                            )}
                            {seat.label}
                          </button>

                          {/* Tooltip popup for occupied seats */}
                          {tooltipSeat === seat.id && (isBooked || isReserved) && occupant && (
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 pointer-events-none">
                              <div className={cn(
                                "rounded-lg px-3 py-2 text-xs shadow-lg border",
                                isBooked
                                  ? "bg-blue-50 border-blue-200 text-blue-900"
                                  : "bg-amber-50 border-amber-200 text-amber-900"
                              )}>
                                <p className="font-bold flex items-center gap-1">
                                  {isBooked ? <Crown className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                                  {isBooked ? "Member Booking" : "Reserved"}
                                </p>
                                <p className="mt-0.5 font-medium">{occupant.memberName || occupant.attendeeName || "Unknown"}</p>
                                {occupant.memberId && (
                                  <p className="text-[10px] opacity-70">Member ID: {occupant.memberId}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ─── Sidebar Controls ─── */}
        <div className="space-y-4">
          {/* Occupancy Summary */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Booked (member)</span>
                <span className="font-bold text-blue-600">{bookedCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Reserved</span>
                <span className="font-bold text-amber-600">{reservedCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t pt-2">
                <span className="text-muted-foreground">Blocked</span>
                <span className="font-bold text-red-600">{blockedSeats.size}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Available</span>
                <span className="font-bold text-green-600">
                  {allSeats.reduce((sum, b) => sum + b.seats.length, 0) - bookedCount - reservedCount - blockedSeats.size}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Blocked Seats */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Unlock className="h-4 w-4" /> Blocked Seats</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">
                {blockedSeats.size} seat(s) blocked. Click a red seat to unblock. {bookedCount} seat(s) booked by members.
              </p>
              {blockedSeats.size > 0 && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={async () => {
                  await unblockAllSeats(eventId);
                  setBlockedSeats(new Set());
                  toast({ title: "Unblocked All", description: "All seats unblocked." });
                }}>
                  Unblock All
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Book for Member */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" /> Book for Member</CardTitle>
              <CardDescription className="text-xs">Select seats from the map, then book for a member.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <Label className="text-xs">Member</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Search member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={String(m.memberId)}>
                        {m.memberId} — {m.name} {m.categoryAcronym ? `(${m.categoryAcronym})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {member && (
                <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    {member.name}
                  </p>
                  <p className="text-muted-foreground">ID: {member.memberId} | {member.categoryAcronym}</p>
                  <p className="text-muted-foreground">{member.phone} | {member.email}</p>
                </div>
              )}

              <div>
                <Label className="text-xs">Selected Seats ({selectedSeats.length})</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedSeats.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Click seats on the map to select.</p>
                  ) : (
                    selectedSeats.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => setSelectedSeats(prev => prev.filter(x => x !== s))}>
                        {s.split("-").pop()}
                        <X className="h-2.5 w-2.5" />
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!selectedMemberId || selectedSeats.length === 0 || creating}
                onClick={handleBookForMember}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Book {selectedSeats.length} Seat{selectedSeats.length !== 1 ? "s" : ""} for Member
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
