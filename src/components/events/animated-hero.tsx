"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Ticket, Sparkles, ChevronLeft, MapPin, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

interface AnimatedHeroProps {
  events: Event[];
  loading: boolean;
}

const categoryColors: Record<string, string> = {
  Music: "bg-violet-500 text-white",
  Sports: "bg-emerald-500 text-white",
  Art: "bg-amber-500 text-white",
  Theater: "bg-rose-500 text-white",
  Seminar: "bg-blue-500 text-white",
  Cultural: "bg-orange-500 text-white",
  Talk: "bg-cyan-500 text-white",
  Comedy: "bg-pink-500 text-white",
};

function HeroSkeleton() {
  return (
    <section className="relative h-[90vh] min-h-[600px] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-muted-foreground/10 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/90" />
      <div className="container relative h-full flex flex-col justify-center px-4 max-w-2xl">
        <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse mb-4" />
        <div className="h-12 w-3/4 bg-white/10 rounded-xl animate-pulse mb-4" />
        <div className="h-12 w-1/2 bg-white/10 rounded-xl animate-pulse mb-6" />
        <div className="flex gap-4 mb-6">
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-8" />
        <div className="flex gap-4">
          <div className="h-13 w-36 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-13 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>
    </section>
  );
}

export function AnimatedHero({ events, loading }: AnimatedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  const heroEvents = events.slice(0, 5);
  const hasEvents = heroEvents.length > 0;

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % heroEvents.length);
  }, [heroEvents.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + heroEvents.length) % heroEvents.length);
  }, [heroEvents.length]);

  // Auto-advance every 5 seconds (pauses on hover)
  useEffect(() => {
    if (!hasEvents || isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [hasEvents, nextSlide, isPaused]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  // Loading state
  if (loading && !hasEvents) {
    return <HeroSkeleton />;
  }

  // Fallback hero when no events
  if (!hasEvents) {
    return (
      <section className="relative h-[90vh] min-h-[600px] bg-black overflow-hidden">
        <Image
          src="https://picsum.photos/seed/ric-hero/1800/1200"
          alt="Rajasthan International Center"
          fill
          className="object-cover opacity-50 scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="container relative h-full flex flex-col items-center justify-center text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge variant="secondary" className="mb-6 text-sm font-medium px-5 py-2 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-colors">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Premier Cultural Destination
            </Badge>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Rajasthan
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              International Center
            </span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg md:text-xl max-w-2xl text-white/70 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            Where culture, knowledge, and community converge in the heart of Jaipur
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-4 mt-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <Button asChild size="lg" className="px-8 h-13 text-base font-semibold bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5">
              <Link href="/events">
                <Ticket className="mr-2 h-5 w-5" />
                Explore Events
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 h-13 text-base bg-white/5 border-white/20 text-white hover:bg-white/15 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/about">
                Learn More
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
              <div className="w-1 h-2 rounded-full bg-white/50 animate-[scrollIndicator_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </section>
    );
  }

  const currentEvent = heroEvents[currentIndex];
  const categoryColor = categoryColors[currentEvent.category] || "bg-primary text-primary-foreground";

  return (
    <section
      className="relative h-[90vh] min-h-[600px] bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image carousel - single image with zoom via motion.div */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentEvent.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Slow zoom on the visible image itself */}
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.08] }}
            transition={{ duration: 5, ease: "linear" }}
          >
            <Image
              src={currentEvent.image}
              alt={currentEvent.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="container relative h-full flex flex-col justify-center px-4">
        <div className="max-w-2xl">
          {/* Category badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`badge-${currentEvent.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className={cn("text-xs px-3 py-1 rounded-full font-semibold mb-4 shadow-lg", categoryColor)}>
                {currentEvent.category}
              </Badge>
            </motion.div>
          </AnimatePresence>

          {/* Event name */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${currentEvent.id}`}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight mb-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {currentEvent.name}
            </motion.h1>
          </AnimatePresence>

          {/* Event details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`details-${currentEvent.id}`}
              className="flex flex-wrap items-center gap-4 text-white/70 text-sm mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(currentEvent.date), "EEE, MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {currentEvent.venue}
              </span>
              {currentEvent.showtimes.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {currentEvent.showtimes[0]}
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${currentEvent.id}`}
              className="text-white/60 text-base md:text-lg max-w-lg leading-relaxed mb-8 line-clamp-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {currentEvent.description}
            </motion.p>
          </AnimatePresence>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button asChild size="lg" className="px-8 h-13 text-base font-semibold bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5">
              <Link href={`/events/${currentEvent.id}`}>
                <Ticket className="mr-2 h-5 w-5" />
                Book Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 h-13 text-base bg-white/5 border-white/20 text-white hover:bg-white/15 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/events">
                All Events
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Desktop navigation arrows */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
          <button
            onClick={prevSlide}
            className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label="Previous event"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label="Next event"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {heroEvents.map((event, i) => (
            <button
              key={event.id}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === currentIndex
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${i + 1}: ${event.name}`}
            />
          ))}
        </div>

        {/* Event counter */}
        <div className="absolute bottom-24 right-8 text-white/50 text-sm font-medium hidden md:block">
          <span className="text-white font-bold">{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="mx-1">/</span>
          <span>{String(heroEvents.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Mobile navigation */}
      <div className="absolute bottom-28 left-4 right-4 flex md:hidden justify-center gap-3">
        <button
          onClick={prevSlide}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
          aria-label="Previous event"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={nextSlide}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
          aria-label="Next event"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
