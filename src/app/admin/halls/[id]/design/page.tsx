"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getHall, saveHallLayout } from "../../actions";
import { ArrowLeft, Plus, Trash2, Save, Eye, Settings, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SeatZone = "VIP" | "Premium" | "Standard" | "Balcony";
type HallRowData = { rowId: string; seats: number; zone: SeatZone; blocked: number[] };
type HallSectionData = { sectionName: string; rows: HallRowData[] };

const zoneColors: Record<SeatZone, string> = {
  VIP: "bg-yellow-400/40 border-yellow-500 text-yellow-800 dark:text-yellow-300",
  Premium: "bg-blue-400/40 border-blue-500 text-blue-800 dark:text-blue-300",
  Standard: "bg-green-400/40 border-green-500 text-green-800 dark:text-green-300",
  Balcony: "bg-gray-400/40 border-gray-500 text-gray-800 dark:text-gray-300",
};

const zoneBadgeColors: Record<SeatZone, string> = {
  VIP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Premium: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Standard: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Balcony: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

const zoneSvgColors: Record<SeatZone, string> = {
  VIP: "#eab308",
  Premium: "#3b82f6",
  Standard: "#22c55e",
  Balcony: "#8b5cf6",
};

const rowLabels = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

// SVG Seat Map Configuration
const SEAT_RADIUS = 4.5;
const SEAT_SPACING = 10;
const ROW_SPACING = 10;
const VIEW_BOX = "0 0 680 530";
const STAGE_Y = 490;
const STAGE_WIDTH = 200;
const STAGE_X = 240;

// Section configurations with positions and angles
const sectionConfigs = [
  // Center Sections (no angle)
  { name: "Center Back", rowIds: ['R', 'Q', 'P'], seatsPerRow: 14, xStart: 270, yStart: 310, angle: 0, pivotX: 305, pivotY: 340, zone: 'Balcony' as SeatZone },
  { name: "Upper Center Left", rowIds: ['O', 'N', 'M', 'L', 'K'], seatsPerRow: 5, xStart: 215, yStart: 340, angle: 0, pivotX: 227.5, pivotY: 365, zone: 'Premium' as SeatZone },
  { name: "Upper Center Right", rowIds: ['O', 'N', 'M', 'L', 'K'], seatsPerRow: 5, xStart: 415, yStart: 340, angle: 0, pivotX: 427.5, pivotY: 365, zone: 'Premium' as SeatZone },
  { name: "Center Front", rowIds: ['D', 'C', 'B', 'A'], seatsPerRow: 8, xStart: 300, yStart: 450, angle: 0, pivotX: 320, pivotY: 470, zone: 'Premium' as SeatZone },
  // Left Sections (angled clockwise)
  { name: "Left Far", rowIds: ['Q','P','O','N','M','L','K','J','I'], seatsPerRow: 5, xStart: 50, yStart: 320, angle: 15, pivotX: 75, pivotY: 410, zone: 'Balcony' as SeatZone },
  { name: "Left Wing Upper", rowIds: ['O','N','M','L','K','J'], seatsPerRow: 6, xStart: 90, yStart: 340, angle: 12, pivotX: 120, pivotY: 405, zone: 'Standard' as SeatZone },
  { name: "Left Wing Mid A", rowIds: ['I','H','G','F'], seatsPerRow: 3, xStart: 130, yStart: 400, angle: 12, pivotX: 145, pivotY: 420, zone: 'Standard' as SeatZone },
  { name: "Left Wing Mid B", rowIds: ['E','D','C','B','A'], seatsPerRow: 4, xStart: 140, yStart: 440, angle: 12, pivotX: 160, pivotY: 465, zone: 'Standard' as SeatZone },
  { name: "Left Wing Lower", rowIds: ['G','F','E','D','C','B','A'], seatsPerRow: 6, xStart: 80, yStart: 420, angle: 20, pivotX: 110, pivotY: 475, zone: 'Standard' as SeatZone },
];

// Generate mirror right sections
const rightSections = sectionConfigs
  .filter(s => s.name.includes("Left") || s.name.includes("Right") === false)
  .filter(s => s.angle !== 0)
  .map(s => ({
    ...s,
    name: s.name.replace("Left", "Right"),
    xStart: 680 - s.xStart - (s.seatsPerRow * SEAT_SPACING),
    angle: -s.angle,
    pivotX: 680 - s.pivotX,
    pivotY: s.pivotY,
  }));

const allSectionConfigs = [...sectionConfigs, ...rightSections];

function getSectionShortId(name: string): string {
  const map: Record<string, string> = {
    "Center Back": "CB",
    "Upper Center Left": "UCL",
    "Upper Center Right": "UCR",
    "Center Front": "CF",
    "Left Far": "LF",
    "Left Wing Upper": "LWU",
    "Left Wing Mid A": "LWMA",
    "Left Wing Mid B": "LWMB",
    "Left Wing Lower": "LWL",
    "Right Far": "RF",
    "Right Wing Upper": "RWU",
    "Right Wing Mid A": "RWMA",
    "Right Wing Mid B": "RWMB",
    "Right Wing Lower": "RWL",
  };
  return map[name] || name.split(' ').map(w => w[0]).join('');
}

function getZonePrice(zone: SeatZone): number {
  const prices: Record<SeatZone, number> = {
    VIP: 2500,
    Premium: 2000,
    Standard: 1500,
    Balcony: 1000,
  };
  return prices[zone];
}

export default function HallDesignerPage() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.id as string;
  const { toast } = useToast();

  const [hallName, setHallName] = useState("");
  const [sections, setSections] = useState<HallSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const [blockMode, setBlockMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const [newRowSeats, setNewRowSeats] = useState(20);
  const [newRowZone, setNewRowZone] = useState<SeatZone>("Standard");
  const [newRowSection, setNewRowSection] = useState(0);

  const totalSeats = useMemo(() => {
    return sections.reduce((sum, s) => sum + s.rows.reduce((r, row) => r + (row.seats - row.blocked.length), 0), 0);
  }, [sections]);

  const totalBlocked = useMemo(() => {
    return sections.reduce((sum, s) => sum + s.rows.reduce((r, row) => r + row.blocked.length, 0), 0);
  }, [sections]);

  useEffect(() => {
    loadHall();
  }, [hallId]);

  const loadHall = async () => {
    const res = await getHall(hallId);
    if (res.success && res.hall) {
      setHallName(res.hall.name);
      const secs = res.hall.sections as any[];
      setSections(secs.length > 0 ? secs : generateDefaultSections());
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not load hall." });
    }
    setLoading(false);
  };

  function generateDefaultSections(): HallSectionData[] {
    return allSectionConfigs.map(cfg => ({
      sectionName: cfg.name,
      rows: cfg.rowIds.map(rowId => ({
        rowId,
        seats: cfg.seatsPerRow,
        zone: cfg.zone,
        blocked: [] as number[],
      }))
    }));
  }

  const handleAddRow = useCallback(() => {
    setSections(prev => {
      const updated = [...prev];
      const section = updated[newRowSection];
      const nextLetter = section.rows.length < 26 ? rowLabels[section.rows.length] : `R${section.rows.length + 1}`;
      section.rows.push({
        rowId: nextLetter,
        seats: newRowSeats,
        zone: newRowZone,
        blocked: [],
      });
      return updated;
    });
  }, [newRowSeats, newRowZone, newRowSection]);

  const handleToggleBlock = (sectionIdx: number, rowIdx: number, seatNum: number) => {
    setSections(prev => {
      const updated = [...prev];
      const row = updated[sectionIdx].rows[rowIdx];
      const idx = row.blocked.indexOf(seatNum);
      if (idx >= 0) {
        row.blocked.splice(idx, 1);
      } else {
        row.blocked.push(seatNum);
      }
      return updated;
    });
  };

  // Handle seat click in SVG preview - MUST be before any early returns
  const handleSeatClick = useCallback((seatId: string, sectionIdx: number, rowIdx: number, seatNum: number) => {
    if (mode !== "edit" || !blockMode) return;
    
    const newSelected = selectedSeats.includes(seatId)
      ? selectedSeats.filter(s => s !== seatId)
      : [...selectedSeats, seatId];
    setSelectedSeats(newSelected);
    
    // Toggle blocked state
    handleToggleBlock(sectionIdx, rowIdx, seatNum);
  }, [mode, blockMode, selectedSeats, handleToggleBlock]);

  const handleDeleteRow = (sectionIdx: number, rowIdx: number) => {
    setSections(prev => {
      const updated = [...prev];
      updated[sectionIdx].rows.splice(rowIdx, 1);
      return updated;
    });
  };

  const handleUpdateRowSeats = (sectionIdx: number, rowIdx: number, newSeats: number) => {
    setSections(prev => {
      const updated = [...prev];
      const row = updated[sectionIdx].rows[rowIdx];
      const oldMax = row.seats;
      row.seats = newSeats;
      row.blocked = row.blocked.filter(b => b <= newSeats);
      return updated;
    });
  };

  const handleUpdateRowZone = (sectionIdx: number, rowIdx: number, newZone: SeatZone) => {
    setSections(prev => {
      const updated = [...prev];
      updated[sectionIdx].rows[rowIdx].zone = newZone;
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveHallLayout(hallId, { sections, totalSeats });
    if (res.success) {
      toast({ title: "Saved", description: `Hall layout saved. ${totalSeats} available seats.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
    setSaving(false);
  };

  const handleAddSection = () => {
    setSections(prev => [...prev, { sectionName: `Section ${prev.length + 1}`, rows: [] }]);
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading hall...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/halls"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{hallName}</h1>
            <p className="text-muted-foreground text-sm">Seat Layout Designer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{totalSeats} available</Badge>
          {totalBlocked > 0 && <Badge variant="destructive">{totalBlocked} blocked</Badge>}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Layout"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />Seat Map Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Button variant={mode === "edit" ? "default" : "outline"} size="sm" onClick={() => { setMode("edit"); setSelectedSeats([]); }}>
                <Settings className="mr-2 h-3.5 w-3.5" />Edit
              </Button>
              <Button variant={mode === "preview" ? "default" : "outline"} size="sm" onClick={() => { setMode("preview"); setSelectedSeats([]); }}>
                <Eye className="mr-2 h-3.5 w-3.5" />Preview
              </Button>
              {mode === "edit" && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant={blockMode ? "destructive" : "outline"} size="sm" onClick={() => { setBlockMode(!blockMode); setSelectedSeats([]); }}>
                    {blockMode ? "Block Mode ON" : "Block Mode"}
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">{blockMode ? "Click seats to block/unblock" : "Toggle Block Mode to edit"}</span>
                </>
              )}
            </div>

            {/* SVG Seat Map */}
            <div className="overflow-x-auto pb-4">
              <svg viewBox="0 0 680 530" className="w-full max-w-[680px] mx-auto border rounded-lg bg-background" style={{ maxHeight: '500px' }}>
                {/* Stage */}
                <rect x={STAGE_X} y={STAGE_Y} width={STAGE_WIDTH} height="30" rx="4" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
                <text x="340" y="510" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">STAGE</text>

                {/* Render sections */}
                {allSectionConfigs.map((cfg, cfgIdx) => {
                  const sectionData = sections.find(s => s.sectionName === cfg.name);
                  if (!sectionData) return null;

                  return (
                    <g key={cfg.name} transform={cfg.angle !== 0 ? `rotate(${cfg.angle}, ${cfg.pivotX}, ${cfg.pivotY})` : undefined}>
                      {cfg.rowIds.map((rowId, rowIdx) => {
                        const rowData = sectionData.rows.find(r => r.rowId === rowId);
                        if (!rowData) return null;

                        return (
                          <g key={rowId}>
                            {Array.from({ length: rowData.seats }).map((_, seatIdx) => {
                              const seatNum = seatIdx + 1;
                              const seatX = cfg.xStart + (seatIdx * SEAT_SPACING);
                              const seatY = cfg.yStart + (rowIdx * ROW_SPACING);
                              const isBlocked = rowData.blocked.includes(seatNum);
                              const seatId = `${getSectionShortId(cfg.name)}-${rowId}-${seatNum}`;
                              const fillColor = isBlocked ? "#6b7280" : zoneSvgColors[rowData.zone];

                              return (
                                <circle
                                  key={seatNum}
                                  cx={seatX}
                                  cy={seatY}
                                  r={SEAT_RADIUS}
                                  fill={fillColor}
                                  className={mode === "edit" && blockMode ? "cursor-pointer hover:opacity-80" : "cursor-default"}
                                  onClick={() => mode === "edit" && blockMode && handleSeatClick(seatId, sections.indexOf(sectionData), sectionData.rows.indexOf(rowData), seatNum)}
                                  title={`${cfg.name} - Row ${rowId}, Seat ${seatNum} - ${rowData.zone} ₹${getZonePrice(rowData.zone)}`}
                                />
                              );
                            })}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 flex-wrap">
              {(["Premium", "Standard", "Balcony"] as SeatZone[]).map(zone => (
                <div key={zone} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zoneSvgColors[zone] }} />
                  <span className="text-xs">{zone} (₹{getZonePrice(zone)})</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500" />
                <span className="text-xs">Blocked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-56 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["VIP", "Premium", "Standard", "Balcony"] as SeatZone[]).map(zone => (
                <div key={zone} className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 rounded-sm border", zoneColors[zone])} />
                  <span className="text-xs">{zone}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-red-500/40 border-red-600/60" />
                <span className="text-xs">Blocked</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map(s => {
                const zoneCount: Record<SeatZone, number> = { VIP: 0, Premium: 0, Standard: 0, Balcony: 0 };
                s.rows.forEach(r => { zoneCount[r.zone] += r.seats - r.blocked.length; });
                return (
                  <div key={s.sectionName} className="space-y-1">
                    {sections.length > 1 && <div className="text-xs font-semibold">{s.sectionName}</div>}
                    {Object.entries(zoneCount).filter(([, c]) => c > 0).map(([zone, count]) => (
                      <div key={zone} className="flex justify-between text-xs">
                        <Badge className={cn("text-xs px-1.5 py-0", zoneBadgeColors[zone as SeatZone])}>{zone}</Badge>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between text-xs font-semibold">
                <span>Available</span>
                <span>{totalSeats}</span>
              </div>
            </CardContent>
          </Card>

          {/* Section List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-48 overflow-y-auto">
              {allSectionConfigs.map(cfg => (
                <div key={cfg.name} className="text-xs flex justify-between">
                  <span>{cfg.name}</span>
                  <span className="text-muted-foreground">{cfg.rowIds.length} rows × {cfg.seatsPerRow}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
