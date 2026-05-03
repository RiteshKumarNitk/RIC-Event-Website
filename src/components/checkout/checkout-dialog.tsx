
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Event, Seat, SeatSection } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CheckCircle2, ArrowRight, ArrowLeft, CreditCard, User, FileText, BadgeCheck, XCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import QRCode from "react-qr-code";
import { checkMemberIdAction } from '@/app/actions/check-member-action';
import { createBooking } from '@/app/actions/booking-actions';
import { CanvaslyExportButton } from '@/components/CanvaslyExportButton';


const isPaidEvent = (event: Event) => {
    return event.ticketTypes.some(t => t.price > 0);
}

const attendeeSchema = z.object({
  seatId: z.string(),
  price: z.number(),
  attendeeName: z.string().min(2, 'Name is required.'),
  memberId: z.string().optional(),
  isMember: z.boolean().default(false),
  memberIdVerified: z.boolean().default(false),
});

const checkoutSchema = z.object({
  attendees: z.array(attendeeSchema),
});

const paymentSchema = z.object({
    cardName: z.string().min(2, 'Name on card is required.'),
    cardNumber: z.string().length(16, 'Card number must be 16 digits.'),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format.'),
    cvc: z.string().min(3, 'CVC must be 3 or 4 digits.').max(4),
});

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  selectedSeats: { seat: Seat, section: SeatSection }[];
}

export function CheckoutDialog({ isOpen, onOpenChange, event, selectedSeats }: CheckoutDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const eventIsPaid = isPaidEvent(event);

  const steps = eventIsPaid ? ['Seats', 'Details', 'Payment', 'Invoice'] : ['Seats', 'Details', 'Invoice'];
  const icons = eventIsPaid ? [User, FileText, CreditCard, CheckCircle2] : [User, FileText, CheckCircle2];

  const finalSchema = eventIsPaid 
    ? checkoutSchema.merge(z.object({ payment: paymentSchema })) 
    : checkoutSchema;

  const form = useForm<z.infer<typeof finalSchema>>({
    resolver: zodResolver(finalSchema),
    defaultValues: {
      attendees: [],
      ...(eventIsPaid ? { payment: { cardName: '', cardNumber: '', expiryDate: '', cvc: '' } } : {}),
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "attendees",
  });
  
  const watchedAttendees = form.watch('attendees');
  const totalAmount = useMemo(() => {
    return watchedAttendees.reduce((acc, attendee) => {
        return acc + (attendee.isMember ? 0 : attendee.price);
    }, 0);
  }, [watchedAttendees]);


  useEffect(() => {
    if (selectedSeats.length > 0 && isOpen) {
        const attendeesData = selectedSeats.map(({seat, section}) => ({
            seatId: seat.id,
            price: section.price,
            attendeeName: user?.displayName || '',
            memberId: '',
            isMember: false,
            memberIdVerified: false,
        }));
        replace(attendeesData);
    }
  }, [selectedSeats, replace, isOpen, user]);


  const handleVerifyMemberId = async (index: number) => {
    const currentAttendees = form.getValues('attendees');
    const currentAttendee = currentAttendees[index];
    const memberIdToVerify = currentAttendee.memberId;

    if (!memberIdToVerify) return;

    // Check if the ID is already used in another ticket for THIS booking
    const isIdAlreadyUsedInForm = currentAttendees.some((attendee, idx) => 
        idx !== index && attendee.isMember && String(attendee.memberId) === String(memberIdToVerify)
    );

    if (isIdAlreadyUsedInForm) {
        toast({ variant: "destructive", title: "Member ID in Use", description: "This Member ID has already been applied to another ticket in this booking." });
        return;
    }
    
    // Call server action to verify against the database
    const result = await checkMemberIdAction(memberIdToVerify, event.id);

    let updatedAttendee;
    if (result.isValid) {
      updatedAttendee = {
        ...currentAttendee,
        isMember: true,
        memberIdVerified: true,
        attendeeName: result.memberName || 'Member',
      };
      toast({ title: "Member Verified", description: `${result.memberName} gets a free ticket!`});
    } else {
      updatedAttendee = { ...currentAttendee, isMember: false, memberIdVerified: true };
      toast({ variant: "destructive", title: "Verification Failed", description: result.message});
    }
    
    const newAttendees = [...currentAttendees];
    newAttendees[index] = updatedAttendee;
    replace(newAttendees);
  };


  const onSubmit = async (values: z.infer<typeof finalSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to book." });
        return;
    }
    setIsSubmitting(true);
    try {
        const res = await createBooking({
            userId: (user as any).uid || (user as any).id,
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            attendees: values.attendees,
            total: totalAmount,
        });
        if (res.success) {
            setBookingId(res.bookingId as string);
            setStep(steps.length);
        } else {
            throw new Error(res.error || "Failed");
        }
    } catch (error) {
        console.error("Error saving booking: ", error);
        toast({ variant: "destructive", title: "Booking Failed", description: "Could not save your booking." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) { // Transition from Seats to Details
      isValid = true; 
    } else if (step === 2) { // Transition from Details to Payment/Invoice
      isValid = await form.trigger('attendees');
      if (isValid && eventIsPaid && totalAmount === 0) {
        onSubmit(form.getValues());
        return;
      }
    } else if (step === 3 && eventIsPaid) { // Transition from Payment to Invoice
      isValid = await form.trigger('payment' as any);
    }

    if (isValid) setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);
  
  const resetAndClose = () => {
    form.reset();
    setStep(1);
    setBookingId(null);
    onOpenChange(false);
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Order Summary
        return <OrderSummaryStep event={event} selectedSeats={selectedSeats} total={totalAmount} isPaid={eventIsPaid} />;
      case 2: // Attendee Details
        return <AttendeeDetailsStep form={form} fields={fields} onVerify={handleVerifyMemberId} />;
      case 3: // Payment (if applicable) or Invoice
        if (eventIsPaid) return <PaymentStep form={form} total={totalAmount} />;
        return <InvoiceStep event={event} form={form} bookingId={bookingId} />;
      case 4: // Invoice for paid events
        return <InvoiceStep event={event} form={form} bookingId={bookingId}/>;
      default:
        return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-4xl" onInteractOutside={(e) => { if (isSubmitting) e.preventDefault()}} onEscapeKeyDown={resetAndClose}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Complete Your Booking</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Follow the steps to finalize your booking for {event.name}.
          </DialogDescription>
           <div className="flex justify-center items-center my-4">
            {steps.map((s, index) => {
              const Icon = icons[index];
              const isActive = step === index + 1;
              const isCompleted = step > index + 1;
              
              const shouldSkipPaymentStep = eventIsPaid && totalAmount === 0 && s === 'Payment';
              if (shouldSkipPaymentStep) return null;

              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border-2",
                        isActive ? "bg-primary text-primary-foreground border-primary" :
                        isCompleted ? "bg-green-500 text-white border-green-500" :
                        "bg-muted border-muted-foreground/30"
                    )}>
                        {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                    </div>
                    <p className={cn("text-sm mt-2", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>{s}</p>
                  </div>
                  {index < steps.length - 1 && !shouldSkipPaymentStep && (
                     (eventIsPaid && totalAmount === 0 && index === steps.indexOf('Details')) ? null : <div className="flex-1 h-0.5 bg-border mx-2"></div>
                  )}
                </React.Fragment>
              )
            })}
           </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="max-h-[60vh] overflow-y-auto p-1">
             {renderStepContent()}
            </div>

            <DialogFooter className="mt-8">
              {step > 1 && step < steps.length && (
                <Button variant="outline" onClick={handleBack} type="button" disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              {step < steps.length -1 && (
                 !(step === 2 && eventIsPaid && totalAmount > 0) &&
                <Button onClick={handleNext} type="button" className="ml-auto" disabled={isSubmitting}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {step === steps.length - 1 && eventIsPaid && totalAmount > 0 && (
                 <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
                </Button>
              )}
              {step === steps.length - 1 && !eventIsPaid && (
                 <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : `Confirm Booking`}
                </Button>
              )}
              {step === 2 && eventIsPaid && totalAmount > 0 &&
                <Button onClick={handleNext} type="button" className="ml-auto">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              }

            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Step Components ---

const OrderSummaryStep = ({ event, selectedSeats, total, isPaid }: { event: Event, selectedSeats: { seat: Seat, section: SeatSection }[], total: number, isPaid: boolean }) => (
  <div>
    <h3 className="font-semibold mb-4 text-lg text-center">Your Selection</h3>
    <div className="space-y-4 rounded-lg border p-4 max-w-md mx-auto">
        <div className="flex items-start gap-4">
            <Image src={event.image} alt={event.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
            <div>
                <h4 className="font-semibold">{event.name}</h4>
                <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'MMMM d, yyyy')}</p>
            </div>
        </div>
        <Separator />
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seats</span>
            <span className="font-medium">{selectedSeats.map(s => s.seat.id.split('-')[1]).join(', ')} ({selectedSeats.length})</span>
        </div>
        {isPaid && <>
            <Separator />
            <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
            </div>
        </>}
        {!isPaid && <p className="text-muted-foreground text-sm">This is a free event.</p>}
    </div>
  </div>
);

const AttendeeDetailsStep = ({ form, fields, onVerify }: { form: any, fields: any[], onVerify: (index: number) => void }) => (
  <div>
    <h3 className="font-semibold mb-4 text-lg">Attendee Details</h3>
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-4 space-y-4">
          <h4 className="font-semibold text-primary">Seat: {form.getValues(`attendees.${index}.seatId`).split('-')[1]}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name={`attendees.${index}.attendeeName`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Attendee Name</FormLabel>
                        <FormControl><Input {...field} placeholder="Full Name" disabled={form.getValues(`attendees.${index}.isMember`)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div>
                <FormLabel>Member ID (Optional)</FormLabel>
                 <div className="flex items-center gap-2">
                     <Controller
                        control={form.control}
                        name={`attendees.${index}.memberId`}
                        render={({ field }) => (
                            <Input {...field} placeholder="e.g. 13" disabled={form.getValues(`attendees.${index}.isMember`)} />
                        )}
                    />
                    {!form.watch(`attendees.${index}.isMember`) ? (
                        <Button type="button" variant="secondary" onClick={() => onVerify(index)} disabled={!form.watch(`attendees.${index}.memberId`)}>Verify ID</Button>
                    ) : null}
                </div>
            </div>
          </div>
           <div className="flex justify-end">
                {form.getValues(`attendees.${index}.memberIdVerified`) && (
                    form.getValues(`attendees.${index}.isMember`) ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <BadgeCheck className="mr-2 h-4 w-4" />
                            Member (Ticket is Free)
                        </Badge>
                    ) : (
                        <Badge variant="destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Guest
                        </Badge>
                    )
                )}
            </div>
        </div>
      ))}
    </div>
  </div>
);

const PaymentStep = ({ form, total }: { form: any, total: number }) => (
  <div>
    <h3 className="font-semibold mb-4 text-lg">Payment Details</h3>
    <div className="space-y-4 max-w-md mx-auto">
        <FormField control={form.control} name="payment.cardName" render={({ field }) => (
            <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="payment.cardNumber" render={({ field }) => (
            <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input {...field} placeholder="0000 0000 0000 0000" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex space-x-4">
            <FormField control={form.control} name="payment.expiryDate" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Expiry (MM/YY)</FormLabel><FormControl><Input {...field} placeholder="MM/YY" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="payment.cvc" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>CVC</FormLabel><FormControl><Input {...field} placeholder="123" /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-bold text-xl">
            <span>Total Amount</span>
            <span>₹{total.toFixed(2)}</span>
        </div>
    </div>
  </div>
);

const InvoiceStep = ({ event, form, bookingId }: { event: Event, form: any, bookingId: string | null }) => {
    const { user } = useAuth();
    const invoiceId = `invoice-card-${bookingId}`;

    const qrValue = JSON.stringify({
        bookingId,
        eventName: event.name,
        user: user?.email,
        seats: form.getValues('attendees').map((a: any) => a.seatId).join(', '),
    });

    return (
        <div className="text-center py-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/50 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground">Your booking for {event.name} is complete.</p>
            <p className="text-muted-foreground text-sm mt-2">A confirmation has been sent to {user?.email}.</p>
            
            <div id={invoiceId} className="my-8 p-6 rounded-lg border bg-background text-left max-w-md mx-auto">
                <h3 className="font-bold text-lg mb-4 text-center">E-Ticket / Invoice</h3>
                 <div className="flex justify-center mb-4">
                    <div className="bg-white p-2 rounded-md">
                        <QRCode value={qrValue} size={128} />
                    </div>
                 </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-semibold">Booking ID:</span> <span>{bookingId}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Event:</span> <span>{event.name}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Date:</span> <span>{format(new Date(event.date), 'PP')}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Booked By:</span> <span>{user?.displayName || user?.email}</span></div>
                </div>
                <Separator className="my-4" />
                <h4 className="font-semibold mb-2">Attendees & Seats</h4>
                {form.getValues('attendees').map((attendee: any) => (
                    <div key={attendee.seatId} className="flex justify-between text-sm">
                        <span>{attendee.attendeeName} ({attendee.seatId.split('-')[1]})</span>
                        <span>{attendee.isMember ? 'Free' : `₹${attendee.price.toFixed(2)}`}</span>
                    </div>
                ))}
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-base">
                    <span>Total Paid:</span>
                    <span>₹{form.getValues('attendees').reduce((acc: number, att: any) => acc + (att.isMember ? 0 : att.price), 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
                 <CanvaslyExportButton elementId={invoiceId} filename={`ric-booking-${bookingId}`} buttonText="Download Invoice" />
                <DialogClose asChild>
                    <Button type="button">Close</Button>
                </DialogClose>
            </div>
        </div>
    )
};

    

