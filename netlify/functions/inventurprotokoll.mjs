import PDFDocument from "pdfkit";
import { getPool } from "./tresen.mjs";

const labelDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "UTC" });
const dateText = (date) => labelDate.format(new Date(date + "T00:00:00Z"));
const inEntryOrder = (a, b) => a.recordedAt.localeCompare(b.recordedAt);

export function protocolTables(inventory) {
  const counts = [...(inventory?.counts || [])].sort(inEntryOrder);
  const deliveries = [...(inventory?.deliveries || [])].sort(inEntryOrder);
  const tables = counts.map((count, index) => {
    const previous = counts[index - 1];
    const bought = new Map();
    if (previous) {
      for (const delivery of deliveries) {
        if (inEntryOrder(delivery, previous) <= 0 || inEntryOrder(delivery, count) > 0) continue;
        for (const { name, bottles } of delivery.items) {
          const key = name.toLocaleLowerCase("de");
          bought.set(key, (bought.get(key) || 0) + bottles);
        }
      }
    }
    return {
      title: "Inventur vom " + dateText(count.date),
      headings: ["Getränk", previous ? "Gekauft seit " + dateText(previous.date) : "Gekauft seit", "Sollzustand", "Istzustand", "Schwund"],
      rows: count.items.map(({ name, bottles }) => [
        name, previous ? bought.get(name.toLocaleLowerCase("de")) || 0 : "-", "-", bottles, "-",
      ]),
      recordedAt: count.recordedAt,
    };
  });
  for (const delivery of deliveries) {
    tables.push({
      title: "Lieferung vom " + dateText(delivery.date),
      headings: ["Getränk", "Gelieferte Anzahl"],
      rows: delivery.items.filter(({ bottles }) => bottles > 0).map(({ name, bottles }) => [name, bottles]),
      recordedAt: delivery.recordedAt,
    });
  }
  return tables.sort((a, b) => inEntryOrder(b, a));
}

export function createProtocolPdf(tables) {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, info: { Title: "Inventurprotokolle" } });
  const chunks = [];
  const pdf = new Promise((resolve, reject) => {
    doc.on("data", (data) => chunks.push(data));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  let y;
  function text(label, x, top, width, { size = 9, bold = false, right = false } = {}) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor("#111111")
      .text(String(label), x, top, { width, align: right ? "right" : "left", lineBreak: false, ellipsis: true });
  }
  function page() {
    doc.addPage();
    text("Inventurprotokolle", 60, 48, 475, { size: 23, bold: true });
    text("VDSt Dresden · Mengen in Flaschen", 60, 78, 475);
    y = 110;
  }
  function line(color, width) {
    doc.strokeColor(color).lineWidth(width).moveTo(60, y).lineTo(535, y).stroke();
  }
  page();
  if (!tables.length) text("Noch keine Inventuren oder Lieferungen erfasst.", 60, y, 475);
  else {
    text("Ein Strich steht für einen nicht ermittelten Wert.", 60, y, 475);
    y += 24;
  }
  for (const table of tables) {
    const columns = table.headings.length === 2 ? [330, 145] : [148, 110, 75, 70, 72];
    function row(values, bold = false) {
      let x = 60;
      values.forEach((value, i) => {
        text(value, x + 5, y + 5, columns[i] - 10, { size: bold ? 8 : 9, bold, right: i > 0 });
        x += columns[i];
      });
      y += 19;
      line("#d4d4d4", 0.45);
    }
    function header(continuation = "") {
      text(table.title + continuation, 60, y, 475, { size: 11, bold: true });
      y += 17;
      line("#ff0000", 1);
      row(table.headings, true);
    }
    if (y + 55 > 790) page();
    header();
    for (const item of table.rows) {
      if (y + 19 > 790) {
        page();
        header(" (Fortsetzung)");
      }
      row(item);
    }
    y += 18;
  }
  doc.end();
  return pdf;
}

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null, { status: 405 });
  try {
    const { rows: [row] } = await getPool().query("SELECT data->'inventory' AS inventory FROM tresen_test_journal WHERE id = 1");
    const pdf = await createProtocolPdf(protocolTables(row?.inventory));
    return new Response(pdf, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Inventurprotokolle.pdf"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("Inventory protocol PDF failed", error.code || error.name);
    return new Response("Inventurprotokoll konnte nicht heruntergeladen werden.", { status: 503 });
  }
}
