"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Users, MapPin, Calendar, CheckCircle, Rows3, LayoutGrid, Trash2 } from "lucide-react";
import { useEvents } from "../events/events-provider";
import { RIC_AUDITORIUM, getSeatIdsForRow, getSeatIdsForBlock, getAllRowLabels, getSections } from "@/lib/seat-layouts";
import { SeatingChart } from "@/components/events/seating-chart";
import { getEventSeatDetails, getAllMembers, type OccupiedSeatInfo } from "@/app/actions/seat-admin-actions";
import { createReservation } from "@/app/actions/reservation-actions";
import { format } from "date-fns";

interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateReservationDialog({ open, onOpenChange, onCreated }: CreateReservationDialogProps) {
  const { events } = useEvents();
  const { toast } = useToast();

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeatInfo[]>([]);
  const [blockedSeats, setBlockedSeats] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Load members on mount
  useEffect(() => {
    if (open) {
      getAllMembers().then((res) => {
        if (res.success && res.members) {
          setMembers(res.members);
        }
      });
    }
  }, [open]);

  // Load occupied seats when event changes
  useEffect(() => {
    if (selectedEventId) {
      setLoadingSeats(true);
      setSelectedSeats([]);
      setOccupiedSeats([]);
      getEventSeatDetails(selectedEventId).then((res) => {
        if (res.success && res.details) {
          setOccupiedSeats(res.details.occupied);
          setBlockedSeats(res.details.blocked.map(b => b.seatId));
        }
        setLoadingSeats(false);
      });
    }
  }, [selectedEventId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedMember = members.find((m) => String(m.memberId) === selectedMemberId);

  const isOccupied = useCallback((seatId: string) => {
    return occupiedSeats.some((o) => o.seatId === seatId) || blockedSeats.includes(seatId);
  }, [occupiedSeats, blockedSeats]);

  const handleSeatClick = useCallback((seatId: string) => {
    if (isOccupied(seatId)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  }, [isOccupied]);

  // Bulk selection helpers
  const [bulkRow, setBulkRow] = useState("");
  const [bulkSection, setBulkSection] = useState("");

  const handleSelectRow = (rowLabel: string) => {
    const allRowSeats = getSeatIdsForRow(RIC_AUDITORIUM, rowLabel);
    const available = allRowSeats.filter(s => !isOccupied(s));
    const skipped = allRowSeats.length - available.length;
    setSelectedSeats(prev => {
      const existing = new Set(prev);
      const toAdd = available.filter(s => !existing.has(s));
      if (toAdd.length > 0) {
        toast({ title: `Row ${rowLabel}`, description: `${toAdd.length} seat(s) selected${skipped > 0 ? `. ${skipped} already occupied.` : ""}` });
      } else {
        toast({ variant: "destructive", title: `Row ${rowLabel}`, description: `All ${allRowSeats.length} seats are already occupied or selected.` });
      }
      return [...prev, ...toAdd];
    });
    setBulkRow("");
  };

  const handleSelectSection = (blockId: string) => {
    const allBlockSeats = getSeatIdsForBlock(RIC_AUDITORIUM, blockId);
    const available = allBlockSeats.filter(s => !isOccupied(s));
    const skipped = allBlockSeats.length - available.length;
    setSelectedSeats(prev => {
      const existing = new Set(prev);
      const toAdd = available.filter(s => !existing.has(s));
      if (toAdd.length > 0) {
        toast({ title: `Section ${blockId}`, description: `${toAdd.length} seat(s) selected${skipped > 0 ? `. ${skipped} already occupied.` : ""}` });
      } else {
        toast({ variant: "destructive", title: `Section ${blockId}`, description: `All ${allBlockSeats.length} seats are already occupied or selected.` });
      }
      return [...prev, ...toAdd];
    });
    setBulkSection("");
  };

  const handleSelectAllAvailable = async () => {
    const sections = getSections(RIC_AUDITORIUM);
    const allSeatIds = sections.flatMap(s => getSeatIdsForBlock(RIC_AUDITORIUM, s.id));
    const available = allSeatIds.filter(s => !isOccupied(s));
    if (available.length > 20) {
      // Show confirmation for large selections
      if (!window.confirm(`Select ${available.length} available seats? This is a large selection.`)) return;
    }
    setSelectedSeats(prev => {
      const existing = new Set(prev);
      const toAdd = available.filter(s => !existing.has(s));
      toast({ title: "Select All", description: `${toAdd.length} seat(s) selected.` });
      return [...prev, ...toAdd];
    });
  };

  const handleSubmit = async () => {
    if (!selectedEventId || !selectedMemberId || selectedSeats.length === 0) return;
    setSubmitting(true);

    let successCount = 0;
    let failCount = 0;

    for (const seatId of selectedSeats) {
      const res = await createReservation({
        eventId: selectedEventId,
        seatId,
        memberId: parseInt(selectedMemberId),
        memberName: selectedMember?.name || "",
        guestCount,
      });
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Reservations Created",
        description: `${successCount} seat(s) reserved for ${selectedMember?.name || "member"}${failCount > 0 ? `. ${failCount} failed (already taken).` : ""}`,
      });
      onCreated?.();
      handleClose();
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "All selected seats could not be reserved. They may have been taken.",
      });
    }

    setSubmitting(false);
  };

  const handleClose = () => {
    setSelectedEventId("");
    setSelectedMemberId("");
    setSelectedSeats([]);
    setGuestCount(0);
    setOccupiedSeats([]);
    setStep(1);
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === 1) return !!selectedEventId;
    if (step === 2) return !!selectedMemberId;
    if (step === 3) return selectedSeats.length > 0;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>
            Reserve seats for a member. The reservation will be active for 30 minutes.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {(["Select Event", "Select Member", "Pick Seats"] as const).map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : num}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Select Event */}
        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Choose an Event</Label>
            <div className="grid gap-3 max-h-[300px] overflow-y-auto">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEventId === event.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{event.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.date), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </span>
                      </div>
                    </div>
                    {selectedEventId === event.id && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No events available</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Member */}
        {step === 2 && selectedEvent && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedEvent.name}</span>
              <span className="text-xs text-muted-foreground">• {format(new Date(selectedEvent.date), "MMM d, yyyy")}</span>
            </div>
            <Label className="text-sm font-semibold">Choose a Member</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Search members..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.memberId)}>
                    {m.memberId} — {m.name} {m.categoryAcronym ? `(${m.categoryAcronym})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="font-semibold text-amber-900 text-sm">{selectedMember.name}</p>
                <p className="text-xs text-amber-700">ID: {selectedMember.memberId} • {selectedMember.categoryAcronym || "Member"}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pick Seats */}
        {step === 3 && selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">{selectedEvent.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{selectedMember?.name}</span>
            </div>
            <Label className="text-sm font-semibold">Select Seats on the Map</Label>

            {/* Bulk Selection Controls */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Bulk Select:</span>
              <Select value={bulkRow} onValueChange={(val) => { handleSelectRow(val); }}>
                <SelectTrigger className="h-8 w-[140px] text-xs bg-white">
                  <Rows3 className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="By Row" />
                </SelectTrigger>
                <SelectContent>
                  {getAllRowLabels(RIC_AUDITORIUM).map((label) => (
                    <SelectItem key={label} value={label} className="text-xs">Row {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bulkSection} onValueChange={(val) => { handleSelectSection(val); }}>
                <SelectTrigger className="h-8 w-[160px] text-xs bg-white">
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="By Section" />
                </SelectTrigger>
                <SelectContent>
                  {getSections(RIC_AUDITORIUM).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.label} (rows {s.rowRange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSelectAllAvailable}>
                Select All Available
              </Button>
              {selectedSeats.length > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setSelectedSeats([])}>
                  <Trash2 className="h-3 w-3 mr-1" />Clear ({selectedSeats.length})
                </Button>
              )}
            </div>

            {loadingSeats ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Card className="overflow-hidden border-2">
                <div className="h-[500px] relative">
                  <SeatingChart
                    event={selectedEvent as any}
                    ticketCount={100}
                    onTicketCountChange={() => {}}
                    layout={RIC_AUDITORIUM}
                    adminMode={true}
                    occupiedSeats={occupiedSeats}
                    blockedSeats={blockedSeats}
                    selectedSeatIds={selectedSeats}
                    onSeatClick={handleSeatClick}
                  />
                </div>
              </Card>
            )}

            {/* Guest count */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Guest Count (optional)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={guestCount}
                onChange={(e) => setGuestCount(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-32"
              />
            </div>

            {/* Selected seats summary */}
            {selectedSeats.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Selected Seats ({selectedSeats.length})</Label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map((s) => (
                    <Badge
                      key={s}
                      variant="default"
                      className="text-xs cursor-pointer gap-1 pl-2 pr-1.5 py-1 bg-slate-800 hover:bg-slate-700"
                      onClick={() => setSelectedSeats((prev) => prev.filter((x) => x !== s))}
                    >
                      {s}
                      <X className="h-2.5 w-2.5" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) handleClose();
              else setStep((s) => (s - 1) as 1 | 2 | 3);
            }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button disabled={!canProceed()} onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}>
              Next
            </Button>
          ) : (
            <Button disabled={!canProceed() || submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Create {selectedSeats.length > 1 ? `${selectedSeats.length} Reservations` : "Reservation"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
