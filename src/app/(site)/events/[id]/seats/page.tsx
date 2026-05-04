"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEvents } from "@/hooks/use-events";
import { Event } from "@/lib/types";
import { SeatingChart } from "@/components/events/seating-chart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ShowtimeSelector = ({ event, selectedShowtime, onSelect }: { event: Event, selectedShowtime: string, onSelect: (time: string) => void }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {event.showtimes.map(time => (
                <Button 
                    key={time} 
                    variant={selectedShowtime === time ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSelect(time)}
                    className={cn(
                        "text-xs font-semibold py-1 px-3 h-8",
                        selectedShowtime === time ? "bg-black text-white" : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    )}
                >
                    {time}
                </Button>
            ))}
        </div>
    )
}

const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, label: "TICKETS" },
        { id: 2, label: "SEATS" },
        { id: 3, label: "PAY" },
    ];

    return (
        <div className="bg-white border-b py-4">
            <div className="max-w-[280px] mx-auto flex items-center justify-between">
                {steps.map((s, i) => (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                currentStep === s.id ? "bg-[#F84464] text-white" : "bg-gray-200 text-gray-500"
                            )}>
                                {s.id}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-tighter",
                                currentStep === s.id ? "text-[#F84464]" : "text-gray-400"
                            )}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="flex-1 h-[1px] bg-gray-200 mx-2 -mt-4" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function TicketCategorySelection({ event, onNext }: { event: Event, onNext: (count: number) => void }) {
    const [counts, setCounts] = useState<Record<string, number>>({});
    
    const updateCount = (type: string, delta: number) => {
        setCounts(prev => ({
            ...prev,
            [type]: Math.max(0, (prev[type] || 0) + delta)
        }));
    };

    const totalTickets = Object.values(counts).reduce((a, b) => a + b, 0);
    const totalPrice = event.ticketTypes.reduce((sum, type) => sum + (type.price * (counts[type.type] || 0)), 0);

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 pb-32">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Select Ticket Category
                </h2>
                
                <div className="space-y-6">
                    {event.ticketTypes.map((type) => (
                        <div key={type.type} className="flex items-center justify-between p-4 rounded-lg border hover:border-red-200 transition-colors bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-800 uppercase tracking-wide">{type.type}</h3>
                                <p className="text-2xl font-black text-gray-900 mt-1">₹{type.price}</p>
                                <p className="text-xs text-green-600 font-bold mt-1 uppercase">Available</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {counts[type.type] > 0 ? (
                                    <div className="flex items-center gap-4 bg-white border border-red-200 rounded-lg p-1 px-3 shadow-sm">
                                        <button onClick={() => updateCount(type.type, -1)} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-red-500 hover:bg-red-50 rounded">-</button>
                                        <span className="w-6 text-center font-bold text-lg">{counts[type.type]}</span>
                                        <button onClick={() => updateCount(type.type, 1)} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-red-500 hover:bg-red-50 rounded">+</button>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="text-red-500 border-red-500 px-8 font-bold hover:bg-red-50 rounded-lg" onClick={() => updateCount(type.type, 1)}>
                                        ADD
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg flex gap-3 items-start">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Tickets are non-refundable. Please ensure you select the correct category before proceeding.
                    </p>
                </div>
            </div>

            {totalTickets > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                    <div className="max-w-2xl mx-auto flex justify-between items-center px-4">
                        <div>
                            <div className="text-2xl font-black text-gray-800">₹{totalPrice}</div>
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-tighter">{totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'}</div>
                        </div>
                        <Button className="bg-[#F84464] hover:bg-[#F84464]/90 text-white px-12 py-7 rounded-xl text-lg font-bold shadow-lg" onClick={() => onNext(totalTickets)}>
                            PROCEED
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SeatsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { events, loading } = useEvents();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<"tickets" | "seats">("tickets");
  
  const initialTicketCount = useMemo(() => {
      const countParam = searchParams.get('tickets');
      return countParam ? parseInt(countParam) : 1;
  }, [searchParams]);

  const [ticketCount, setTicketCount] = useState(initialTicketCount);
  const [selectedShowtime, setSelectedShowtime] = useState("");

  const event = events.find((e) => e.id === id);

  useEffect(() => {
      if (event && !selectedShowtime && event.showtimes.length > 0) {
          setSelectedShowtime(event.showtimes[0]);
      }
  }, [event, selectedShowtime]);

  if (loading || !event) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
    );
  }

  const goToSeats = (count: number) => {
      setTicketCount(count);
      setStep("seats");
  };

  const handleTicketCountChange = (count: number) => {
      setTicketCount(count);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-[#333545] text-white py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => step === "seats" ? setStep("tickets") : router.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">{event.name}</h1>
                        <p className="text-xs text-gray-400">{event.venue} | {format(new Date(event.date), "EEE, d MMM, yyyy")}</p>
                    </div>
                </div>
                {step === "seats" && (
                    <div className="hidden sm:flex items-center gap-2 border border-gray-500 rounded px-3 py-1">
                        <span className="text-xs font-bold uppercase tracking-wider">{ticketCount} Tickets</span>
                    </div>
                )}
            </div>
        </header>

        <Stepper currentStep={step === "tickets" ? 1 : 2} />

        <div className="bg-[#F5F5F5] py-2 border-b">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-600">
                    Rajasthan International Center: Jaipur | {format(new Date(event.date), "EEE, d MMM")} | {selectedShowtime}
                </div>
            </div>
        </div>
        
        <main className="flex-1 overflow-hidden flex flex-col">
            {step === "tickets" ? (
                <div className="flex-1 overflow-y-auto">
                    <TicketCategorySelection event={event} onNext={goToSeats} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
                        <ShowtimeSelector event={event} selectedShowtime={selectedShowtime} onSelect={setSelectedShowtime} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <SeatingChart 
                            event={event} 
                            ticketCount={ticketCount} 
                            onTicketCountChange={handleTicketCountChange} 
                        />
                    </div>
                </div>
            )}
        </main>
    </div>
  );
}
