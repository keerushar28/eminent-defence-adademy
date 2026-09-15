import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ─────────────────────────────────────────────────────────

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  formatters?: Record<string, (value: unknown, row: Record<string, unknown>) => string | number>;
  summaryRow?: Record<string, string | number>;
}

// ── Excel Export ──────────────────────────────────────────────────

export async function exportToExcel(options: ExportOptions): Promise<void> {
  const {
    fileName,
    sheetName = "Sheet1",
    title,
    subtitle,
    columns,
    data,
    formatters = {},
    summaryRow,
  } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  let currentRow = 1;

  // Add title if provided
  if (title) {
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.height = 25;
    currentRow += 1;
  }

  // Add subtitle if provided
  if (subtitle) {
    const subtitleRow = worksheet.getRow(currentRow);
    subtitleRow.getCell(1).value = subtitle;
    subtitleRow.getCell(1).font = { size: 12, color: { argb: "FF666666" } };
    currentRow += 1;
  }

  // Add spacing
  if (title || subtitle) {
    currentRow += 1;
  }

  // Define columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  // Style header row
  const headerRow = worksheet.getRow(currentRow);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0E7C7B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 20;

  currentRow += 1;

  // Add data rows
  data.forEach((row) => {
    const formattedRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = row[col.key];
      const formatter = formatters[col.key];
      formattedRow[col.key] = formatter ? formatter(value, row) : value;
    });
    worksheet.addRow(formattedRow);
  });

  // Style data rows with alternating colors
  for (let i = currentRow; i < currentRow + data.length; i++) {
    const row = worksheet.getRow(i);
    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F8F7" },
      };
    }
    row.alignment = { vertical: "middle" };
    row.height = 18;
  }

  // Add summary row if provided
  if (summaryRow) {
    const summaryData: Record<string, unknown> = {};
    columns.forEach((col) => {
      summaryData[col.key] = summaryRow[col.key] ?? "";
    });
    const addedRow = worksheet.addRow(summaryData);
    addedRow.font = { bold: true, size: 10 };
    addedRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F5E9" },
    };
    addedRow.alignment = { vertical: "middle" };
    addedRow.height = 20;
  }

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= currentRow - 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8E6" } },
          left: { style: "thin", color: { argb: "FFE2E8E6" } },
          bottom: { style: "thin", color: { argb: "FFE2E8E6" } },
          right: { style: "thin", color: { argb: "FFE2E8E6" } },
        };
      });
    }
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

// ── PDF Export ────────────────────────────────────────────────────

export async function exportToPDF(options: ExportOptions): Promise<void> {
  const {
    fileName,
    title,
    subtitle,
    columns,
    data,
    formatters = {},
    summaryRow,
  } = options;

  const doc = new jsPDF({
    orientation: columns.length > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPos = 20;

  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, yPos);
    yPos += 8;
  }

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, yPos);
    yPos += 10;
  }

  // Prepare table data
  const headers = columns.map((col) => col.header);
  const body = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      const formatter = formatters[col.key];
      return formatter ? String(formatter(value, row)) : String(value ?? "");
    })
  );

  // Add summary row if provided
  if (summaryRow) {
    const summaryCells = columns.map((col) => {
      const value = summaryRow[col.key];
      return value !== undefined ? String(value) : "";
    });
    body.push(summaryCells);
  }

  // Add table
  autoTable(doc, {
    head: [headers],
    body: body,
    startY: yPos,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      halign: "left",
    },
    headStyles: {
      fillColor: [14, 124, 123],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [242, 248, 247],
    },
    margin: { top: 20, right: 14, bottom: 20, left: 14 },
    ...(summaryRow && {
      didParseCell: (hookData) => {
        const isLastRow = hookData.row.index === body.length - 1;
        if (isLastRow) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [232, 245, 233];
        }
      },
    }),
  });

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const pageText = `Page ${i} of ${pageCount}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - textWidth - 14, doc.internal.pageSize.getHeight() - 10);
  }

  // Save PDF
  doc.save(`${fileName}.pdf`);
}
