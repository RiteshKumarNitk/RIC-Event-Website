"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { MoreHorizontal, ChevronLeft, ChevronRight, Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEvents } from "./events-provider";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  )
}

export default function AdminEventsPage() {
  const { events, deleteEvent, loading } = useEvents();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(events.map(e => e.category).filter(Boolean))), [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.venue.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(e => {
        if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
        if (statusFilter === "upcoming") return new Date(e.date) > new Date();
        if (statusFilter === "past") return new Date(e.date) <= new Date();
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const upcomingCount = events.filter(e => new Date(e.date) > new Date()).length;
  const pastCount = events.filter(e => new Date(e.date) <= new Date()).length;

  const handleEdit = (id: string) => router.push(`/admin/events/edit/${id}`);
  const handleViewBookings = (id: string) => router.push(`/admin/events/${id}/bookings`);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteEvent(deleteTarget);
      setDeleteTarget(null);
      if (paginatedEvents.length === 1 && currentPage > 1) {
        setCurrentPage(p => Math.max(1, p - 1));
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Events</h1>
          <p className="text-muted-foreground mt-1">{events.length} total events</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/create"><Plus className="mr-2 h-4 w-4" />Create Event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
        >
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'upcoming' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => { setStatusFilter("upcoming"); setCurrentPage(1); }}
        >
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">{upcomingCount}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'past' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => { setStatusFilter("past"); setCurrentPage(1); }}
        >
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-muted-foreground">{pastCount}</p>
            <p className="text-xs text-muted-foreground">Past Events</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or venue..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex w-full sm:w-auto items-center gap-3">
              <Select value={statusFilter} onValueChange={(val: any) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={(val: any) => { setCategoryFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                </>
              ) : paginatedEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No events found</p>
                    {searchTerm && <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEvents.map((event) => {
                  const isUpcoming = new Date(event.date) > new Date();
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{event.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{event.venue}</TableCell>
                      <TableCell>
                        <Badge variant={isUpcoming ? "default" : "outline"} className="text-xs">
                          {isUpcoming ? "Upcoming" : "Past"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewBookings(event.id)}>
                              <Eye className="mr-2 h-4 w-4" />View Bookings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(event.id)}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(event.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {!loading && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <p>
                  Showing {filteredEvents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and will also delete all associated bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
