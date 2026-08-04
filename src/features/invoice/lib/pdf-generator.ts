import type { StudentInvoiceData, InvoiceOptions } from "../types/invoice"
import { convertAdToBs } from "@/features/core/utils/convertAdToBs"

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "—"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (!dateObj || isNaN(dateObj.getTime())) return "—"
    return convertAdToBs(dateObj)
  } catch {
    return "—"
  }
}

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function formatNpr(amount: number): string {
  return `NPR ${amount.toFixed(0)}`
}

function section(title: string, bodyHtml: string): string {
  return `<div class="section"><div class="section-label">${esc(title)}</div>${bodyHtml}</div>`
}

function amountRow(label: string, value: number, rowClass = ""): string {
  return `<tr class="${rowClass}">
    <td>${esc(label)}</td>
    <td class="right">${formatNpr(value)}</td>
  </tr>`
}

const HALF_A4_WIDTH = "210mm"
const HALF_A4_HEIGHT = "148.5mm"

function getInvoiceStyles(): string {
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 7px;
    line-height: 1.3;
  }
  .half-page-sheet {
    width: ${HALF_A4_WIDTH};
    height: ${HALF_A4_HEIGHT};
    max-height: ${HALF_A4_HEIGHT};
    margin: 0 auto;
    overflow: hidden;
    position: relative;
  }
  .page {
    width: 100%;
    height: 100%;
    max-height: ${HALF_A4_HEIGHT};
    padding: 6px 10px 8px;
    overflow: hidden;
  }
  .tear-line {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    border-bottom: 1px dashed #bbb;
    pointer-events: none;
  }
  .masthead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
    margin-bottom: 6px;
  }
  .masthead-left { flex: 1; min-width: 0; }
  .masthead-title {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  .masthead-sub {
    font-size: 6.5px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 1px;
  }
  .masthead-meta {
    width: 84px;
    flex-shrink: 0;
    border: 1px solid #dcdcdc;
    background: #fafafa;
    padding: 4px 5px;
    text-align: left;
    font-size: 6px;
    color: #666;
  }
  .meta-row { margin-bottom: 3px; }
  .meta-row:last-child { margin-bottom: 0; }
  .meta-label {
    display: block;
    font-size: 5.5px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1px;
  }
  .meta-value {
    display: block;
    color: #111;
    font-weight: 700;
    line-height: 1.25;
    word-break: break-word;
  }
  .student-line {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 6.5px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e5e5e5;
  }
  .student-line b { color: #333; }
  .student-name {
    font-size: 7.5px;
    font-weight: 700;
    color: #111;
  }
  .student-chip {
    border: 1px solid #dcdcdc;
    background: #fafafa;
    padding: 1px 4px;
    color: #555;
    white-space: nowrap;
  }
  .section { margin-bottom: 5px; }
  .section-label {
    font-size: 6.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #444;
    border-bottom: 1px solid #ccc;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }
  .block {
    border: 1px solid #e5e5e5;
    margin-bottom: 4px;
    padding: 3px 4px;
  }
  .block:last-child { margin-bottom: 0; }
  .block-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }
  .block-title { font-size: 7px; font-weight: 700; color: #111; }
  .block-meta { font-size: 6px; color: #888; margin-bottom: 2px; }
  .tag {
    font-size: 5.5px;
    padding: 1px 4px;
    border: 1px solid #ccc;
    color: #555;
    text-transform: uppercase;
  }
  .tag.inactive { color: #999; border-color: #ddd; }
  .amt-table {
    width: 100%;
    border-collapse: collapse;
  }
  .amt-table td {
    border: 1px solid #ececec;
    padding: 1.5px 3px;
    font-size: 6.5px;
  }
  .amt-table td:first-child { color: #555; }
  .right { text-align: right; }
  .pending td:last-child { color: #b45309; font-weight: 700; }
  .paid td:last-child { color: #059669; font-weight: 600; }
  .no-pay { font-size: 6px; color: #999; font-style: italic; padding: 2px 0; }
  .muted { color: #999; }
  .summary {
    margin-top: 4px;
    border-top: 1.5px solid #111;
    padding-top: 3px;
  }
  .summary table { width: 100%; border-collapse: collapse; }
  .summary td {
    padding: 1.5px 2px;
    font-size: 7px;
  }
  .summary td:last-child { text-align: right; font-weight: 700; }
  .summary .pending-row td { color: #b45309; }
  .footer {
    border-top: 1px solid #e5e5e5;
    padding-top: 3px;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 6px;
    color: #999;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .half-page-sheet, .page { overflow: hidden; max-height: ${HALF_A4_HEIGHT}; }
  }
  `
}

function getPrintPageStyles(): string {
  return `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body {
      width: ${HALF_A4_WIDTH};
      height: ${HALF_A4_HEIGHT};
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    .half-page-sheet {
      position: fixed;
      top: 0; left: 0;
      width: ${HALF_A4_WIDTH};
      height: ${HALF_A4_HEIGHT};
      max-height: ${HALF_A4_HEIGHT};
      overflow: hidden;
    }
  }
  `
}

function buildInvoicePageContent(
  invoiceData: StudentInvoiceData,
  options: InvoiceOptions,
  generatedByUser: string | undefined,
): string {
  const invoiceNo = `INV-${invoiceData.studentId.slice(-6).toUpperCase()}`
  const generatedOn = formatDate(new Date())
  const studentRef = invoiceData.studentId.slice(-8).toUpperCase()

  const categoryHTML =
    options.includeCategoryPayments && invoiceData.categoryPayments.length > 0
      ? section(
          "Category Fees",
          invoiceData.categoryPayments
            .map((cat) => {
              const statusTag = cat.isActive
                ? `<span class="tag">Active</span>`
                : `<span class="tag inactive">Inactive</span>`

              return `<div class="block">
                <div class="block-head">
                  <span class="block-title">${esc(cat.categoryName)} › ${esc(cat.subCategoryName)}</span>
                  ${statusTag}
                </div>
                <div class="block-meta">Assigned: ${formatDate(cat.assignedDate)}</div>
                <table class="amt-table">
                  ${cat.discount > 0 ? amountRow("Fee Amount", cat.fee) : ""}
                  ${cat.discount > 0 ? amountRow("Discount", cat.discount) : ""}
                  ${amountRow("Final Fee", cat.finalFee)}
                  ${amountRow("Total Paid", cat.totalPaid, "paid")}
                  ${amountRow("Pending", cat.pendingFees, "pending")}
                </table>
              </div>`
            })
            .join(""),
        )
      : ""

  const inventoryHTML =
    options.includeInventoryIssuances && invoiceData.inventoryIssuances.length > 0
      ? section(
          "Inventory",
          invoiceData.inventoryIssuances
            .map(
              (item) => `<div class="block">
                <div class="block-title">${esc(item.itemName)} × ${item.quantity} @ ${formatNpr(item.unitPrice)}</div>
                <div class="block-meta">Issued: ${formatDate(item.issuedDate)}</div>
                <table class="amt-table">
                  ${amountRow("Total Amount", item.totalAmount)}
                  ${amountRow("Total Paid", item.totalPaid, "paid")}
                  ${amountRow("Pending", item.balanceDue, "pending")}
                </table>
              </div>`,
            )
            .join(""),
        )
      : ""

  const hostelHTML =
    (options.includeHostelPayments || options.includeAllocationsInfo) &&
    invoiceData.hostelPayments.length > 0
      ? section(
          "Hostel",
          invoiceData.hostelPayments
            .map((hostel) => {
              const statusTag = hostel.isActive
                ? `<span class="tag">Active</span>`
                : `<span class="tag inactive">Inactive</span>`

              return `<div class="block">
                <div class="block-head">
                  <span class="block-title">Room ${esc(hostel.roomNumber)} / Bed ${esc(hostel.bedNumber)}</span>
                  ${statusTag}
                </div>
                <div class="block-meta">
                  Allocated: ${formatDate(hostel.allocationDate)} · Paid until: ${formatDate(hostel.paidUntil)} · Rate: ${formatNpr(hostel.pricePerDay)}/day
                </div>
                <table class="amt-table">
                  ${amountRow("Total Paid", hostel.totalPaid, "paid")}
                  ${amountRow("Pending", hostel.pending, "pending")}
                  ${hostel.credit > 0 ? amountRow("Credit", hostel.credit) : ""}
                </table>
              </div>`
            })
            .join(""),
        )
      : ""

  const { totals } = invoiceData
  const summaryHTML =
    totals.grandTotalPaid > 0 || totals.grandTotalPending > 0
      ? `<div class="summary">
          <table>
            ${totals.categoryTotalPaid > 0 ? `<tr><td>Category Paid</td><td>${formatNpr(totals.categoryTotalPaid)}</td></tr>` : ""}
            ${totals.categoryPending > 0 ? `<tr class="pending-row"><td>Category Pending</td><td>${formatNpr(totals.categoryPending)}</td></tr>` : ""}
            ${totals.issuanceTotalPaid > 0 ? `<tr><td>Inventory Paid</td><td>${formatNpr(totals.issuanceTotalPaid)}</td></tr>` : ""}
            ${totals.issuancePending > 0 ? `<tr class="pending-row"><td>Inventory Pending</td><td>${formatNpr(totals.issuancePending)}</td></tr>` : ""}
            ${totals.hostelTotalPaid > 0 ? `<tr><td>Hostel Paid</td><td>${formatNpr(totals.hostelTotalPaid)}</td></tr>` : ""}
            ${totals.hostelPending > 0 ? `<tr class="pending-row"><td>Hostel Pending</td><td>${formatNpr(totals.hostelPending)}</td></tr>` : ""}
            <tr><td><b>Total Paid</b></td><td><b>${formatNpr(totals.grandTotalPaid)}</b></td></tr>
            <tr class="pending-row"><td><b>Total Pending</b></td><td><b>${formatNpr(totals.grandTotalPending)}</b></td></tr>
          </table>
        </div>`
      : ""

  return `<div class="half-page-sheet">
  <div class="page">
    <div class="masthead">
      <div class="masthead-left">
        <div class="masthead-title">Eminent Defence Academy</div>
        <div class="masthead-sub">Official Payment Invoice</div>
      </div>
      <div class="masthead-meta">
        <div class="meta-row">
          <span class="meta-label">Invoice No.</span>
          <span class="meta-value">${esc(invoiceNo)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Generated On</span>
          <span class="meta-value">${generatedOn}</span>
        </div>
      </div>
    </div>

    <div class="student-line">
      <span class="student-name">${esc(invoiceData.studentName)}</span>
      <span class="student-chip">Student Ref: ${esc(studentRef)}</span>
      <span class="student-chip">Phone: ${esc(invoiceData.contactNumber)}</span>
      <span class="student-chip">By: ${esc(generatedByUser || "System")}</span>
    </div>

    ${categoryHTML}
    ${inventoryHTML}
    ${hostelHTML}
    ${summaryHTML}

    <div class="footer">
      <span>${esc(invoiceData.studentName)}</span>
      <span>${generatedOn}</span>
    </div>
  </div>
  <div class="tear-line" aria-hidden="true"></div>
</div>`
}

export function generateInvoicePDF(
  invoiceData: StudentInvoiceData,
  options: InvoiceOptions,
  generatedByUser: string | undefined,
): string {
  return `<style>${getInvoiceStyles()}</style>${buildInvoicePageContent(invoiceData, options, generatedByUser)}`
}

export function generateInvoiceHTMLDocument(
  invoiceData: StudentInvoiceData,
  options: InvoiceOptions,
  generatedByUser: string | undefined,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${esc(invoiceData.studentName)}</title>
  <style>${getPrintPageStyles()}${getInvoiceStyles()}</style>
</head>
<body>${buildInvoicePageContent(invoiceData, options, generatedByUser)}</body>
</html>`
}

export function printInvoice(
  invoiceData: StudentInvoiceData,
  options: InvoiceOptions,
  generatedByUser: string | undefined,
): void {
  const html = generateInvoiceHTMLDocument(invoiceData, options, generatedByUser)
  const win = window.open("", "_blank", "width=640,height=800")
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}
