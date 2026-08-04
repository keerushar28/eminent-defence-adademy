import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";

export interface SubCategory {
  name: string;
  amount: number;
}

export interface CategoryTreeItem {
  name: string;
  amount: number;
  subCategories: SubCategory[];
}

export interface OverallSummaryData {
  categoryBreakdown: { name: string; amount: number }[];
  categoryHierarchy: CategoryTreeItem[];
  expenditureBreakdown: { name: string; amount: number }[];
  hostelByCategory: { name: string; amount: number }[];
  hostelHierarchy: CategoryTreeItem[];
  totals: {
    totalCategoryReceive: number;
    totalExpenditure: number;
    totalHostelReceive: number;
    totalIssuancePayments: number;
    totalReceive: number;
    remainingBalance: number;
  };
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function row(
  num: string,
  label: string,
  amount: string,
  opts: { bold?: boolean; total?: boolean; indent?: boolean } = {}
): string {
  const { bold = false, total = false, indent = false } = opts;

  const trStyle = total ? "background:#f9f9f9;" : "";
  const tdBase = "padding:2px 6px;border-bottom:1px solid #eee;font-size:9.5px;line-height:1.4;";

  const numStyle = `${tdBase}text-align:left;width:28px;color:#666;`;
  const labelStyle = `${tdBase}text-align:left;${bold ? "font-weight:600;color:#000;" : "color:#222;"}${indent ? "padding-left:20px;color:#333;font-weight:400;" : ""}`;
  const amountStyle = `${tdBase}text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;${bold ? "font-weight:600;color:#000;" : "color:#222;"}`;

  const labelContent = indent ? `<span style="color:#999;margin-right:3px;">└</span>${label}` : label;

  return `<tr style="${trStyle}">
      <td style="${numStyle}">${num}</td>
      <td style="${labelStyle}">${labelContent}</td>
      <td style="${amountStyle}">${amount}</td>
    </tr>`;
}

function sectionHeader(title: string, num: string): string {
  return `<tr style="background:#f5f5f5;">
      <th colspan="3" style="padding:4px 6px;font-size:9px;font-weight:700;color:#333;text-align:left;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid #ddd;">
        <span style="color:#666;margin-right:5px;font-size:8.5px;">${num}.</span>${title}
      </th>
    </tr>
    <tr style="background:#fafafa;">
      <th style="padding:2px 6px;border-bottom:1px solid #ddd;text-align:left;font-size:8.5px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:28px;">#</th>
      <th style="padding:2px 6px;border-bottom:1px solid #ddd;text-align:left;font-size:8.5px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Particulars</th>
      <th style="padding:2px 6px;border-bottom:1px solid #ddd;text-align:right;font-size:8.5px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Amount</th>
    </tr>`;
}

export function buildPrintHTML(
  data: OverallSummaryData,
  printDateLabel: string,
  printedOn: string
): string {
  // Section 1: Receive
  let receiveRows = "";
  let idx = 1;
  data.categoryHierarchy.forEach((cat) => {
    receiveRows += row(String(idx), cat.name, formatAmount(cat.amount), { bold: true });
    cat.subCategories.forEach((sub, si) => {
      receiveRows += row(`${idx}.${si + 1}`, sub.name, formatAmount(sub.amount), { indent: true });
    });
    idx++;
  });
  if (data.totals.totalIssuancePayments > 0) {
    receiveRows += row(String(idx), "Receive from Inventory Issuances", formatAmount(data.totals.totalIssuancePayments));
  }
  receiveRows += row("", "Total Category Payment Receive", formatAmount(data.totals.totalCategoryReceive), { bold: true, total: true });

  // Section 2: Expenditure
  let expRows = "";
  data.expenditureBreakdown.forEach((item, i) => {
    expRows += row(String(i + 1), `Expenditure from ${item.name}`, formatAmount(item.amount));
  });
  expRows += row("", "Total Expenditure", formatAmount(data.totals.totalExpenditure), { bold: true, total: true });

  // Section 3: Hostel
  let hostelRows = "";
  let hidx = 1;
  data.hostelHierarchy.forEach((cat) => {
    hostelRows += row(String(hidx), cat.name, formatAmount(cat.amount), { bold: true });
    cat.subCategories.forEach((sub, si) => {
      hostelRows += row(`${hidx}.${si + 1}`, sub.name, formatAmount(sub.amount), { indent: true });
    });
    hidx++;
  });
  hostelRows += row("", "Total Hostel Receive", formatAmount(data.totals.totalHostelReceive), { bold: true, total: true });

  const isProfit = data.totals.remainingBalance >= 0;
  const balanceColor = isProfit ? "#1a5c35" : "#7f1d1d";
  const balanceLabel = isProfit ? "Profit" : "Loss";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Overall Financial Summary</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      color: #222;
      background: #fff;
      font-size: 9.5px;
      line-height: 1.3;
    }
    .page { padding: 18px 24px; max-width: 100%; margin: 0; }
    .header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      border-bottom: 1px solid #999;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .header-left .org-name { font-size: 13px; font-weight: 700; color: #000; letter-spacing: 0.02em; }
    .header-left .doc-title { font-size: 8.5px; color: #888; margin-top: 1px; }
    .header-right { text-align: right; font-size: 8px; color: #666; line-height: 1.5; }
    .header-right .period { font-weight: 600; color: #333; font-size: 8.5px; }
    .section-box { border: 1px solid #ddd; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    .overall-table { border: 1px solid #ccc; margin-bottom: 8px; }
    .overall-table td {
      padding: 2px 6px;
      font-size: 9.5px;
      border-bottom: 1px solid #eee;
      color: #222;
      line-height: 1.4;
    }
    .overall-table td:first-child { text-align: left; }
    .overall-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
    .balance-row td {
      font-weight: 700;
      font-size: 10px;
      color: ${balanceColor};
      background: #fafafa;
      border-top: 1px solid #ccc;
      padding: 3px 6px;
    }
    .footer {
      border-top: 1px solid #e5e5e5;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      color: #999;
      margin-top: 6px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 12px 18px; }
      .header { margin-bottom: 8px; padding-bottom: 4px; }
      .section-box { margin-bottom: 6px; }
      .overall-table { margin-bottom: 6px; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="org-name">Financial Summary Report</div>
      <div class="doc-title">Overall Summary — Income &amp; Expenditure</div>
    </div>
    <div class="header-right">
      <div>Period: <span class="period">${printDateLabel}</span></div>
      <div>Printed: ${printedOn}</div>
    </div>
  </div>

  <div class="section-box">
    <table>
      <thead>${sectionHeader("Summary of Receive", "1")}</thead>
      <tbody>${receiveRows}</tbody>
    </table>
  </div>

  ${data.expenditureBreakdown.length > 0 ? `
  <div class="section-box">
    <table>
      <thead>${sectionHeader("Summary of Expenditure", "2")}</thead>
      <tbody>${expRows}</tbody>
    </table>
  </div>` : ""}

  ${data.hostelHierarchy.length > 0 ? `
  <div class="section-box">
    <table>
      <thead>${sectionHeader("Summary of Hostel Receive", "3")}</thead>
      <tbody>${hostelRows}</tbody>
    </table>
  </div>` : ""}

  <table class="overall-table">
    <thead>
      <tr style="background:#f5f5f5;">
        <th colspan="2" style="padding:4px 6px;font-size:9px;font-weight:700;color:#555;text-align:left;letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid #ddd;">Overall Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Receive</td>
        <td>${formatAmount(data.totals.totalReceive)}</td>
      </tr>
      <tr>
        <td>Total Expenditure</td>
        <td>${formatAmount(data.totals.totalExpenditure)}</td>
      </tr>
      <tr class="balance-row">
        <td>Remaining Balance
          <span style="font-size:7.5px;font-weight:600;margin-left:5px;padding:1px 4px;border:1px solid ${balanceColor};color:${balanceColor};border-radius:2px;vertical-align:middle;">${balanceLabel}</span>
        </td>
        <td>${formatAmount(data.totals.remainingBalance)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <span>Overall Financial Summary Report</span>
    <span>Printed: ${printedOn}</span>
  </div>

</div>
</body>
</html>`;
}

export function printOverallSummary(data: OverallSummaryData, printDateLabel: string): void {
  const printedOn = formatNepaliDateFromDate(new Date());
  const html = buildPrintHTML(data, printDateLabel, printedOn);
  const win = window.open("", "_blank", "width=960,height=800");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
