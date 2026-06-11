import * as XLSX from "xlsx";

export async function GET() {
  const wb = XLSX.utils.book_new();

  const headers = [
    "memberId",
    "name",
    "phone",
    "email",
    "categoryType",
    "categoryAcronym",
    "doa",
    "dob",
    "address",
    "emergencyContact",
  ];

  const sampleData = [
    [1001, "Rahul Sharma", "9876543210", "rahul@example.com", 1001, "Life Member", "LM", "2024-01-15", "1990-05-20", "123, Park Street, Jaipur", "9822222222"],
    [1002, "Priya Singh", "9876543211", "priya@example.com", 1002, "Annual Member", "AM", "2024-02-10", "1992-08-15", "456, Mall Road, Jaipur", "9833333333"],
    [1003, "Amit Kumar", "9876543212", "amit@example.com", "", "Associate Member", "ASM", "2024-03-05", "1988-12-10", "789, MI Road, Jaipur", "9844444444"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  ws["!cols"] = [
    { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
    { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 30 }, { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Members");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ric-members-import-template.xlsx"`,
    },
  });
}
