import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import PDFDocument from "pdfkit";
import { getPool } from "../functions/tresen.mjs";

const berlinMonth = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit",
});
const labelMonth = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC", year: "numeric", month: "long",
});
const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const order = new Intl.Collator("de", { numeric: true });
const money = (cents) => currency.format(cents / 100);

export function monthOf(date) {
  return berlinMonth.format(date);
}

export function invoiceEntries(journal, month, cutoff) {
  const accounts = new Map();
  const names = new Map(journal.people.map((person) => [person.id, person.name]));
  for (const booking of journal.transactions) {
    if (booking.month !== month || Date.parse(booking.createdAt) >= cutoff.getTime()) continue;
    if (!accounts.has(booking.personId)) accounts.set(booking.personId, new Map());
    const items = accounts.get(booking.personId);
    const key = JSON.stringify([booking.productId, booking.productName, booking.unitPriceCents]);
    const item = items.get(key) || {
      name: booking.productName, unit: booking.unitPriceCents, quantity: 0, total: 0,
    };
    item.quantity += booking.quantity;
    item.total += booking.totalCents;
    items.set(key, item);
  }
  return [...accounts].map(([id, items]) => ({
    name: names.get(id),
    items: [...items.values()].sort((a, b) => order.compare(a.name, b.name) || a.unit - b.unit),
  })).sort((a, b) => order.compare(a.name, b.name));
}

export function createInvoice(month, entries) {
  const crest = readFileSync(resolve("netlify/lib/crest.jpg"));
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, autoFirstPage: false });
  const buffers = [];
  const result = new Promise((resolvePdf, reject) => {
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolvePdf(Buffer.concat(buffers)));
    doc.on("error", reject);
  });
  const monthLabel = labelMonth.format(new Date(month + "-01T00:00:00Z"));
  let y;
  function text(value, x, top, { size = 9, bold = false, width = 455, align = "left" } = {}) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor("#111111")
      .text(String(value), x, top, { width, align, lineBreak: false, ellipsis: true });
  }
  function rule(top, color = "#d4d4d4") {
    doc.strokeColor(color).lineWidth(color === "#ff0000" ? 1 : 0.45)
      .moveTo(70, top).lineTo(525, top).stroke();
  }
  function page() {
    doc.addPage();
    doc.image(crest, 69, 120, { fit: [457, 590], align: "center", valign: "center" });
    text("Monatliche Abrechnung " + monthLabel, 70, 71, { size: 14, bold: true });
    text("VDSt Dresden", 70, 91);
    y = 123;
  }
  function row(values, bold = false) {
    const columns = [[76, 166], [250, 63], [325, 88], [425, 94]];
    values.forEach((value, i) => text(value, columns[i][0], y, {
      width: columns[i][1], align: i ? "right" : "left", bold,
    }));
    y += 17;
  }
  function header(name) {
    text(name, 70, y, { size: 10, bold: true });
    y += 14;
    rule(y, "#ff0000");
    y += 5;
    row(["Getränk", "Anzahl", "Einzelpreis", "Gesamt"], true);
  }

  page();
  if (!entries.length) text("Keine Buchungen für diesen Abrechnungsmonat.", 70, y);
  for (const entry of entries) {
    if (y + 56 + entry.items.length * 17 > 775 && y !== 123) page();
    header(entry.name);
    let total = 0;
    for (const item of entry.items) {
      if (y + 35 > 775) {
        page();
        header(entry.name + " (Fortsetzung)");
      }
      rule(y - 3);
      row([item.name, item.quantity, money(item.unit), money(item.total)]);
      total += item.total;
    }
    rule(y - 3);
    const amount = money(total);
    text("Summe", 335, y + 2, { width: 78, align: "right", bold: true });
    text(amount, 425, y + 2, { width: 94, align: "right", bold: true });
    const left = 519 - doc.widthOfString(amount);
    doc.strokeColor("#111111").lineWidth(0.6)
      .moveTo(left, y + 13).lineTo(519, y + 13)
      .moveTo(left, y + 15.5).lineTo(519, y + 15.5).stroke();
    y += 33;
  }

  const { count } = doc.bufferedPageRange();
  for (let index = 0; index < count; index += 1) {
    doc.switchToPage(index);
    text(`Seite ${index + 1} von ${count}`, 425, 798, { size: 8, width: 100, align: "right" });
  }
  doc.end();
  return result;
}

export async function monthlyInvoice(month, now = new Date()) {
  const db = getPool();
  // Ein abgeschlossener Monat hat einen festen Stichtag. Der laufende Monat hat
  // einen neuen Stichtag pro Berliner Kalendertag, unabhängig von der Sommerzeit.
  const { rows: [{ cutoff, pdf }] } = await db.query(`
    WITH boundary AS (
      SELECT LEAST(
        date_trunc('day', $2::timestamptz AT TIME ZONE 'Europe/Berlin'),
        $1::date + INTERVAL '1 month'
      ) AT TIME ZONE 'Europe/Berlin' AS cutoff
    )
    SELECT boundary.cutoff, invoices.pdf
    FROM boundary
    LEFT JOIN tresen_monthly_invoices AS invoices
      ON invoices.month = $3 AND invoices.cutoff >= boundary.cutoff
  `, [month + "-01", now, month]);
  if (pdf) return pdf;

  const { rows: [{ data }] } = await db.query("SELECT data FROM tresen_test_journal WHERE id = 1");
  const generated = await createInvoice(month, invoiceEntries(data, month, cutoff));
  await db.query(`
    INSERT INTO tresen_monthly_invoices (month, cutoff, pdf) VALUES ($1, $2, $3)
    ON CONFLICT (month) DO UPDATE SET cutoff = EXCLUDED.cutoff, pdf = EXCLUDED.pdf
    WHERE tresen_monthly_invoices.cutoff < EXCLUDED.cutoff
  `, [month, cutoff, generated]);
  const { rows } = await db.query("SELECT pdf FROM tresen_monthly_invoices WHERE month = $1", [month]);
  return rows[0].pdf;
}
