"use server";

import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function parseDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (typeof val === "number") {
    // Excel serial date number
    return XLSX.SSF.parse_date_code(val) as any;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function cleanStr(val: any): string {
  if (!val) return "";
  return String(val).trim();
}

export async function importMembersFromExcel(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file uploaded." };

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) {
      return { success: false, error: "Excel file is empty." };
    }

    const results = { total: rows.length, created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      try {
        const memberId = parseInt(cleanStr(row.memberId), 10);
        const name = cleanStr(row.name);
        const phone = cleanStr(row.phone);
        const email = cleanStr(row.email);

        if (!memberId || isNaN(memberId)) {
          results.errors.push(`Row ${rowNum}: Invalid or missing memberId`);
          continue;
        }
        if (!name) {
          results.errors.push(`Row ${rowNum}: Missing name`);
          continue;
        }
        if (!phone) {
          results.errors.push(`Row ${rowNum}: Missing phone`);
          continue;
        }

        // Check duplicate
        const existing = await prisma.member.findUnique({ where: { memberId } });
        if (existing) {
          results.skipped++;
          results.errors.push(`Row ${rowNum}: memberId ${memberId} already exists (skipped)`);
          continue;
        }

        await prisma.member.create({
          data: {
            memberId,
            applicationId: parseInt(cleanStr(row.applicationId), 10) || memberId,
            name,
            phone,
            email: email || `member${memberId}@ric.in`,
            categoryType: cleanStr(row.categoryType) || "General",
            categoryAcronym: cleanStr(row.categoryAcronym) || "GEN",
            doa: parseDate(row.doa) || new Date(),
            dob: parseDate(row.dob) || new Date("2000-01-01"),
            address: cleanStr(row.address) || "",
            emergencyContact: cleanStr(row.emergencyContact) || phone,
          },
        });

        results.created++;
      } catch (err: any) {
        results.errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return {
      success: true,
      ...results,
    };
  } catch (error: any) {
    console.error("Error importing members:", error);
    return { success: false, error: "Failed to import members: " + error.message };
  }
}
