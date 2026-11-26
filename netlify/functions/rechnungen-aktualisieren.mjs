import { monthOf, monthlyInvoice } from "../lib/monthly-invoice.mjs";

// Berlin liegt je nach Jahreszeit bei UTC+1 oder UTC+2.
export const config = { schedule: "0 22,23 * * *" };
const berlinHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23",
});

export default async function handler() {
  // Beide UTC-Termine können in Sommer- und Winterzeit zusammen genutzt werden.
  const actual = new Date();
  if (berlinHour.format(actual) !== "00") return new Response(null, { status: 204 });
  const previousDay = new Date(actual.getTime() - 24 * 60 * 60 * 1000);
  const currentMonth = monthOf(actual);
  const previousMonth = monthOf(previousDay);
  if (previousMonth !== currentMonth) await monthlyInvoice(previousMonth, actual);
  await monthlyInvoice(currentMonth, actual);
  return new Response(null, { status: 204 });
}
