"use client";

import { useState } from "react";
import type { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TicketSelectionProps {
  event: Event;
  onProceed: (ticketCount: number) => void;
}

export function TicketSelection({ event, onProceed }: TicketSelectionProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const { toast } = useToast();
  
  const minPrice = event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map(t => t.price)) : 0;
  const isFreeEvent = event.ticketTypes.every(t => t.price === 0);

  const handleProceed = () => {
    if (ticketCount === 0) {
      toast({
        variant: 'destructive',
        title: "No tickets selected",
        description: "Please select at least one ticket.",
      });
      return;
    }
    onProceed(ticketCount);
  };

  return (
    <Card className="shadow-lg border-none">
        <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold text-gray-800 mb-1">Select Tickets</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                        Choose the number of seats you want to book.
                    </CardDescription>
                </div>
                <div className="flex h-10 w-10 items-center justify-center bg-gray-50 rounded-full">
                    <Ticket className="h-5 w-5 text-[#F84464]" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 pt-0">
             <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setTicketCount(Math.max(1, ticketCount - 1))} 
                  disabled={ticketCount <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-gray-300 hover:border-gray-400 transition-colors"
                >
                    <Minus className="h-4 w-4 text-gray-500" />
                </Button>
                <span className="text-3xl font-bold text-gray-800 min-w-[44px] text-center">{ticketCount}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setTicketCount(Math.min(6, ticketCount + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-gray-300 hover:border-gray-400 transition-colors"
                >
                    <Plus className="h-4 w-4 text-gray-500" />
                </Button>
            </div>
            <div className="w-full">
              <div className="space-y-2 pt-4 border-t border-gray-100">
                {event.ticketTypes.map((t, i) => (
                  <div key={i} className="flex justify-between px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{t.type}</span>
                    <span className="text-sm font-semibold">{t.price === 0 ? 'Free' : `₹${t.price}`}</span>
                  </div>
                ))}
                {event.ticketTypes.length === 0 && (
                  <div className="flex justify-between px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">General Admission</span>
                    <span className="text-sm font-semibold">{isFreeEvent ? 'Free' : `Starting from ₹${minPrice}`}</span>
                  </div>
                )}
              </div>
            </div>
             <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                <p className="flex items-center justify-center gap-2">
                  <span className="text-xs font-medium">Starting from</span>
                  <span className="font-semibold text-gray-800">₹{minPrice}</span>
                </p>
             </div>
        </CardContent>
        <CardFooter className="pt-4">
             <Button 
               onClick={handleProceed} 
               size="lg" 
               className="w-full bg-[#F84464] hover:bg-[#F84464]/90 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
             >
                <Ticket className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {event.seatingChart ? `Select ${ticketCount} Seats` : 'Register'}
                </span>
            </Button>
        </CardFooter>
    </Card>
  )
}
