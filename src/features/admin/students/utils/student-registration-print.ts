import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { IStudent } from "../types/types";

function formatBloodGroup(bloodGroup: string): string {
  return bloodGroup.replace("_", " ");
}

function formatGender(gender: string): string {
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatNepaliDateFromDate(dateObj);
}

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Two-up label/value cell pair — keeps rows dense without crowding */
function field(label: string, value: string | number | null | undefined): string {
  return `<td class="f-label">${esc(label)}</td><td class="f-value">${esc(value)}</td>`;
}

function fieldRow(...cells: string[]): string {
  return `<tr>${cells.join("")}</tr>`;
}

/** Full-width row for a single field, e.g. an address or a conditional line */
function fieldRowSingle(label: string, value: string | number | null | undefined): string {
  return `<tr><td class="f-label">${esc(label)}</td><td class="f-value" colspan="3">${esc(value)}</td></tr>`;
}

function pill(text: string): string {
  return `<span class="pill">${esc(text)}</span>`;
}

/** A section = quiet uppercase label + hairline rule + content. No fills, no color blocks. */
function section(title: string, bodyHtml: string, extraClass = ""): string {
  return `<div class="section ${extraClass}">
    <div class="section-label">${esc(title)}</div>
    ${bodyHtml}
  </div>`;
}

export function buildStudentRegistrationPrintHTML(student: IStudent): string {
  const printedOn = formatNepaliDateFromDate(new Date());

  const categoriesHTML =
    student.studentCategories && student.studentCategories.length > 0
      ? student.studentCategories
          .map((sc) => pill(`${sc.subCategory?.category?.name ?? ""} — ${sc.subCategory?.name ?? ""}`))
          .join("")
      : `<span class="muted">No categories assigned</span>`;

  const activeAllocations = (student.hostelAllocations || []).filter((a) => a.isActive);
  const hostelHTML =
    activeAllocations.length > 0
      ? `<table class="mini-table">
          <thead>
            <tr><th>Room</th><th>Bed</th><th>Allocated</th></tr>
          </thead>
          <tbody>
            ${activeAllocations
              .map(
                (alloc) => `<tr>
                  <td>${esc(alloc.bed?.room?.roomNumber)}</td>
                  <td>${esc(alloc.bed?.bedNumber)}</td>
                  <td>${formatDate(alloc.allocationDate)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : `<span class="muted">No active hostel allocation</span>`;

  const qualificationsHTML =
    student.qualifications && student.qualifications.length > 0
      ? student.qualifications.map((q) => pill(q)).join("")
      : `<span class="muted">No qualifications listed</span>`;

  const imageHTML = student.student_image
    ? `<img src="/api/images${student.student_image}" alt="${esc(student.fullname)}" class="photo" onerror="this.src='/uploads/default.jpg'" />`
    : `<div class="photo photo-placeholder">No Photo</div>`;

  const attachmentsHTML =
    student.images && student.images.length > 0
      ? student.images
          .map((img) => `<img src="/api/images${img}" alt="attachment" class="thumb" />`)
          .join("")
      : `<span class="muted">No attachments</span>`;

  const facilities = [
    student.dress ? "Dress" : null,
    student.books ? "Books" : null,
    student.hostel ? "Hostel" : null,
  ].filter(Boolean) as string[];

  const personalRows =
    fieldRow(field("Gender", formatGender(student.gender)), field("Date of Birth", formatDate(student.dob))) +
    fieldRow(field("Blood Group", formatBloodGroup(student.blood_group)), field("Citizenship No.", student.citizenship_number)) +
    fieldRow(
      field("Height", student.height ? `${student.height} ${student.heightUnit || "cm"}` : null),
      field("Weight", student.weight ? `${student.weight} ${student.weightUnit || "kg"}` : null)
    ) +
    fieldRow(field("Email", student.email), field("Registration Date", formatDate(student.createdAt))) +
    (student.isSelected && student.selectedAt ? fieldRowSingle("Selected On", formatDate(student.selectedAt)) : "");

  const contactRows =
    fieldRow(field("Student's Phone", student.contact_number_student), field("Parent's Phone", student.contact_number_parent)) +
    fieldRowSingle("Permanent Address", student.permanent_address) +
    fieldRowSingle("Temporary Address", student.temporary_address);

  const familyRows = fieldRow(field("Parent Name", student.parentName), field("Guardian Name", student.guardianName));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Student Registration — ${esc(student.fullname)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 9px;
    line-height: 1.5;
  }

  .page { max-width: 100%; padding: 18px 22px; }

  /* ---------- Masthead ---------- */
  .masthead {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;
    margin-bottom: 18px;
  }
  .masthead-title {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 15px;
    font-weight: 700;
  }
  .masthead-sub {
    font-size: 8.5px;
    color: #666;
    margin-top: 2px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .masthead-meta {
    text-align: right;
    font-size: 8px;
    color: #666;
    line-height: 1.7;
  }
  .masthead-meta b { color: #1a1a1a; font-weight: 600; }

  /* ---------- Identity strip ---------- */
  .identity {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
  }
  .photo {
    width: 58px;
    height: 58px;
    object-fit: cover;
    border: 1px solid #ccc;
    flex-shrink: 0;
  }
  .photo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 7px;
    text-align: center;
  }
  .identity-main { flex: 1; }
  .identity-name {
    font-size: 13px;
    font-weight: 700;
  }
  .identity-id {
    font-size: 8px;
    color: #777;
    font-family: 'Consolas', monospace;
    margin-top: 1px;
  }
  .identity-tags { margin-top: 6px; display: flex; gap: 5px; flex-wrap: wrap; }
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border: 1px solid #ccc;
    font-size: 7.5px;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .tag.selected { border-color: #1a1a1a; color: #1a1a1a; font-weight: 700; }

  /* ---------- Section wrapper: quiet label + hairline rule ---------- */
  .section { margin-bottom: 18px; }
  .section:last-child { margin-bottom: 0; }
  .section-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #444;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
    margin-bottom: 7px;
  }

  /* ---------- Field grid (personal / contact / family) ---------- */
  .field-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #ddd;
  }
  .field-table td {
    border: 1px solid #e5e5e5;
    padding: 4.5px 8px;
    vertical-align: top;
  }
  .f-label {
    width: 15%;
    font-weight: 600;
    color: #555;
    white-space: nowrap;
  }
  .f-value {
    width: 35%;
    color: #111;
  }

  .pill {
    display: inline-block;
    margin: 2px 4px 2px 0;
    padding: 2.5px 8px;
    border: 1px solid #ccc;
    font-size: 8px;
    color: #222;
  }
  .muted { color: #999; font-style: italic; font-size: 8px; }

  .mini-table { width: 100%; border-collapse: collapse; }
  .mini-table th, .mini-table td {
    border: 1px solid #e5e5e5;
    padding: 4px 8px;
    text-align: left;
    font-size: 8px;
  }
  .mini-table th { font-weight: 600; color: #555; }

  .thumb {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border: 1px solid #ddd;
    margin: 2px;
  }

  /* ---------- Two-column layout for compact side-by-side sections ---------- */
  .cols-2 { display: flex; gap: 22px; margin-bottom: 18px; }
  .cols-2 > .section { flex: 1; margin-bottom: 0; }

  /* ---------- Footer ---------- */
  .footer {
    border-top: 1px solid #e5e5e5;
    padding-top: 6px;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5px;
    color: #999;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 10px 14px; }
    .section, .field-table, .mini-table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="masthead">
    <div>
      <div class="masthead-title">Student Registration Record</div>
      <div class="masthead-sub">Official Registration Document</div>
    </div>
    <div class="masthead-meta">
      <div><b>Printed:</b> ${printedOn}</div>
      <div><b>Ref ID:</b> ${esc(student.id).slice(0, 8)}</div>
    </div>
  </div>

  <div class="identity">
    ${imageHTML}
    <div class="identity-main">
      <div class="identity-name">${esc(student.fullname)}</div>
      <div class="identity-id">ID: ${esc(student.id)}</div>
      <div class="identity-tags">
        ${student.isSelected ? `<span class="tag selected">Selected</span>` : `<span class="tag">Not Selected</span>`}
        ${facilities.map((f) => `<span class="tag">${f}</span>`).join("")}
      </div>
    </div>
  </div>

  ${section("Personal Information", `<table class="field-table">${personalRows}</table>`)}
  ${section("Contact Information", `<table class="field-table">${contactRows}</table>`)}
  ${section("Family Information", `<table class="field-table">${familyRows}</table>`)}

  <div class="cols-2">
    ${section("Assigned Categories", `<div>${categoriesHTML}</div>`)}
    ${section("Qualifications", `<div>${qualificationsHTML}</div>`)}
  </div>

  ${student.hostel ? section("Hostel Allocation", hostelHTML) : ""}

  ${student.images && student.images.length > 0 ? section("Attachments", `<div style="display:flex;flex-wrap:wrap;">${attachmentsHTML}</div>`) : ""}

  <div class="footer">
    <span>Student Registration Report — ${esc(student.fullname)}</span>
    <span>Generated ${printedOn}</span>
  </div>

</div>
</body>
</html>`;
}

export function printStudentRegistration(student: IStudent): void {
  const html = buildStudentRegistrationPrintHTML(student);
  const win = window.open("", "_blank", "width=960,height=800");
  if (!win) {
    console.error("Failed to open print window");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function printMultipleStudentRegistrations(students: IStudent[]): void {
  if (students.length === 0) {
    console.error("No students to print");
    return;
  }

  const htmlPages = students
    .map((student) => buildStudentRegistrationPrintHTML(student))
    .join('<div style="page-break-after:always;"></div>');

  const win = window.open("", "_blank", "width=960,height=800");
  if (!win) {
    console.error("Failed to open print window");
    return;
  }
  win.document.open();
  win.document.write(htmlPages);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}