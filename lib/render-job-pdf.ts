import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { JobReport } from "@/lib/job-report";

/** Build the same job report PDF bytes as GET /api/jobs/[id]/pdf. */
export async function renderJobReportPdf(report: JobReport): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const pageWidth = 612;
  const pageHeight = 792;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const line = 14;
  const maxW = pageWidth - 2 * margin;

  const draw = (text: string, size = 11, bold = false, color = rgb(0, 0, 0)) => {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color,
      maxWidth: maxW,
    });
    y -= line;
  };

  draw("Job Report", 18, true);
  y -= 6;
  draw(`${report.title}  (#${report.jobNumber})`, 12, true);
  draw(`Status: ${report.status}`);
  y -= 6;
  draw("Customer", 12, true);
  draw(report.customerName);
  if (report.customerPhone) draw(`Phone: ${report.customerPhone}`);
  if (report.customerEmail) draw(`Email: ${report.customerEmail}`);
  y -= 6;
  draw("Location", 12, true);
  draw(report.locationAddress);
  y -= 6;
  draw("Dates", 12, true);
  draw(`Created: ${report.createdAt.toLocaleString()}`);
  if (report.scheduledDate) draw(`Scheduled: ${report.scheduledDate.toLocaleString()}`);
  if (report.completedDate) draw(`Completed: ${report.completedDate.toLocaleString()}`);
  y -= 6;
  draw("Description", 12, true);
  for (const para of wrapText(report.description || "(none)", 90)) {
    draw(para);
  }
  y -= 4;
  draw("Internal Notes", 12, true);
  for (const para of wrapText(report.internalNotes || "(none)", 90)) {
    draw(para);
  }
  y -= 6;
  draw("Materials", 12, true);
  if (report.materials.length === 0) draw("(none)");
  else {
    for (const m of report.materials) {
      const u = m.unit ? ` ${m.unit}` : "";
      draw(`• ${m.name}: ${m.quantity}${u}`);
    }
  }
  y -= 6;
  draw("Employee hours", 12, true);
  if (report.employeeHours.length === 0) draw("(none)");
  else {
    for (const e of report.employeeHours) {
      draw(`• ${e.employeeName}: ${e.hours} h`);
    }
  }

  return pdfDoc.save();
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
