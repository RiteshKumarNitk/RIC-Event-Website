"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CanvaslyExportButtonProps {
  elementId: string;
  filename: string;
  buttonText?: string;
  className?: string;
}

export function CanvaslyExportButton({ 
  elementId, 
  filename, 
  buttonText = "Export to PDF",
  className
}: CanvaslyExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({ variant: "destructive", title: "Error", description: "Export element not found." });
      return;
    }

    try {
      setIsExporting(true);
      
      // Capture the element using html2canvas (Canvasly engine)
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
      
      toast({ title: "Success", description: "Document exported successfully!" });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "There was an error generating the document." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting} 
      className={className}
      variant="outline"
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Generating..." : buttonText}
    </Button>
  );
}
