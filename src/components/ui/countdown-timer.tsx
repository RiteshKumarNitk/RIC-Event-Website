"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return <span className="text-red-500 font-semibold">Event Started</span>;
  }

  return (
    <div className="flex gap-3 md:gap-4">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Mins" },
        { value: timeLeft.seconds, label: "Secs" },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="bg-white/10 backdrop-blur rounded-lg w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-white">
              {String(item.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-white/60 mt-1 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
