/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/export-util.ts
import { Workbook } from "exceljs";

export interface ColumnDef {
  field: string;
  title: string;
}

export async function exportToExcelBuffer(
  data: any[],
  columns: ColumnDef[],
  sheetName = "Report"
): Promise<Buffer> {
  if (!data.length) {
    throw new Error("No data provided for Excel export.");
  }

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // Define columns with keys so we can style them
  sheet.columns = columns.map((col) => ({
    header: col.title,
    key: col.field,
    width: 25,
  }));

  // Add rows (data keys must match column.field)
  data.forEach((row) => {
    sheet.addRow(row);
  });

  // Force phone column to TEXT if it exists
  const phoneColIndex = columns.findIndex((c) => c.field === "phone") + 1; // 1-based

  if (phoneColIndex > 0) {
    const col = sheet.getColumn(phoneColIndex);
    col.numFmt = "@"; // text format

    // Also coerce all phone values to string to be extra safe
    col.eachCell((cell, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      if (cell.value == null) return;
      cell.value = String(cell.value);
    });
  }

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}

export function exportToCSVBuffer(data: any[], columns: ColumnDef[]): Buffer {
  if (!data.length) {
    throw new Error("No data provided for CSV export.");
  }

  const csvHeader = columns.map((col) => `"${col.title}"`).join(",") + "\n";

  const csvRows = data.map((row) =>
    columns
      .map((col) => {
        const cell = row[col.field] ?? "";
        let str = String(cell);

        // Force phone column to be treated as text by Excel
        if (col.field === "phone" && str !== "") {
          // Example: 080..., +234..., +44...
          str = `="${str}"`;
        }

        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = csvHeader + csvRows.join("\n");
  return Buffer.from(csvContent, "utf8");
}
