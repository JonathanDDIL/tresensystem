import { monthOf, monthlyInvoice } from "../lib/monthly-invoice.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null, { status: 405 });
  const month = new URL(request.url).searchParams.get("month");
  if (!month || !/^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/.test(month) || month > monthOf(new Date())) {
    return new Response("Bitte einen gültigen Abrechnungsmonat wählen.", { status: 400 });
  }
  try {
    return new Response(await monthlyInvoice(month), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Tresenrechnung_${month}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Invoice generation failed", error.code || error.name);
    return new Response("Rechnung ist gerade nicht verfügbar.", { status: 503 });
  }
}
