"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFeeConfig, upsertFeeConfig } from "@/app/actions/fee-actions";
import { Loader2, Save, ReceiptText, Percent, Banknote } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminFeesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gstPercentage, setGstPercentage] = useState("18");
  const [platformFeeType, setPlatformFeeType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [platformFeeValue, setPlatformFeeValue] = useState("2.5");

  useEffect(() => {
    const fetch = async () => {
      const res = await getFeeConfig();
      if (res.success && res.config) {
        setGstPercentage(String(res.config.gstPercentage ?? 18));
        setPlatformFeeType((res.config.platformFeeType as "PERCENTAGE" | "FLAT") || "PERCENTAGE");
        setPlatformFeeValue(String(res.config.platformFeeValue ?? 2.5));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await upsertFeeConfig({
      gstPercentage: parseFloat(gstPercentage) || 0,
      platformFeeType,
      platformFeeValue: parseFloat(platformFeeValue) || 0,
    });
    if (res.success) {
      toast({ title: "Saved", description: "Fee configuration updated." });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error || "Failed to save." });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const previewSubtotal = 1000;
  const gstAmt = Math.round((parseFloat(gstPercentage) || 0) / 100 * previewSubtotal * 100) / 100;
  const feeAmt = platformFeeType === "PERCENTAGE"
    ? Math.round((parseFloat(platformFeeValue) || 0) / 100 * previewSubtotal * 100) / 100
    : (parseFloat(platformFeeValue) || 0);
  const previewTotal = previewSubtotal + gstAmt + feeAmt;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ReceiptText className="h-6 w-6" /> Fees & Taxes
        </h1>
        <p className="text-muted-foreground">Configure GST and platform fees applied at checkout.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Configuration</CardTitle>
          <CardDescription>These fees are added on top of the ticket subtotal during checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-muted-foreground" /> GST Percentage
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                className="max-w-[200px]"
                placeholder="e.g. 18"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Applied as a percentage of the ticket subtotal.</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-muted-foreground" /> Platform Fee
            </Label>
            <div className="flex items-center gap-3">
              <Select
                value={platformFeeType}
                onValueChange={(v) => setPlatformFeeType(v as "PERCENTAGE" | "FLAT")}
              >
                <SelectTrigger className="max-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FLAT">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={platformFeeValue}
                onChange={(e) => setPlatformFeeValue(e.target.value)}
                className="max-w-[150px]"
                placeholder={platformFeeType === "PERCENTAGE" ? "e.g. 2.5" : "e.g. 50"}
              />
              <span className="text-sm text-muted-foreground">
                {platformFeeType === "PERCENTAGE" ? "%" : "₹"}
              </span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>How fees apply on a ₹{previewSubtotal.toLocaleString("en-IN")} ticket subtotal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Ticket Subtotal</span><span>₹{previewSubtotal.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>GST ({gstPercentage}%)</span><span>+₹{gstAmt.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Platform Fee{platformFeeType === "PERCENTAGE" ? ` (${platformFeeValue}%)` : ""}</span><span>+₹{feeAmt.toLocaleString("en-IN")}</span></div>
          <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span>₹{previewTotal.toLocaleString("en-IN")}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
