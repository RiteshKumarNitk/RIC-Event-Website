"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Event, Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { AuditoriumLayoutConfig, SeatCategory, SeatBlock } from "@/lib/seat-layouts";
import { ZoomIn, ZoomOut, Maximize2, MousePointer2, Crown, Info } from "lucide-react";
import type { OccupiedSeatInfo } from "@/app/actions/seat-admin-actions";
import type { SeatAccessTierType } from "@/app/actions/seat-admin-actions";

const CATEGORY_COLORS: Record<SeatCategory, { fill: string; stroke: string; text: string; bg: string; border: string }> = {
  Standard: { fill: "#ffffff", stroke: "#22c55e", text: "#22c55e", bg: "bg-green-500", border: "border-green-200" },
  Premium: { fill: "#ffffff", stroke: "#06b6d4", text: "#06b6d4", bg: "bg-cyan-500", border: "border-cyan-200" },
  VIP: { fill: "#ffffff", stroke: "#ec4899", text: "#ec4899", bg: "bg-pink-500", border: "border-pink-200" },
  Balcony: { fill: "#ffffff", stroke: "#a855f7", text: "#a855f7", bg: "bg-purple-500", border: "border-purple-200" },
  Members: { fill: "#ffffff", stroke: "#f59e0b", text: "#f59e0b", bg: "bg-amber-500", border: "border-amber-200" },
};

const SEAT_R = 9;
const SEAT_GAP = 3;
const ROW_GAP = 6;
const SEAT_W = SEAT_R * 2;
const SEAT_H = SEAT_R * 2;

interface SeatState {
  id: string;
  blockId: string;
  row: number;
  col: number;
  category: SeatCategory;
  price: number;
  isBooked: boolean;
  isReserved?: boolean;
  membersOnly?: boolean;
}

export function SeatingChart({
  event,
  ticketCount,
  onTicketCountChange,
  onProceed,
  layout,
  isMember = false,
  memberLabel,
  bookedSeats = [],
  reservedSeats = [],
  // Admin Mode Props
  adminMode = false,
  blockedSeats = [],
  occupiedSeats = [],
  selectedSeatIds = [],
  onSeatClick,
  seatTiers = {},
  memberCategory,
}: {
  event: Event;
  ticketCount: number;
  onTicketCountChange: (count: number) => void;
  onProceed?: (seats: { seat: Seat; section: { sectionName: string; price: number; rows: never[]; className: string } }[]) => void;
  layout: AuditoriumLayoutConfig;
  isMember?: boolean;
  memberLabel?: string;
  bookedSeats?: string[];
  reservedSeats?: string[];
  
  // Admin Mode Props
  adminMode?: boolean;
  blockedSeats?: string[];
  occupiedSeats?: OccupiedSeatInfo[];
  selectedSeatIds?: string[];
  onSeatClick?: (seatId: string) => void;
  seatTiers?: Record<string, SeatAccessTierType>;
  memberCategory?: string;
}) {
  const [selectedSeats, setSelectedSeats] = useState<SeatState[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltipSeat, setTooltipSeat] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  const visibleBlocks = useMemo(() => {
    return layout.blocks.filter((b) => {
      if (adminMode) return true;
      if (b.membersOnly) return isMember;
      return true;
    });
  }, [layout.blocks, isMember, adminMode]);

  const hasMembersBlocks = layout.blocks.some((b) => b.membersOnly);

  // Determine if a seat is restricted by a dynamic access tier (non-admin mode)
  const isTierRestricted = useCallback((seatId: string): { restricted: boolean; reason?: string } => {
    if (adminMode) return { restricted: false };
    const tier = seatTiers[seatId];
    if (!tier || tier === 'GENERAL') return { restricted: false };
    if (tier === 'MEMBERS_ONLY') {
      if (!isMember) return { restricted: true, reason: 'Members Only' };
    } else if (tier === 'VIP_ONLY') {
      if (!isMember) return { restricted: true, reason: 'VIP Only' };
      // If they are a member, check if their category qualifies (VIP or higher)
      const isVip = memberCategory && (memberCategory.toUpperCase().includes('VIP') || memberCategory.toUpperCase().includes('FM') || memberCategory.toUpperCase().includes('CORP'));
      if (!isVip) return { restricted: true, reason: 'VIP Members Only' };
    }
    return { restricted: false };
  }, [adminMode, seatTiers, isMember, memberCategory]);

  const handleSelectSeat = (seat: SeatState) => {
    if (seat.isBooked) return;
    // Enforce static membersOnly from layout config
    if (seat.membersOnly && !isMember) {
      toast({ variant: "destructive", title: "Members Only", description: "Please verify your membership to select these seats." });
      return;
    }
    // Enforce dynamic access tier restrictions
    const { restricted, reason } = isTierRestricted(seat.id);
    if (restricted) {
      toast({ variant: "destructive", title: reason || "Restricted", description: `These seats are ${reason}. Please verify your eligibility.` });
      return;
    }
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (!isSelected && selectedSeats.length >= ticketCount) {
      toast({ variant: "destructive", title: `You can only select a maximum of ${ticketCount} seats.`, description: "Deselect a seat to choose another." });
      return;
    }
    setSelectedSeats((prev) => {
      const isSelected = prev.some(s => s.id === seat.id);
      if (isSelected) return prev.filter(s => s.id !== seat.id);
      return [...prev, seat];
    });
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast({ variant: "destructive", title: "No seats selected", description: "Please select at least one seat to proceed." });
      return;
    }
    const converted = selectedSeats.map(s => ({
      seat: { id: s.id, row: s.row.toString(), col: s.col, isBooked: s.isBooked },
      section: { sectionName: s.category, price: s.price, rows: [], className: "" },
    }));
    onProceed?.(converted);
  };

  const getTotalPrice = () => selectedSeats.reduce((total, s) => total + s.price, 0);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(z => Math.max(0.5, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const totalWidth = 1200;
  const totalHeight = 750;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Legend & Controls */}
      <div className="bg-white/80 backdrop-blur-md border-b p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-6 overflow-x-auto pb-1 no-scrollbar">
          {(["VIP", "Premium", "Standard", "Balcony"] as SeatCategory[]).map(cat => (
            <div key={cat} className="flex items-center gap-2 shrink-0">
              <div className={cn("w-4 h-4 rounded-sm border", CATEGORY_COLORS[cat].bg, CATEGORY_COLORS[cat].border)} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-500 leading-none">{cat}</span>
                <span className="text-xs font-bold">₹{event.ticketTypes.find(t => t.type === cat)?.price || 0}</span>
              </div>
            </div>
          ))}
          {hasMembersBlocks && (
            <div className="flex items-center gap-2 shrink-0">
              <div className={cn("w-4 h-4 rounded-sm border", CATEGORY_COLORS.Members.bg, CATEGORY_COLORS.Members.border)} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-500 leading-none">Members</span>
                <span className="text-xs font-bold text-amber-600">Free</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-4 h-4 rounded-sm bg-[#F84464]" />
            <span className="text-[10px] font-bold uppercase text-gray-500">Selected</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-4 h-4 rounded-sm bg-[#fde68a] border border-amber-400" />
            <span className="text-[10px] font-bold uppercase text-gray-500">Reserved</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-4 h-4 rounded-sm bg-gray-200 border border-gray-300" />
            <span className="text-[10px] font-bold uppercase text-gray-500">Booked</span>
          </div>
          {!adminMode && Object.keys(seatTiers).length > 0 && (
            <>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-4 h-4 rounded-sm bg-gray-100 border border-gray-300 opacity-50" />
                <span className="text-[10px] font-bold uppercase text-gray-400">Restricted</span>
              </div>
            </>
          )}
          {adminMode && (
            <>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-4 h-4 rounded-sm bg-pink-100 border border-pink-400" />
                <span className="text-[10px] font-bold uppercase text-pink-600">VIP Only</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-4 h-4 rounded-sm bg-amber-100 border border-amber-400" />
                <span className="text-[10px] font-bold uppercase text-amber-600">Members Only</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-4 h-4 rounded-sm bg-green-100 border border-green-400" />
                <span className="text-[10px] font-bold uppercase text-green-600">General</span>
              </div>
            </>
          )}
        </div>

        {isMember && memberLabel && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <Crown className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">{memberLabel}</span>
          </div>
        )}

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shadow-inner">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={resetView}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Member-only banner */}
      {hasMembersBlocks && !isMember && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs font-medium text-amber-800">
            <Crown className="h-3.5 w-3.5 inline mr-1" />
            Member-exclusive seats available up front. Verify your membership above to unlock free seats.
          </p>
        </div>
      )}

      {/* Seat Map */}
      <div 
        className={cn(
          "flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-gray-50/50",
          isDragging && "cursor-grabbing"
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`} 
          className="w-full h-full select-none"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 150ms ease-out"
          }}
        >
          {/* Stage at Bottom */}
          <g transform={`translate(${totalWidth/2 - 200}, ${totalHeight - 100})`}>
             <path d="M 0 100 L 400 100 L 320 0 L 80 0 Z" fill="transparent" stroke="#cbd5e1" strokeWidth="1.5" />
             <text x="200" y="60" textAnchor="middle" fill="#0f172a" fontSize="24" fontWeight="600" letterSpacing="0.1em">STAGE</text>
          </g>

          {/* MEMBERS Label (if visible) */}
          {isMember && (
            <text x={totalWidth/2} y={660} textAnchor="middle" fill="#d97706" fontSize="14" fontWeight="700" letterSpacing="0.1em">✦ MEMBERS EXCLUSIVE ✦</text>
          )}

          {/* BALCONY Text */}
          <text x={totalWidth/2} y={180} textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="600" letterSpacing="0.1em">BALCONY</text>

          {visibleBlocks.map((block) => (
            <g key={block.id} transform={`translate(${block.position.left}, ${block.position.top}) rotate(${block.rotation})`}>
              {/* Members-only badge */}
              {block.membersOnly && isMember && (
                <rect x={-10} y={-15} width={block.cols * (SEAT_W + SEAT_GAP) + 20} height={block.rows * (SEAT_H + ROW_GAP) + 20} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" rx="4" />
              )}
              {Array.from({ length: block.rows }).map((_, r) => {
                const rowLabel = String.fromCharCode(65 + r + (block.rowLabelOffset || 0));
                const rowY = (block.rows - 1 - r) * (SEAT_H + ROW_GAP);
                const rowCols = block.colsPerRow ? block.colsPerRow[r] : block.cols;
                const maxColsInBlock = block.colsPerRow ? Math.max(...block.colsPerRow) : block.cols;
                
                const seatTotalWidth = SEAT_W + SEAT_GAP;
                const rowWidth = rowCols * seatTotalWidth;
                const blockWidth = maxColsInBlock * seatTotalWidth;
                let centeringOffset = 0;
                if (block.align === "right") {
                  centeringOffset = blockWidth - rowWidth;
                } else if (block.align === "left") {
                  centeringOffset = 0;
                } else {
                  const differenceInSeats = maxColsInBlock - rowCols;
                  centeringOffset = Math.floor(differenceInSeats / 2) * seatTotalWidth;
                }

                return (
                  <g key={r}>
                    {!block.hideLeftLabel && (
                      <text x={centeringOffset - 20} y={rowY + SEAT_H / 2 + 2} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">{rowLabel}</text>
                    )}

                    {Array.from({ length: rowCols }).map((_, c) => {
                      const rowOffset = block.colOffsetsPerRow ? block.colOffsetsPerRow[r] : (block.colOffset || 0);
                      const seatNum = c + 1 + rowOffset;
                      const seatX = centeringOffset + (c * (SEAT_W + SEAT_GAP));
                      const seatId = `${block.id}-${rowLabel}-${seatNum}`;
                      const _isReserved = adminMode ? !!occupiedSeats?.find(o => o.seatId === seatId && o.type === 'reserved') : reservedSeats.includes(seatId);
                      const _isBooked = adminMode ? !!occupiedSeats?.find(o => o.seatId === seatId && o.type === 'booked') : bookedSeats.includes(seatId);
                      const _isBlocked = adminMode ? blockedSeats?.includes(seatId) : false;
                      const isSelected = adminMode && selectedSeatIds ? selectedSeatIds.includes(seatId) : selectedSeats.some(s => s.id === seatId);
                      const colors = CATEGORY_COLORS[block.category];

                      const seatState: SeatState = {
                        id: seatId,
                        blockId: block.id,
                        row: r + (block.rowLabelOffset || 0),
                        col: seatNum,
                        category: block.category,
                        price: block.membersOnly ? 0 : (event.ticketTypes.find(t => t.type === block.category)?.price || 0),
                        isBooked: _isBooked || _isReserved,
                        isReserved: _isReserved,
                        membersOnly: block.membersOnly,
                      };

                      let seatFill = _isBooked ? "#e2e8f0" : _isReserved ? "#fde68a" : isSelected ? "#F84464" : colors.fill;
                      let seatStroke = _isBooked ? "#cbd5e1" : _isReserved ? "#f59e0b" : isSelected ? "#dc2626" : colors.stroke;

                      if (adminMode && _isBlocked) {
                        seatFill = "#fee2e2";
                        seatStroke = "#ef4444";
                      }

                      // Access tier coloring for admin mode
                      const tier = adminMode ? seatTiers[seatId] : undefined;
                      if (adminMode && tier && !_isBlocked && !_isBooked && !isSelected) {
                        if (tier === 'VIP_ONLY') { seatFill = '#fce7f3'; seatStroke = '#db2777'; }
                        else if (tier === 'MEMBERS_ONLY') { seatFill = '#fef3c7'; seatStroke = '#d97706'; }
                        else if (tier === 'GENERAL') { seatFill = '#dcfce7'; seatStroke = '#16a34a'; }
                      }

                      // Public mode: visually dim tier-restricted seats for ineligible users
                      const { restricted: isRestricted } = !adminMode ? isTierRestricted(seatId) : { restricted: false };
                      if (!adminMode && isRestricted && !_isBooked && !_isReserved) {
                        seatFill = '#fef9ee';
                        seatStroke = '#d4a843';
                      }

                      const occupant = adminMode ? occupiedSeats?.find(o => o.seatId === seatId) : null;

                      return (
                        <g
                          key={c}
                          className={adminMode ? "cursor-pointer" : (seatState.isBooked || isRestricted ? "cursor-not-allowed opacity-50" : "cursor-pointer")}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (adminMode && onSeatClick) {
                              onSeatClick(seatId);
                            } else if (!seatState.isBooked) {
                              handleSelectSeat(seatState);
                            }
                          }}
                          onMouseEnter={() => adminMode && occupant && setTooltipSeat(seatId)}
                          onMouseLeave={() => adminMode && setTooltipSeat(null)}
                        >
                          <circle
                            cx={seatX + SEAT_R}
                            cy={rowY + SEAT_R}
                            r={SEAT_R}
                            fill={seatFill}
                            stroke={seatStroke}
                            strokeWidth={isSelected ? 1.5 : 1}
                            className="transition-colors duration-200"
                          />
                          <text
                            x={seatX + SEAT_R}
                            y={rowY + SEAT_R + 2.5}
                            textAnchor="middle"
                            fill={(!adminMode && seatState.isBooked) ? "transparent" : isSelected ? "#fff" : colors.text}
                            fontSize="7"
                            fontWeight="600"
                            className="pointer-events-none select-none"
                          >
                            {seatNum}
                          </text>

                          {/* Admin Toolkit: Occupied Tooltip */}
                          {adminMode && tooltipSeat === seatId && occupant && (
                            <g className="pointer-events-none">
                              <rect x={seatX - 30} y={rowY - 35} width="80" height="30" fill="#fff" rx="4" stroke="#e2e8f0" />
                              <text x={seatX + 10} y={rowY - 20} textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">
                                {occupant.type === 'booked' ? 'Booked' : 'Reserved'}
                              </text>
                              <text x={seatX + 10} y={rowY - 10} textAnchor="middle" fill="#64748b" fontSize="6">
                                {occupant.memberName || occupant.attendeeName || 'Unknown'}
                              </text>
                            </g>
                          )}
                          
                          {/* Admin Toolkit: Blocked Indicator */}
                          {adminMode && _isBlocked && (
                            <line x1={seatX} y1={rowY} x2={seatX + SEAT_W} y2={rowY + SEAT_H} stroke="#ef4444" strokeWidth="1.5" />
                          )}

                          {/* Admin Toolkit: Tier Indicator Badge */}
                          {adminMode && tier && !_isBlocked && !_isBooked && !isSelected && (
                            <g className="pointer-events-none">
                              <circle cx={seatX + SEAT_W - 1} cy={rowY + 1} r={3} fill={
                                tier === 'VIP_ONLY' ? '#db2777' : tier === 'MEMBERS_ONLY' ? '#d97706' : '#16a34a'
                              } stroke="white" strokeWidth="0.5" />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {!block.hideRightLabel && (
                      <text x={centeringOffset + rowWidth + 15} y={rowY + SEAT_H / 2 + 2} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">{rowLabel}</text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>

        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 pointer-events-none">
          <MousePointer2 className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[10px] font-medium text-gray-600">Drag to pan • Ctrl + Scroll to zoom</span>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={cn(
        "bg-white border-t p-4 flex justify-center transition-all duration-300 transform shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-30",
        selectedSeats.length > 0 ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="max-w-4xl w-full flex justify-between items-center px-4">
          <div className="flex flex-col">
            <div className="text-2xl font-black text-gray-900 tracking-tight">₹{getTotalPrice()}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
              {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
            </div>
          </div>
          <Button className="bg-[#F84464] hover:bg-[#F84464]/90 text-white px-10 py-6 rounded-xl text-lg font-bold shadow-[0_8px_20px_rgba(248,68,100,0.3)] transition-all active:scale-95" onClick={handleProceed}>
            PROCEED
          </Button>
        </div>
      </div>
    </div>
  );
}
