
"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Event, Booking, Attendee } from '@/lib/types';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import QRCode from "react-qr-code";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceDisplayProps {
  booking: Booking;
  event: Event | undefined;
  user: { displayName?: string | null; email?: string | null; } | null;
}

export function InvoiceDisplay({ booking, event, user }: InvoiceDisplayProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const input = invoiceRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth - 20;
            let height = width / ratio;
            
            let y = 10;
            if (height > pdfHeight - 20) {
                 height = pdfHeight - 20;
                 y = 10;
            }

            pdf.addImage(imgData, 'PNG', 10, y, width, height);
            pdf.save(`ric-booking-${booking.id}.pdf`);
        });
    };

    if (!event) return null;

    const qrValue = JSON.stringify({
        bookingId: booking.id,
        eventName: event.name,
        user: user?.email,
        seats: booking.attendees.map((a) => a.seatId).join(', '),
    });

    const totalPaid = booking.total;
    const primaryAttendee = booking.attendees[0];

    return (
        <div className="text-left">
            <div ref={invoiceRef} className="my-4 p-6 rounded-lg border bg-background text-left max-w-md mx-auto">
                <h3 className="font-bold text-lg mb-4 text-center">E-Ticket / Invoice</h3>
                 <div className="flex justify-center mb-4">
                    <div className="bg-white p-2 rounded-md">
                        <QRCode value={qrValue} size={128} />
                    </div>
                 </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-semibold">Booking ID:</span> <span className="truncate">{booking.id}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Event:</span> <span>{event.name}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Date:</span> <span>{format(new Date(event.date), 'PP')}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Booked By:</span> <span className="truncate">{primaryAttendee?.attendeeName || user?.displayName || user?.email}</span></div>
                </div>
                <Separator className="my-4" />
                <h4 className="font-semibold mb-2">Attendees & Seats</h4>
                {booking.attendees.map((attendee: Attendee) => (
                    <div key={attendee.seatId} className="flex justify-between text-sm">
                        <span className="truncate">{attendee.attendeeName} ({attendee.seatId.split('-')[1]})</span>
                        <span>{attendee.isMember ? 'Free' : `₹${attendee.price.toFixed(2)}`}</span>
                    </div>
                ))}
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-base">
                    <span>Total Paid:</span>
                    <span>₹{totalPaid.toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                 <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                </Button>
            </div>
        </div>
    )
};
