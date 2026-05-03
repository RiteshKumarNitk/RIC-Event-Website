"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, LayoutGrid, Trash2, ArrowLeft } from "lucide-react";
import { getHalls, createHall, deleteHall } from "./actions";
import { Badge } from "@/components/ui/badge";
import { DialogClose } from "@radix-ui/react-dialog";
import { useToast } from "@/hooks/use-toast";

const hallSchema = z.object({
  name: z.string().min(2, "Hall name must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
});

export default function HallsPage() {
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof hallSchema>>({
    resolver: zodResolver(hallSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => { fetchHalls(); }, []);

  const fetchHalls = async () => {
    setLoading(true);
    const res = await getHalls();
    if (res.success && res.halls) setHalls(res.halls as any[]);
    setLoading(false);
  };

  const onSubmit = async (values: z.infer<typeof hallSchema>) => {
    const res = await createHall(values);
    if (res.success) {
      toast({ title: "Success", description: "Hall created. Click to design seats." });
      setDialogOpen(false);
      form.reset();
      fetchHalls();
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteHall(id);
    if (res.success) {
      toast({ title: "Deleted", description: "Hall removed." });
      fetchHalls();
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hall Manager</h1>
            <p className="text-muted-foreground text-sm">Configure venues and design seat layouts</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Hall
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">Loading halls...</p>
      ) : halls.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No halls configured</h3>
            <p className="text-muted-foreground mt-1">Add your first hall to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {halls.map((hall) => {
            const sections = hall.sections as any[] || [];
            const totalSeats = hall.totalSeats || 0;
            const rows = sections.flatMap(s => s.rows || []);
            return (
              <Card key={hall.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <Link href={`/admin/halls/${hall.id}/design`}>
                    <CardTitle className="text-lg cursor-pointer hover:text-primary transition-colors">{hall.name}</CardTitle>
                  </Link>
                  <CardDescription>{hall.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{totalSeats} seats</Badge>
                    <Badge variant="outline">{rows.length} rows</Badge>
                  </div>
                  {rows.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {sections.map((s: any) => (
                        <div key={s.sectionName}>{s.sectionName}: {s.rows?.length || 0} rows</div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/admin/halls/${hall.id}/design`}>
                        <LayoutGrid className="mr-2 h-3.5 w-3.5" />Design Seats
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(hall.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Hall</DialogTitle>
            <DialogDescription>Create a hall, then design its seat layout.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Hall Name</FormLabel><FormControl><Input placeholder="e.g. Main Hall" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. Primary auditorium" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
