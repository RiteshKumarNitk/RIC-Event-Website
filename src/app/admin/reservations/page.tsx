"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { getAllReservations, adminCancelReservation, adminConfirmReservation } from "@/app/actions/reservation-actions";
import { useEvents } from "../events/events-provider";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Reservation = {
  id: string;
  eventId: string;
  seatId: string;
  memberId: number;
  memberName: string;
  guestCount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  event: { id: string; name: string; date: string; venue: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  RESERVED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CONFIRMED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export default function AdminReservationsPage() {
  const { events } = useEvents();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "confirm" | "cancel" } | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    const res = await getAllReservations();
    if (res.success && res.reservations) {
      setReservations(res.reservations);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = [...reservations];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.memberName.toLowerCase().includes(q) ||
          r.seatId.toLowerCase().includes(q) ||
          String(r.memberId).includes(q) ||
          r.event?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (eventFilter !== "all") {
      result = result.filter((r) => r.eventId === eventFilter);
    }
    return result;
  }, [reservations, search, statusFilter, eventFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { RESERVED: 0, CONFIRMED: 0, CANCELLED: 0 };
    reservations.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [reservations]);

  const handleAction = async () => {
    if (!actionTarget) return;
    const { id, action } = actionTarget;
    const res = action === "confirm" ? await adminConfirmReservation(id) : await adminCancelReservation(id);
    if (res.success) {
      toast({ title: "Success", description: `Reservation ${action === "confirm" ? "confirmed" : "cancelled"}.` });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action === "confirm" ? "CONFIRMED" : "CANCELLED" } : r))
      );
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setActionTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="text-muted-foreground mt-1">Manage member seat reservations across all events</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{reservations.length}</p>
            <p className="text-xs text-muted-foreground">Total Reservations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.RESERVED || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.CONFIRMED || 0}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.CANCELLED || 0}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by member name, seat ID..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" />
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <Button variant={statusFilter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}>All</Button>
              {["RESERVED", "CONFIRMED", "CANCELLED"].map((s) => (
                <Button key={s} variant={statusFilter === s ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => { setStatusFilter(s); setCurrentPage(1); }}>{s} ({statusCounts[s] || 0})</Button>
              ))}
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Events</option>
              {events.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Reservations</CardTitle>
            <span className="text-sm text-muted-foreground">{filtered.length} results</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No reservations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{r.memberName}</p>
                      <p className="text-xs text-muted-foreground">ID: {r.memberId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{r.event?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.event?.date ? format(new Date(r.event.date), "MMM d, yyyy") : "—"}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.seatId}</TableCell>
                    <TableCell>{r.guestCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", STATUS_STYLES[r.status])}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{format(new Date(r.createdAt), "MMM d, h:mm a")}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(r.expiresAt) < new Date() ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        format(new Date(r.expiresAt), "h:mm a")
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "RESERVED" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50" onClick={() => setActionTarget({ id: r.id, action: "confirm" })}>
                            <CheckCircle className="h-3 w-3 mr-1" />Confirm
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50" onClick={() => setActionTarget({ id: r.id, action: "cancel" })}>
                            <XCircle className="h-3 w-3 mr-1" />Cancel
                          </Button>
                        </div>
                      )}
                      {r.status === "CONFIRMED" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50" onClick={() => setActionTarget({ id: r.id, action: "cancel" })}>
                          <XCircle className="h-3 w-3 mr-1" />Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <p>
                  Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">Rows per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!actionTarget} onOpenChange={(open) => !open && setActionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionTarget?.action === "confirm" ? "Confirm Reservation" : "Cancel Reservation"}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.action === "confirm"
                ? "This will confirm the reservation. The member will be able to proceed with booking."
                : "This will cancel the reservation and free the seat for other users. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className={actionTarget?.action === "cancel" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {actionTarget?.action === "confirm" ? "Confirm" : "Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
