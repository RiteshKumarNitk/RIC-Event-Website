
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { CheckCircle2, ArrowRight, ArrowLeft, CreditCard, User, FileText, BadgeCheck, XCircle, Smartphone, Wallet, Building, QrCode, Banknote } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import QRCode from "react-qr-code";
import { checkMemberIdAction } from '@/app/actions/check-member-action';
import { createBooking } from '@/app/actions/booking-actions';
import { sendBookingConfirmation } from '@/app/actions/email-actions';
import { calculateFees } from '@/app/actions/fee-actions';
import { CanvaslyExportButton } from '@/components/CanvaslyExportButton';

type PaymentMethod = "phonepe" | "gpay" | "paytm" | "card" | "cash";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any; description: string }[] = [
  { id: "phonepe", label: "PhonePe", icon: Smartphone, description: "Pay via PhonePe UPI" },
  { id: "gpay", label: "Google Pay", icon: QrCode, description: "Pay via GPay UPI" },
  { id: "paytm", label: "Paytm", icon: Wallet, description: "Pay via Paytm UPI" },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard, description: "Pay with card" },
  { id: "cash", label: "Cash at Venue", icon: Banknote, description: "Pay at the venue counter" },
];

const RIC_UPI_ID = "ric@upi";

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

const upiPaymentSchema = z.object({
  method: z.enum(["phonepe", "gpay", "paytm"]),
  upiTransactionId: z.string().min(6, 'Please enter the UPI transaction ID / UPI reference number').max(50),
});

const cardPaymentSchema = z.object({
  method: z.literal("card"),
  cardName: z.string().min(2, 'Name on card is required.'),
  cardNumber: z.string().length(16, 'Card number must be 16 digits.'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format.'),
  cvc: z.string().min(3, 'CVC must be 3 or 4 digits.').max(4),
});

const cashPaymentSchema = z.object({
  method: z.literal("cash"),
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    subtotal: number;
    gstPercentage: number;
    gst: number;
    platformFeeType: string;
    platformFeeValue: number;
    platformFee: number;
    total: number;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const eventIsPaid = isPaidEvent(event);

  const steps = eventIsPaid ? ['Seats', 'Details', 'Payment', 'Invoice'] : ['Seats', 'Details', 'Invoice'];
  const icons = eventIsPaid ? [User, FileText, CreditCard, CheckCircle2] : [User, FileText, CheckCircle2];

  const form = useForm({
    defaultValues: {
      attendees: [] as any[],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "attendees",
  });

  const watchedAttendees = form.watch('attendees');
  const subtotalAmount = useMemo(() => {
    return watchedAttendees.reduce((acc: number, attendee: any) => {
        return acc + (attendee.isMember ? 0 : attendee.price);
    }, 0);
  }, [watchedAttendees]);

  const totalAmount = feeBreakdown?.total ?? subtotalAmount;

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

  // Fetch fee breakdown when subtotalAmount changes
  useEffect(() => {
    const fetchFees = async () => {
      if (subtotalAmount > 0) {
        const res = await calculateFees(subtotalAmount);
        if (res.success && res.breakdown) {
          setFeeBreakdown(res.breakdown);
        }
      } else {
        setFeeBreakdown(null);
      }
    };
    fetchFees();
  }, [subtotalAmount]);

  const handleVerifyMemberId = async (index: number) => {
    const currentAttendees = form.getValues('attendees');
    const currentAttendee = currentAttendees[index];
    const memberIdToVerify = currentAttendee.memberId;

    if (!memberIdToVerify) return;

    const isIdAlreadyUsedInForm = currentAttendees.some((attendee: any, idx: number) => 
        idx !== index && attendee.isMember && String(attendee.memberId) === String(memberIdToVerify)
    );

    if (isIdAlreadyUsedInForm) {
        toast({ variant: "destructive", title: "Member ID in Use", description: "This Member ID has already been applied to another ticket in this booking." });
        return;
    }
    
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

  const buildPaymentInfo = () => {
    if (!paymentMethod) return null;
    const base: any = {
      subtotal: subtotalAmount,
    };
    if (feeBreakdown) {
      base.gstPercentage = feeBreakdown.gstPercentage;
      base.gst = feeBreakdown.gst;
      base.platformFee = feeBreakdown.platformFee;
    }
    if (paymentMethod === "card") {
      return { ...base, method: "card", status: "completed" };
    }
    if (paymentMethod === "cash") {
      return { ...base, method: "cash", status: "pending" };
    }
    const values = form.getValues();
    const upiId = (values as any).upiTransactionId || "";
    return { ...base, method: paymentMethod, upiTransactionId: upiId, status: "completed" };
  };

  const onSubmit = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to book." });
        return;
    }
    setIsSubmitting(true);
    const values = form.getValues();
    try {
        const res = await createBooking({
            userId: (user as any).uid || (user as any).id,
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            attendees: values.attendees,
            total: totalAmount,
            paymentInfo: buildPaymentInfo(),
        });
        if (res.success) {
            setBookingId(res.bookingId as string);
            setStep(steps.length);
            sendBookingConfirmation({
              email: user?.email || "",
              name: user?.name || user?.displayName || "Guest",
              bookingId: res.bookingId as string,
              eventName: event.name,
              eventDate: format(new Date(event.date), "EEEE, MMMM d, yyyy"),
              eventVenue: `${event.venue}, ${event.location}`,
              attendees: values.attendees.map((a: any) => ({ name: a.attendeeName, seat: a.seatId, price: a.isMember ? 0 : a.price })),
              total: totalAmount,
              qrData: JSON.stringify({ bookingId: res.bookingId, eventName: event.name, user: user?.email, seats: values.attendees.map((a: any) => a.seatId).join(", ") }),
            }).catch((e) => console.error("Email failed:", e));
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
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const valid = await form.trigger('attendees');
      if (!valid) return;
      if (eventIsPaid && totalAmount === 0) {
        await onSubmit();
        return;
      }
      setStep(3);
    } else if (step === 3) {
      await onSubmit();
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setPaymentMethod(null);
    }
    setStep(prev => prev - 1);
  };
  
  const resetAndClose = () => {
    form.reset();
    setStep(1);
    setBookingId(null);
    setPaymentMethod(null);
    onOpenChange(false);
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <OrderSummaryStep event={event} selectedSeats={selectedSeats} subtotal={subtotalAmount} total={totalAmount} isPaid={eventIsPaid} feeBreakdown={feeBreakdown} />;
      case 2:
        return <AttendeeDetailsStep form={form} fields={fields} onVerify={handleVerifyMemberId} />;
      case 3:
        return (
          <PaymentStep
            total={totalAmount}
            subtotal={subtotalAmount}
            feeBreakdown={feeBreakdown}
            selectedMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
            form={form}
          />
        );
      case 4:
        return <InvoiceStep event={event} form={form} bookingId={bookingId} total={totalAmount} feeBreakdown={feeBreakdown} subtotal={subtotalAmount} />;
      default:
        return null;
    }
  }

  const canProceed = () => {
    if (step === 3 && paymentMethod) {
      if (paymentMethod === "cash") return true;
      if (paymentMethod === "card") return true;
      return !!(form.getValues() as any).upiTransactionId;
    }
    return true;
  };

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
              const skip = eventIsPaid && totalAmount === 0 && s === 'Payment';
              if (skip) return null;

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
                  {index < steps.length - 1 && !skip && (
                     (eventIsPaid && totalAmount === 0 && index === steps.indexOf('Details')) ? null : <div className="flex-1 h-0.5 bg-border mx-2"></div>
                  )}
                </React.Fragment>
              )
            })}
           </div>
        </DialogHeader>

        <Form {...form}>
          <div className="max-h-[60vh] overflow-y-auto p-1">
           {renderStepContent()}
          </div>
        </Form>

        <DialogFooter className="mt-8">
          {step > 1 && step < steps.length && (
            <Button variant="outline" onClick={handleBack} type="button" disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          {step < steps.length - 1 && (
            <Button onClick={handleNext} type="button" className="ml-auto" disabled={isSubmitting || (step === 3 && !canProceed())}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === steps.length - 1 && (
             <Button type="button" onClick={onSubmit} className="ml-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Step Components ---

const OrderSummaryStep = ({ event, selectedSeats, subtotal, total, isPaid, feeBreakdown }: {
  event: Event;
  selectedSeats: { seat: Seat, section: SeatSection }[];
  subtotal: number;
  total: number;
  isPaid: boolean;
  feeBreakdown: any;
}) => (
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
        {isPaid && subtotal > 0 && <>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {feeBreakdown && <>
                <div className="flex justify-between text-muted-foreground"><span>GST ({feeBreakdown.gstPercentage}%)</span><span>₹{feeBreakdown.gst.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Platform Fee</span><span>₹{feeBreakdown.platformFee.toFixed(2)}</span></div>
              </>}
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
            </div>
        </>}
        {(!isPaid || subtotal === 0) && <p className="text-muted-foreground text-sm">This is a free booking.</p>}
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

const PaymentStep = ({
  total,
  subtotal,
  feeBreakdown,
  selectedMethod,
  onSelectMethod,
  form,
}: {
  total: number;
  subtotal: number;
  feeBreakdown: any;
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (m: PaymentMethod) => void;
  form: any;
}) => {
  const upiId = form.watch('upiTransactionId');

  return (
    <div>
      <h3 className="font-semibold mb-4 text-lg text-center">Choose Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className="space-y-2">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            const isUPI = ["phonepe", "gpay", "paytm"].includes(pm.id);
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => onSelectMethod(pm.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  selectedMethod === pm.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  selectedMethod === pm.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{pm.label}</p>
                  <p className="text-xs text-muted-foreground">{pm.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
          {!selectedMethod && (
            <div className="text-center text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select a payment method</p>
            </div>
          )}

          {selectedMethod && ["phonepe", "gpay", "paytm"].includes(selectedMethod) && (
            <div className="text-center space-y-4 w-full">
              <div className="bg-white dark:bg-white rounded-xl p-3 inline-block mx-auto">
                <QRCode
                  value={`upi://pay?pa=${RIC_UPI_ID}&pn=RIC%20Jaipur&am=${total.toFixed(2)}&cu=INR`}
                  size={140}
                />
              </div>
              <p className="text-sm font-medium">
                Pay ₹{total.toFixed(2)} to <span className="text-primary">{RIC_UPI_ID}</span>
              </p>
              <p className="text-xs text-muted-foreground">Scan this QR with {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}</p>
              <Separator />
              <div className="text-left">
                <FormLabel>UPI Transaction ID / Reference No.</FormLabel>
                <Input
                  placeholder="e.g. UPI1234567890"
                  value={upiId || ""}
                  onChange={(e) => form.setValue('upiTransactionId', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the transaction ID from your UPI app after payment</p>
              </div>
            </div>
          )}

          {selectedMethod === "card" && (
            <div className="space-y-4 w-full">
              <FormField control={form.control} name="payment.cardName" render={({ field }) => (
                <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="payment.cardNumber" render={({ field }) => (
                <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input {...field} placeholder="0000 0000 0000 0000" maxLength={16} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex space-x-4">
                <FormField control={form.control} name="payment.expiryDate" render={({ field }) => (
                  <FormItem className="flex-1"><FormLabel>Expiry (MM/YY)</FormLabel><FormControl><Input {...field} placeholder="MM/YY" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="payment.cvc" render={({ field }) => (
                  <FormItem className="flex-1"><FormLabel>CVC</FormLabel><FormControl><Input {...field} placeholder="123" maxLength={4} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
          )}

          {selectedMethod === "cash" && (
            <div className="text-center space-y-3">
              <Banknote className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="font-medium">Pay at Venue Counter</p>
              <p className="text-sm text-muted-foreground">Please carry the exact amount. Your booking will be confirmed on payment at the venue.</p>
              <Badge variant="outline" className="border-amber-500 text-amber-600">Payment Pending</Badge>
            </div>
          )}

          {selectedMethod && (
            <>
              <Separator className="my-4" />
              {feeBreakdown && subtotal > 0 && (
                <div className="w-full space-y-1 text-xs text-muted-foreground mb-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>GST ({feeBreakdown.gstPercentage}%)</span><span>₹{feeBreakdown.gst.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Platform Fee</span><span>₹{feeBreakdown.platformFee.toFixed(2)}</span></div>
                </div>
              )}
              <div className="flex justify-between font-bold text-base w-full">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const InvoiceStep = ({ event, form, bookingId, total, feeBreakdown, subtotal }: {
  event: Event;
  form: any;
  bookingId: string | null;
  total: number;
  feeBreakdown: any;
  subtotal: number;
}) => {
    const { user } = useAuth();
    const invoiceId = `invoice-card-${bookingId}`;

    const qrValue = JSON.stringify({
        bookingId,
        eventName: event.name,
        user: user?.email,
        seats: form.getValues('attendees').map((a: any) => a.seatId).join(', '),
    });

    const baseTotal = form.getValues('attendees').reduce((acc: number, att: any) => acc + (att.isMember ? 0 : att.price), 0);

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
                {feeBreakdown && subtotal > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 mb-2">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>GST ({feeBreakdown.gstPercentage}%)</span><span>₹{feeBreakdown.gst.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Platform Fee</span><span>₹{feeBreakdown.platformFee.toFixed(2)}</span></div>
                    <Separator />
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                    <span>Total Paid:</span>
                    <span>₹{total.toFixed(2)}</span>
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
