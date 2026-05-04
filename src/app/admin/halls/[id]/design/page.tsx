"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getHall, saveHallLayout } from "../../actions";
import {
  Plus,
  Trash2,
  Save,
  MoveUp,
  MoveDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { SectionConfig, SeatConfig, SeatZone, calculateTotalSeats } from "@/lib/default-hall-layout";

const ZONE_STYLES: Record<SeatZone, { fill: string; stroke: string; text: string; bg: string; ring: string }> = {
  VIP: { fill: "#f472b6", stroke: "#db2777", text: "#fff", bg: "bg-pink-500", ring: "ring-pink-500/30" },
  Premium: { fill: "#2dd4bf", stroke: "#0d9488", text: "#fff", bg: "bg-teal-500", ring: "ring-teal-500/30" },
  Standard: { fill: "#38bdf8", stroke: "#0284c7", text: "#fff", bg: "bg-sky-500", ring: "ring-sky-500/30" },
  Balcony: { fill: "#a78bfa", stroke: "#7c3aed", text: "#fff", bg: "bg-violet-500", ring: "ring-violet-500/30" },
};

const SEAT_W = 30;
const SEAT_H = 28;
const SEAT_GAP = 4;
const ROW_GAP = 8;

export default function DesignSeatsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast } = useToast();

  const [hallName, setHallName] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function loadHall() {
      const res = await getHall(id);
      if (res.success && res.hall) {
        setHallName(res.hall.name);
        const rawSections = (res.hall.sections as any[]) || [];
        const normalizedSections: SectionConfig[] = rawSections.map(s => ({
          ...s,
          rows: s.rows.map((r: any) => ({
            ...r,
            seats: Array.isArray(r.seats) ? r.seats.length : (typeof r.seats === 'number' ? r.seats : 0),
            blocked: r.blocked || []
          }))
        }));
        const finalSections =
          normalizedSections.length === 0
            ? getDefaultCinemaLayout()
            : normalizedSections;

        setSections(finalSections);

        if (finalSections.length > 0) {
          setActiveSection(finalSections[0].sectionName);
        }
        if (normalizedSections.length > 0) {
          setActiveSection(normalizedSections[0].sectionName);
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Failed to load hall" });
        router.push("/admin/halls");
      }
      setLoading(false);
    }
    loadHall();
  }, [id, router, toast]);

  const totalSeats = calculateTotalSeats(sections);
  const boundingBox = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    sections.forEach(section => {
      if (hiddenSections.has(section.sectionName)) return;

      section.rows.forEach((row, rowIdx) => {
        const totalSeats = row.seats;
        const centerIndex = (totalSeats - 1) / 2;

        for (let i = 0; i < totalSeats; i++) {
          let x = section.xStart + (i * (SEAT_W + SEAT_GAP));
          let y = section.yStart + (rowIdx * (SEAT_H + ROW_GAP));

          // 🔥 ARC SUPPORT
          if (section.arcRadius) {
            const angleSpread = 0.8;
            const angleStep = angleSpread / totalSeats;
            const angle = (i - centerIndex) * angleStep;

            const radius = section.arcRadius + rowIdx * 20;

            x = section.xStart + Math.sin(angle) * radius;
            const baseY = section.yStart + (rowIdx * (SEAT_H + ROW_GAP));
            y = baseY + Math.cos(angle) * 10;
          }

          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + SEAT_W);
          maxY = Math.max(maxY, y + SEAT_H);
        }
      });
    });

    if (minX === Infinity) return { minX: 0, minY: 0, width: 900, height: 600 };

    const pad = 120;
    return {
      minX: minX - pad,
      minY: minY - pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2
    };
  }, [sections, hiddenSections]);

  const addSection = () => {
    const name = `Section ${sections.length + 1}`;
    setSections([...sections, { sectionName: name, xStart: 100, yStart: 100, angle: 0, rows: [{ rowId: "A", seats: 12, zone: "Standard", blocked: [] }] }]);
    setActiveSection(name);
  };

  const deleteSection = (name: string) => {
    if (sections.length <= 1) { toast({ title: "Cannot delete", description: "At least one section is required." }); return; }
    const updated = sections.filter(s => s.sectionName !== name);
    setSections(updated);
    setHiddenSections(prev => { const n = new Set(prev); n.delete(name); return n; });
    if (activeSection === name) setActiveSection(updated[0].sectionName);
  };

  const updateSectionProp = (name: string, prop: keyof SectionConfig, value: any) => {
    setSections(sections.map(s => s.sectionName === name ? { ...s, [prop]: value } : s));
  };

  function getDefaultCinemaLayout() {
    return [
      {
        sectionName: "Left",
        xStart: 250,
        yStart: 120,
        arcRadius: 220,
        angle: -10,
        rows: generateRows(6, 10, "Standard"),
      },
      {
        sectionName: "Center",
        xStart: 450,
        yStart: 100,
        arcRadius: 260,
        angle: 0,
        rows: generateRows(8, 14, "Premium"),
      },
      {
        sectionName: "Right",
        xStart: 650,
        yStart: 120,
        arcRadius: 220,
        angle: 10,
        rows: generateRows(6, 10, "Standard"),
      },
    ];
  }

  function generateRows(count: number, seats: number, zone: SeatZone) {
    return Array.from({ length: count }).map((_, i) => ({
      rowId: String.fromCharCode(65 + i),
      seats,
      zone,
      blocked: [],
    }));
  }
  const addRow = (sectionName: string) => {
    setSections(sections.map(s => {
      if (s.sectionName !== sectionName) return s;
      const last = s.rows[s.rows.length - 1];
      const nextId = last ? String.fromCharCode(last.rowId.charCodeAt(0) + 1) : "A";
      return { ...s, rows: [...s.rows, { rowId: nextId, seats: 12, zone: "Standard", blocked: [] }] };
    }));
  };

  const deleteRow = (sectionName: string, rowId: string) => {
    setSections(sections.map(s => s.sectionName === sectionName ? { ...s, rows: s.rows.filter(r => r.rowId !== rowId) } : s));
  };

  const moveRow = (sectionName: string, rowId: string, dir: "up" | "down") => {
    setSections(sections.map(s => {
      if (s.sectionName !== sectionName) return s;
      const rows = [...s.rows];
      const idx = rows.findIndex(r => r.rowId === rowId);
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= rows.length) return s;
      [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
      return { ...s, rows };
    }));
  };

  const updateRowProp = (sectionName: string, rowId: string, prop: keyof SeatConfig, value: any) => {
    setSections(sections.map(s =>
      s.sectionName === sectionName ? { ...s, rows: s.rows.map(r => r.rowId === rowId ? { ...r, [prop]: value } : r) } : s
    ));
  };

  const toggleSeatBlocked = useCallback((sectionName: string, rowId: string, seatIdx: number) => {
    setSections(prev => prev.map(s => {
      if (s.sectionName !== sectionName) return s;
      return { ...s, rows: s.rows.map(r => r.rowId !== rowId ? r : { ...r, blocked: r.blocked.includes(seatIdx) ? r.blocked.filter(i => i !== seatIdx) : [...r.blocked, seatIdx] }) };
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveHallLayout(id, { sections, totalSeats: calculateTotalSeats(sections) });
    if (res.success) toast({ title: "Success", description: "Seat layout saved." });
    else toast({ variant: "destructive", title: "Error", description: res.error || "Failed to save." });
    setSaving(false);
  };

  const toggleSectionVisibility = (name: string) => {
    setHiddenSections(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z + (e.deltaY > 0 ? -0.05 : 0.05))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { setIsDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  if (loading) return <div className="p-8 text-center">Loading layout editor...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/halls")}>← Back</Button>
          <div className="border-l pl-3">
            <h1 className="text-base font-semibold">{hallName}</h1>
            <p className="text-xs text-muted-foreground">{totalSeats} seats • {sections.length} sections</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-[#F84464] hover:bg-[#F84464]/90">
            <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Layout"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 bg-white border-r flex flex-col shrink-0 z-10">
          <div className="p-3 border-b">
            <h2 className="text-sm font-semibold">Hall Layout</h2>
            <p className="text-xs text-muted-foreground">Click seats on the map to block/unblock</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2.5 space-y-2">
              {sections.map((section) => {
                const isHidden = hiddenSections.has(section.sectionName);
                return (
                  <Card key={section.sectionName} className={cn("border transition", section.sectionName === activeSection && !isHidden && "border-primary ring-1 ring-primary/20", isHidden && "opacity-50")}>
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <button className="text-sm font-semibold text-left hover:text-primary" onClick={() => setActiveSection(section.sectionName)}>
                          {section.sectionName}
                        </button>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleSectionVisibility(section.sectionName)}>
                            {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteSection(section.sectionName)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Position Controls */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div>
                          <Label className="text-[9px] text-muted-foreground">X</Label>
                          <Input type="number" value={section.xStart} onChange={e => updateSectionProp(section.sectionName, "xStart", parseInt(e.target.value) || 0)} className="h-6 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-muted-foreground">Y</Label>
                          <Input type="number" value={section.yStart} onChange={e => updateSectionProp(section.sectionName, "yStart", parseInt(e.target.value) || 0)} className="h-6 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-muted-foreground">Angle</Label>
                          <Input type="number" value={section.angle} onChange={e => updateSectionProp(section.sectionName, "angle", parseInt(e.target.value) || 0)} className="h-6 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[9px] text-muted-foreground">Arc Radius</Label>
                          <Input type="number" value={section.arcRadius || ""} placeholder="None" onChange={e => updateSectionProp(section.sectionName, "arcRadius", e.target.value ? parseInt(e.target.value) : undefined)} className="h-6 text-xs" />
                        </div>
                      </div>

                      <Separator className="my-1.5" />

                      {/* Rows */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-muted-foreground">Rows ({section.rows.length})</span>
                          <Button size="sm" variant="outline" className="h-5 text-xs px-1.5" onClick={() => addRow(section.sectionName)}>
                            <Plus className="h-3 w-3 mr-0.5" /> Add
                          </Button>
                        </div>
                        {section.rows.map((row, rowIdx) => (
                          <div key={row.rowId} className="border rounded-md p-1.5 bg-muted/10">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="h-5 text-[10px] px-1.5 font-mono">{row.rowId}</Badge>
                              <Input type="number" value={row.seats} onChange={e => updateRowProp(section.sectionName, row.rowId, "seats", parseInt(e.target.value) || 0)} className="h-5 text-xs w-12" />
                              <Select value={row.zone} onValueChange={val => updateRowProp(section.sectionName, row.rowId, "zone", val)}>
                                <SelectTrigger className="h-5 text-xs w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="VIP">VIP</SelectItem>
                                  <SelectItem value="Premium">Premium</SelectItem>
                                  <SelectItem value="Standard">Standard</SelectItem>
                                  <SelectItem value="Balcony">Balcony</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex gap-0.5 ml-auto">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveRow(section.sectionName, row.rowId, "up")} disabled={rowIdx === 0}>
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveRow(section.sectionName, row.rowId, "down")} disabled={rowIdx === section.rows.length - 1}>
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteRow(section.sectionName, row.rowId)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Button variant="outline" className="w-full" onClick={addSection}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Section
              </Button>
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="p-2.5 border-t bg-muted/10">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(ZONE_STYLES) as SeatZone[]).map(zone => (
                <div key={zone} className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 rounded-sm", ZONE_STYLES[zone].bg)} />
                  <span className="text-[10px] text-muted-foreground">{zone}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gray-400" />
                <span className="text-[10px] text-muted-foreground">Blocked</span>
              </div>
            </div>
          </div>
        </div>

        {/* SVG Canvas */}
        <div
          className="flex-1 overflow-hidden bg-zinc-900 relative cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <svg
            viewBox={`${boundingBox.minX} ${boundingBox.minY} ${boundingBox.width} ${boundingBox.height}`}
            className="w-full h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 100ms ease-out" }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3f3f46" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x={boundingBox.minX - 500} y={boundingBox.minY - 500} width={boundingBox.width + 1000} height={boundingBox.height + 1000} fill="url(#grid)" />

            {/* Stage */}
            <g>
              <path d="M 250 520 L 550 520 L 510 470 L 290 470 Z" fill="#27272a" stroke="#52525b" strokeWidth="2" />
              <text x="400" y="505" textAnchor="middle" fill="#a1a1aa" fontSize="16" fontWeight="600">STAGE</text>
            </g>

            {/* Sections */}
            {sections.map((section) => {
              const isHidden = hiddenSections.has(section.sectionName);
              if (isHidden) return null;
              const isActive = section.sectionName === activeSection;

              return (
                <g key={section.sectionName} transform={section.angle ? `rotate(${section.angle}, ${section.xStart}, ${section.yStart})` : undefined} opacity={isActive ? 1 : 0.8}>
                  {/* Section Label */}
                  {!section.arcRadius && section.rows.length > 0 && (
                    <text x={section.xStart - 10} y={section.yStart - 12} textAnchor="end" fill="#71717a" fontSize="9" fontWeight="500">{section.sectionName}</text>
                  )}

                  {/* Rows */}
                  {section.rows.map((row, rowIdx) => {
                    const baseY = section.yStart + (rowIdx * (SEAT_H + ROW_GAP));

                    return (
                      <g key={row.rowId}>
                        {/* Row Label */}
                        <text
                          x={section.xStart - 20}
                          y={baseY + SEAT_H / 2 + 3}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="9"
                          fontWeight="600"
                        >
                          {row.rowId}
                        </text>

                        {/* Seats */}
                        {Array.from({ length: row.seats }).map((_, seatIdx) => {
                          const seatNum = seatIdx + 1;

                          const totalSeats = row.seats;
                          const centerIndex = (totalSeats - 1) / 2;

                          let seatX = section.xStart + (seatIdx * (SEAT_W + SEAT_GAP));
                          let seatY = baseY;

                          // 🔥 ARC CALCULATION
                          if (section.arcRadius) {
                            const angleSpread = 0.8;
                            const angleStep = angleSpread / totalSeats;
                            const angle = (seatIdx - centerIndex) * angleStep;

                            const radius = section.arcRadius + rowIdx * 22;

                            seatX = section.xStart + Math.sin(angle) * radius;
                            // seatY = section.yStart + Math.cos(angle) * radius;
                            seatY = baseY + Math.cos(angle) * 10;
                          }

                          const rotateDeg = (seatIdx - centerIndex) * 12;

                          const isBlocked = row.blocked.includes(seatNum);
                          const style = ZONE_STYLES[row.zone];

                          return (
                            <g
                              key={seatNum}
                              transform={section.arcRadius ? `rotate(${rotateDeg}, ${seatX}, ${seatY})` : ""}
                              onClick={() => toggleSeatBlocked(section.sectionName, row.rowId, seatNum)}
                              className="cursor-pointer"
                            >
                              <rect
                                x={seatX}
                                y={seatY}
                                width={SEAT_W}
                                height={SEAT_H}
                                rx="6"
                                fill={isBlocked ? "#52525b" : style.fill}
                                stroke={isBlocked ? "#71717a" : style.stroke}
                                strokeWidth="1.5"
                              />
                              <text
                                x={seatX + SEAT_W / 2}
                                y={seatY + SEAT_H / 2 + 3}
                                textAnchor="middle"
                                fill={isBlocked ? "#a1a1aa" : style.text}
                                fontSize="8"
                                fontWeight="700"
                              >
                                {seatNum}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-lg" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-lg" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-lg" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          </div>

          {/* Zoom Badge */}
          <div className="absolute bottom-4 left-4 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-md">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
