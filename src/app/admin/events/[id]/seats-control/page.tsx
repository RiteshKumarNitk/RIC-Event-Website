"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Unlock, UserPlus, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { RIC_AUDITORIUM } from "@/lib/seat-layouts";
import { getBlockedSeats, toggleBlockSeat, getAllMembers, adminCreateBooking, unblockAllSeats } from "@/app/actions/seat-admin-actions";
import { useEvents } from "../../events-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SeatControlPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { events } = useEvents();
  const { toast } = useToast();

  const event = events.find(e => e.id === eventId);

  const [blockedSeats, setBlockedSeats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Admin booking state
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [blockedRes, membersRes] = await Promise.all([
        getBlockedSeats(eventId),
        getAllMembers(),
      ]);
      if (blockedRes.success && blockedRes.seats) {
        setBlockedSeats(new Set(blockedRes.seats.map(s => s.seatId)));
      }
      if (membersRes.success && membersRes.members) {
        setMembers(membersRes.members);
      }
      setLoading(false);
      setMembersLoading(false);
    };
    fetch();
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
      // Refresh blocked seats
      const blockedRes = await getBlockedSeats(eventId);
      if (blockedRes.success && blockedRes.seats) {
        setBlockedSeats(new Set(blockedRes.seats.map(s => s.seatId)));
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setCreating(false);
  };

  const handleSelectSeat = (seatId: string) => {
    if (blockedSeats.has(seatId)) return;
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <p className="text-muted-foreground">Block/unblock seats, or book seats for a member.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seat Map */}
        <div className="lg:col-span-2 space-y-6">
          {allSeats.map(block => (
            <Card key={block.blockId}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  {block.category}{block.membersOnly ? " (Members Only)" : ""}
                  <Badge variant="outline" className="text-xs">{block.seats.length} seats</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {block.seats.map(seat => {
                    const isBlocked = blockedSeats.has(seat.id);
                    const isSelected = selectedSeats.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        onClick={() => {
                          if (isBlocked) handleToggleSeat(seat.id);
                          else handleSelectSeat(seat.id);
                        }}
                        disabled={toggling === seat.id}
                        className={`
                          w-8 h-8 text-[9px] font-bold rounded border flex items-center justify-center transition-all
                          ${isBlocked ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200 cursor-pointer" : ""}
                          ${isSelected ? "bg-green-500 border-green-600 text-white ring-2 ring-green-400" : ""}
                          ${!isBlocked && !isSelected ? "bg-white border-gray-300 text-gray-700 hover:border-gray-500 cursor-pointer" : ""}
                          ${block.membersOnly && !isBlocked && !isSelected ? "border-amber-300 bg-amber-50 text-amber-700" : ""}
                        `}
                        title={`${seat.label}${isBlocked ? " (Blocked)" : ""}${isSelected ? " (Selected for booking)" : ""}`}
                      >
                        {seat.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Unlock className="h-4 w-4" /> Blocked Seats</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">{blockedSeats.size} seat(s) blocked. Click a red seat to unblock.</p>
              {blockedSeats.size > 0 && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={async () => {
                  const res = await unblockAllSeats(eventId);
                  if (res.success) {
                    setBlockedSeats(new Set());
                    toast({ title: "Unblocked All", description: `${res.count} seats unblocked.` });
                  }
                }}>
                  Unblock All
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" /> Book for Member</CardTitle>
              <CardDescription className="text-xs">Select seats from the map, then book for a member.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <Label className="text-xs">Member</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
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
                  <p><strong>{member.name}</strong></p>
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
                      <Badge key={s} variant="secondary" className="text-xs cursor-pointer" onClick={() => setSelectedSeats(prev => prev.filter(x => x !== s))}>
                        {s.split("-").pop()} ✕
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
