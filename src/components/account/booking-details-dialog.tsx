
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Event, Booking } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { InvoiceDisplay } from './invoice-display';

interface BookingDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  event: Event | undefined;
}

export function BookingDetailsDialog({ isOpen, onOpenChange, booking, event }: BookingDetailsDialogProps) {
  const { user } = useAuth();
  
  if (!booking || !event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Booking Details</DialogTitle>
           <DialogDescription className="text-center">
            View your e-ticket and invoice for {event.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <InvoiceDisplay booking={booking} event={event} user={user} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
