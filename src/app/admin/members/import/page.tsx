"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { importMembersFromExcel } from "@/app/actions/member-import-actions";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ImportMembersPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
        toast({ variant: "destructive", title: "Invalid file", description: "Please upload an .xlsx file." });
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await importMembersFromExcel(fd);
    if (res.success) {
      setResult(res as any);
      toast({ title: "Import Complete", description: `${res.created} members created.` });
    } else {
      toast({ variant: "destructive", title: "Import Failed", description: res.error });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/members"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Members</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" /> Bulk Import Members
        </h1>
        <p className="text-muted-foreground">Upload an Excel file to create multiple member records at once.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Download Template</CardTitle>
          <CardDescription>Fill in your member data following the template format.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/api/templates/members-import">
              <Download className="h-4 w-4" /> Download Excel Template
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2: Upload & Import</CardTitle>
          <CardDescription>Select the completed Excel file and import.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="space-y-1">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-green-600" />
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="font-medium">Click to select Excel file</p>
                <p className="text-xs text-muted-foreground">.xlsx format</p>
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? "Importing..." : "Import Members"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-600 gap-1">
                <CheckCircle2 className="h-3 w-3" /> {result.created} Created
              </Badge>
              {result.skipped > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {result.skipped} Skipped
                </Badge>
              )}
              <Badge variant="outline">{result.total} Total Rows</Badge>
            </div>
            {result.errors.length > 0 && (
              <>
                <Separator />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Details ({result.errors.length}):</p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" /> {err}
                    </p>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
