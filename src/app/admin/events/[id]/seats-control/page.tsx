"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Unlock, UserPlus, Loader2, Crown, Info,
  X, Ticket, Shield, ShieldCheck, Users, Sparkles, AlertTriangle
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { RIC_AUDITORIUM, getSeatIdsForRow, getSeatIdsForBlock, getAllRowLabels, getSections } from "@/lib/seat-layouts";
import {
  getBlockedSeats, toggleBlockSeat, getAllMembers, adminCreateBooking,
  unblockAllSeats, getEventSeatDetails, getSeatAccessTiers,
  setSeatAccessTier, bulkSetSeatAccessTiers, clearSeatAccessTier,
  type OccupiedSeatInfo, type SeatAccessTierType,
} from "@/app/actions/seat-admin-actions";
import { useEvents } from "../../events-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SeatingChart } from "@/components/events/seating-chart"

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

  // Access tier state
  const [seatTiers, setSeatTiers] = useState<Record<string, SeatAccessTierType>>({});
  const [selectedTier, setSelectedTier] = useState<SeatAccessTierType | null>(null);
  const [tierBulkMode, setTierBulkMode] = useState<"row" | "section" | null>(null);
  const [tierBulkTarget, setTierBulkTarget] = useState("");
  const [tierApplying, setTierApplying] = useState(false);
  const [tierConfirmOpen, setTierConfirmOpen] = useState(false);
  const [tierConfirmData, setTierConfirmData] = useState<{ label: string; count: number; onConfirm: () => void } | null>(null);
  const TIER_BULK_THRESHOLD = 20;

  // Admin booking state
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    const [blockedRes, membersRes, detailsRes, tiersRes] = await Promise.all([
      getBlockedSeats(eventId),
      getAllMembers(),
      getEventSeatDetails(eventId),
      getSeatAccessTiers(eventId),
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
    if (tiersRes.success && tiersRes.tiers) {
      setSeatTiers(tiersRes.tiers);
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

  // ─── Access Tier Handlers ───
  const handleSetTierForSeat = async (seatId: string, tier: SeatAccessTierType) => {
    setTierApplying(true);
    const res = await setSeatAccessTier(eventId, seatId, tier);
    if (res.success) {
      setSeatTiers(prev => ({ ...prev, [seatId]: tier }));
      toast({ title: "Tier Updated", description: `${seatId} → ${tier.replace('_', ' ')}` });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setTierApplying(false);
  };

  const handleClearTierForSeat = async (seatId: string) => {
    setTierApplying(true);
    const res = await clearSeatAccessTier(eventId, seatId);
    if (res.success) {
      setSeatTiers(prev => {
        const next = { ...prev };
        delete next[seatId];
        return next;
      });
      toast({ title: "Tier Cleared", description: `${seatId} reset to General Admission` });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setTierApplying(false);
  };

  const handleBulkSetTier = async (seatIds: string[], tier: SeatAccessTierType) => {
    setTierApplying(true);
    const res = await bulkSetSeatAccessTiers(eventId, seatIds, tier);
    if (res.success) {
      const updated = { ...seatTiers };
      for (const id of seatIds) updated[id] = tier;
      setSeatTiers(updated);
      toast({ title: "Bulk Tier Updated", description: `${seatIds.length} seats → ${tier.replace('_', ' ')}` });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setTierApplying(false);
  };

  const handleBulkTierAction = async () => {
    if (!selectedTier || !tierBulkTarget) return;
    let seatIds: string[] = [];
    let label = "";
    if (tierBulkMode === "row") {
      seatIds = getSeatIdsForRow(RIC_AUDITORIUM, tierBulkTarget);
      label = `Row ${tierBulkTarget}`;
    } else if (tierBulkMode === "section") {
      seatIds = getSeatIdsForBlock(RIC_AUDITORIUM, tierBulkTarget);
      label = `Section ${tierBulkTarget}`;
    }
    if (seatIds.length === 0) return;
    if (seatIds.length >= TIER_BULK_THRESHOLD) {
      setTierConfirmData({
        label: `${label} → ${selectedTier.replace('_', ' ')}`,
        count: seatIds.length,
        onConfirm: async () => {
          await handleBulkSetTier(seatIds, selectedTier);
          setTierBulkTarget("");
        },
      });
      setTierConfirmOpen(true);
    } else {
      await handleBulkSetTier(seatIds, selectedTier);
      setTierBulkTarget("");
    }
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
    // If a tier is selected, apply/clear tier instead of selecting
    if (selectedTier) {
      if (seatTiers[seatId] === selectedTier) {
        handleClearTierForSeat(seatId);
      } else {
        handleSetTierForSeat(seatId, selectedTier);
      }
      return;
    }
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
    <>
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

      {/* Note: The Legend is now built-in to the SeatingChart component */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Seat Map ─── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 shadow-sm">
            <div className="h-[750px] relative">
              <SeatingChart
                event={event as any}
                ticketCount={100} // high limit for admin
                onTicketCountChange={() => {}}
                layout={RIC_AUDITORIUM}
                adminMode={true}
                blockedSeats={Array.from(blockedSeats)}
                occupiedSeats={occupiedSeats}
                selectedSeatIds={selectedSeats}
                seatTiers={seatTiers}
                onSeatClick={(seatId) => {
                  const isBlocked = blockedSeats.has(seatId);
                  const isOccupied = occupiedSeats.some(o => o.seatId === seatId);
                  if (isBlocked) handleToggleSeat(seatId);
                  else if (!isOccupied) handleSelectSeat(seatId);
                }}
              />
            </div>
          </Card>
        </div>

        {/* ─── Sidebar Controls ─── */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          
          {/* Occupancy Summary */}
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <CardHeader className="py-4 px-5 bg-slate-50/50">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Info className="h-4 w-4" />
                  </div>
                  Occupancy Stats
                </span>
                <Badge variant="outline" className="font-mono bg-white">
                  {allSeats.reduce((sum, b) => sum + b.seats.length, 0)} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Booked (Member)
                  </span>
                  <span className="font-bold text-slate-900">{bookedCount}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved
                  </span>
                  <span className="font-bold text-slate-900">{reservedCount}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Blocked
                  </span>
                  <span className="font-bold text-slate-900">{blockedSeats.size}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 bg-green-50/50">
                  <span className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available
                  </span>
                  <span className="font-black text-green-700">
                    {allSeats.reduce((sum, b) => sum + b.seats.length, 0) - bookedCount - reservedCount - blockedSeats.size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Book for Member */}
          <Card className="border-0 shadow-md">
            <CardHeader className="py-4 px-5 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                  <UserPlus className="h-4 w-4" />
                </div>
                Book for Member
              </CardTitle>
              <CardDescription className="text-xs">Select seats on the map, then assign them.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1. Select Member</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="h-10 text-sm bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Search members..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={String(m.memberId)}>
                        {m.memberId} — {m.name} {m.categoryAcronym ? `(${m.categoryAcronym})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {member && (
                  <div className="mt-3 bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-xs space-y-1.5 transition-all">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                      <Crown className="h-4 w-4 text-amber-500" />
                      {member.name}
                    </p>
                    <div className="flex items-center gap-3 text-amber-700/80">
                      <span>ID: {member.memberId}</span>
                      <span>•</span>
                      <span>{member.categoryAcronym || 'Member'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">2. Selected Seats</Label>
                  {selectedSeats.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                      {selectedSeats.length} Selected
                    </Badge>
                  )}
                </div>
                
                <div className="min-h-[60px] bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-wrap gap-1.5 items-start content-start">
                  {selectedSeats.length === 0 ? (
                    <p className="text-xs text-slate-400 w-full text-center py-2 italic">Click available seats on the map.</p>
                  ) : (
                    selectedSeats.map(s => (
                      <Badge 
                        key={s} 
                        variant="default" 
                        className="text-xs cursor-pointer gap-1.5 pl-2 pr-1.5 py-1 bg-slate-800 hover:bg-slate-700 shadow-sm transition-transform hover:scale-105 active:scale-95" 
                        onClick={() => setSelectedSeats(prev => prev.filter(x => x !== s))}
                      >
                        {s.split("-").pop()}
                        <div className="bg-white/20 rounded-full p-0.5">
                          <X className="h-2.5 w-2.5" />
                        </div>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <Button
                className="w-full shadow-md shadow-primary/20 h-11 font-medium transition-all"
                disabled={!selectedMemberId || selectedSeats.length === 0 || creating}
                onClick={handleBookForMember}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ticket className="h-4 w-4 mr-2" />}
                Confirm Booking
              </Button>
            </CardContent>
          </Card>

          {/* Access Tier Controls */}
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500" />
            <CardHeader className="py-4 px-5 bg-slate-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                  <Shield className="h-4 w-4" />
                </div>
                Access Tier
              </CardTitle>
              <CardDescription className="text-xs">Mark seats as VIP-only, Members-only, or General Admission.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Tier Toggle Buttons */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Tier Mode</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { tier: null as SeatAccessTierType | null, label: "Off", icon: null, color: "bg-slate-100 text-slate-600 border-slate-200" },
                    { tier: "VIP_ONLY" as const, label: "VIP", icon: Crown, color: "bg-pink-100 text-pink-700 border-pink-300" },
                    { tier: "MEMBERS_ONLY" as const, label: "Members", icon: Users, color: "bg-amber-100 text-amber-700 border-amber-300" },
                    { tier: "GENERAL" as const, label: "General", icon: ShieldCheck, color: "bg-green-100 text-green-700 border-green-300" },
                  ]).map(({ tier, label, icon: Icon, color }) => (
                    <Button
                      key={label}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-auto py-2 flex flex-col items-center gap-1 text-[10px] font-semibold transition-all",
                        selectedTier === tier ? "ring-2 ring-offset-1 ring-indigo-500 " + color : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      )}
                      onClick={() => {
                        setSelectedTier(selectedTier === tier ? null : tier);
                        setSelectedSeats([]); // Clear booking selection when switching to tier mode
                      }}
                      disabled={tierApplying}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {label}
                    </Button>
                  ))}
                </div>
                {selectedTier && (
                  <p className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 mt-1">
                    <Sparkles className="h-3 w-3" />
                    Click seats to assign {selectedTier.replace('_', ' ').toLowerCase()}
                  </p>
                )}
              </div>

              {/* Bulk Tier Actions */}
              {selectedTier && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bulk Assign</Label>
                  
                  {/* By Row */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-medium">By Row</p>
                    <div className="flex gap-2">
                      <Select value={tierBulkMode === 'row' ? tierBulkTarget : ''} onValueChange={(v) => { setTierBulkMode('row'); setTierBulkTarget(v); }}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                          <SelectValue placeholder="Select row..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllRowLabels(RIC_AUDITORIUM).map(row => (
                            <SelectItem key={row} value={row}>Row {row}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        disabled={!tierBulkTarget || tierBulkMode !== 'row' || tierApplying}
                        onClick={handleBulkTierAction}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* By Section */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-medium">By Section</p>
                    <div className="flex gap-2">
                      <Select value={tierBulkMode === 'section' ? tierBulkTarget : ''} onValueChange={(v) => { setTierBulkMode('section'); setTierBulkTarget(v); }}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                          <SelectValue placeholder="Select section..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getSections(RIC_AUDITORIUM).map(sec => (
                            <SelectItem key={sec.id} value={sec.id}>{sec.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        disabled={!tierBulkTarget || tierBulkMode !== 'section' || tierApplying}
                        onClick={handleBulkTierAction}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tier Stats */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Seats with tiers assigned</span>
                  <Badge variant="outline" className="font-mono bg-white text-slate-700">
                    {Object.keys(seatTiers).length}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  {Object.entries(Object.values(seatTiers).reduce<Record<string, number>>((acc, tier) => { acc[tier] = (acc[tier] || 0) + 1; return acc; }, {})).map(([tier, count]) => (
                    <Badge key={tier} variant="secondary" className="text-[10px] font-mono">
                      {tier.replace('_', ' ')}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blocked Seats Controls */}
          <Card className="border-0 shadow-sm bg-slate-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                  <Unlock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{blockedSeats.size} Blocked</p>
                  <p className="text-[10px] text-slate-500">Click red seats to unblock</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={blockedSeats.size === 0}
                className="text-xs bg-white border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" 
                onClick={async () => {
                  await unblockAllSeats(eventId);
                  setBlockedSeats(new Set());
                  toast({ title: "Unblocked All", description: "All seats unblocked." });
                }}
              >
                Unblock All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Bulk Tier Confirmation Dialog */}
    <AlertDialog open={tierConfirmOpen} onOpenChange={setTierConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Bulk Tier Assignment
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to assign <strong>{tierConfirmData?.count}</strong> seats to
            <strong> {tierConfirmData?.label?.split(' → ')[1]}</strong>
            {tierConfirmData?.label ? ` (${tierConfirmData.label.split(' → ')[0]})` : ""}.
            {tierConfirmData?.count && tierConfirmData.count > 50 && (
              <span className="block mt-1 text-amber-600 font-medium">
                This is a large selection. Make sure this is intentional.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              tierConfirmData?.onConfirm();
              setTierConfirmData(null);
            }}
          >
            Apply to {tierConfirmData?.count} Seats
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
