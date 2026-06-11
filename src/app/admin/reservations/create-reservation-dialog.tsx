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
import { Loader2, X, MapPin, Calendar, CheckCircle, Rows3, LayoutGrid, Trash2, Search, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
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
  const selectedMembers = members.filter((m) => selectedMemberIds.includes(String(m.memberId)));

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const filteredMembers = members.filter((m) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      String(m.memberId).includes(q) ||
      (m.categoryAcronym || "").toLowerCase().includes(q)
    );
  });

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ label: string; count: number; onConfirm: () => void } | null>(null);

  const BULK_THRESHOLD = 20;

  const applySeatSelection = (seatIds: string[], label: string) => {
    setSelectedSeats(prev => {
      const existing = new Set(prev);
      const toAdd = seatIds.filter(s => !existing.has(s));
      if (toAdd.length > 0) {
        toast({ title: label, description: `${toAdd.length} seat(s) selected.` });
      } else {
        toast({ variant: "destructive", title: label, description: `All seats are already occupied or selected.` });
      }
      return [...prev, ...toAdd];
    });
  };

  const requestBulkSelection = (seatIds: string[], label: string) => {
    if (seatIds.length >= BULK_THRESHOLD) {
      setConfirmData({ label, count: seatIds.length, onConfirm: () => applySeatSelection(seatIds, label) });
      setConfirmOpen(true);
    } else {
      applySeatSelection(seatIds, label);
    }
  };

  const handleSelectRow = (rowLabel: string) => {
    const allRowSeats = getSeatIdsForRow(RIC_AUDITORIUM, rowLabel);
    const available = allRowSeats.filter(s => !isOccupied(s));
    const skipped = allRowSeats.length - available.length;
    requestBulkSelection(available, `Row ${rowLabel}${skipped > 0 ? ` (${skipped} occupied)` : ""}`);
    setBulkRow("");
  };

  const handleSelectSection = (blockId: string) => {
    const allBlockSeats = getSeatIdsForBlock(RIC_AUDITORIUM, blockId);
    const available = allBlockSeats.filter(s => !isOccupied(s));
    const skipped = allBlockSeats.length - available.length;
    requestBulkSelection(available, `Section ${blockId}${skipped > 0 ? ` (${skipped} occupied)` : ""}`);
    setBulkSection("");
  };

  const handleSelectAllAvailable = () => {
    const sections = getSections(RIC_AUDITORIUM);
    const allSeatIds = sections.flatMap(s => getSeatIdsForBlock(RIC_AUDITORIUM, s.id));
    const available = allSeatIds.filter(s => !isOccupied(s));
    requestBulkSelection(available, "Select All");
  };

  const handleSubmit = async () => {
    if (!selectedEventId || selectedMemberIds.length === 0 || selectedSeats.length === 0) return;
    if (selectedSeats.length !== selectedMemberIds.length) {
      toast({ variant: "destructive", title: "Mismatch", description: `Select exactly ${selectedMemberIds.length} seat(s) for ${selectedMemberIds.length} member(s).` });
      return;
    }
    setSubmitting(true);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedSeats.length; i++) {
      const seatId = selectedSeats[i];
      const member = selectedMembers[i];
      if (!member) continue;
      const res = await createReservation({
        eventId: selectedEventId,
        seatId,
        memberId: parseInt(String(member.memberId)),
        memberName: member.name || "",
        guestCount: 0,
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
        description: `${successCount} seat(s) reserved across ${selectedMembers.length} member(s)${failCount > 0 ? `. ${failCount} failed.` : ""}`,
      });
      onCreated?.();
      handleClose();
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "All reservations failed. Seats may have been taken.",
      });
    }

    setSubmitting(false);
  };

  const handleClose = () => {
    setSelectedEventId("");
    setSelectedMemberIds([]);
    setSelectedSeats([]);
    setMemberSearch("");
    setBulkRow("");
    setBulkSection("");
    setOccupiedSeats([]);
    setStep(1);
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === 1) return !!selectedEventId;
    if (step === 2) return selectedMemberIds.length > 0;
    if (step === 3) return selectedSeats.length > 0 && selectedSeats.length === selectedMemberIds.length;
    return false;
  };

  return (
    <>
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

        {/* Step 2: Select Members */}
        {step === 2 && selectedEvent && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedEvent.name}</span>
              <span className="text-xs text-muted-foreground">• {format(new Date(selectedEvent.date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Members ({selectedMemberIds.length} selected)</Label>
              {selectedMemberIds.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => setSelectedMemberIds([])}>
                  Clear All
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or category..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="border rounded-lg max-h-[320px] overflow-y-auto divide-y">
              {filteredMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No members found</p>
              )}
              {filteredMembers.map((m) => {
                const isChecked = selectedMemberIds.includes(String(m.memberId));
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isChecked ? "bg-amber-50/80" : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleMember(String(m.memberId))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {m.memberId}{m.categoryAcronym ? ` • ${m.categoryAcronym}` : ""}</p>
                    </div>
                    {isChecked && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Pick Seats */}
        {step === 3 && selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">{selectedEvent.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{selectedMembers.length} member(s) selected</span>
            </div>
            {selectedMembers.length !== selectedSeats.length && selectedSeats.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                ⚠ Select exactly {selectedMembers.length} seat(s) to match {selectedMembers.length} member(s).
                {selectedSeats.length > selectedMembers.length ? ` (${selectedSeats.length - selectedMembers.length} too many)` : ` (${selectedMembers.length - selectedSeats.length} more needed)`}
              </div>
            )}
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

            {/* Member-Seat assignment summary */}
            {selectedMembers.length > 0 && selectedSeats.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Seat Assignments</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedMembers.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {selectedSeats[i] || "—"}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium truncate">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              Create {selectedMembers.length > 1 ? `${selectedMembers.length} Reservations` : "Reservation"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Bulk Selection Confirmation Dialog */}
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Bulk Selection
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to select <strong>{confirmData?.count}</strong> seats{confirmData?.label ? ` for "${confirmData.label}"` : ""}.
            {confirmData?.count && confirmData.count > 50 && (
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
              confirmData?.onConfirm();
              setConfirmData(null);
            }}
          >
            Select {confirmData?.count} Seats
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
