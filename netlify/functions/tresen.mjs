import { randomUUID } from "node:crypto";
import { getConnectionString } from "@netlify/database";
import pg from "pg";

let pool;
const journal = "SELECT data FROM tresen_test_journal WHERE id = 1";
const monthFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
});

class RequestError extends Error {}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.TRESEN_TEST_DATABASE_URL || getConnectionString(),
      max: 2,
      connectionTimeoutMillis: 5000,
    });
    pool.on("error", (error) => {
      console.error("Tresen idle database connection failed", error.code || error.name);
    });
  }
  return pool;
}

function requireInput(valid, message) {
  if (!valid) throw new RequestError(message);
}

function createPerson(data, input) {
  const beerName = typeof input.beerName === "string" ? input.beerName.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const nfcId = typeof input.nfcId === "string" ? input.nfcId.trim() : "";
  requireInput(beerName && beerName.length <= 80 && name && name.length <= 80 && nfcId && nfcId.length <= 120,
    "Bitte gültigen Biernamen, Vor- und Nachnamen und NFC-Kennung eingeben.");
  requireInput(!data.people.some((person) =>
    (person.beerName || person.name).toLocaleLowerCase("de") === beerName.toLocaleLowerCase("de")),
    "Dieser Biername ist bereits vergeben.");
  requireInput(!data.people.some((person) => person.nfcId === nfcId),
    "Diese NFC-Kennung ist bereits vergeben.");
  const number = Math.max(...data.people.map((person) =>
    Number(person.id.slice("person-".length)))) + 1;
  data.people.push({ id: "person-" + String(number).padStart(2, "0"), beerName, name, nfcId });
}

function balanceAt(data, personId, month) {
  const belongs = (entry) => entry.personId === personId && entry.month === month;
  const purchases = data.transactions.filter(belongs).reduce((sum, entry) => sum + entry.totalCents, 0);
  const corrections = data.adjustments.filter(belongs).reduce((sum, entry) => sum + entry.amountCents, 0);
  return corrections - purchases;
}

function setBalance(data, person, input, month, createdAt) {
  requireInput(Number.isSafeInteger(input.targetCents), "Ungültiger Eurobetrag.");
  const amountCents = input.targetCents - balanceAt(data, person.id, month);
  requireInput(Number.isSafeInteger(amountCents), "Ungültiger Eurobetrag.");
  if (amountCents !== 0) {
    data.adjustments.push({
      id: randomUUID(), personId: person.id, amountCents, month, createdAt,
      reason: "Guthaben durch Bierwart festgelegt",
    });
  }
}

function applyChange(data, input) {
  requireInput(input && typeof input === "object", "Ungültige Anfrage.");
  if (input.action === "create-person") {
    createPerson(data, input);
    return {};
  }

  const person = data.people.find(({ id }) => id === input.personId);
  requireInput(person, "Person nicht gefunden.");
  const now = new Date();
  const month = monthFormat.format(now);
  const createdAt = now.toISOString();
  if (input.action === "set-balance") {
    setBalance(data, person, input, month, createdAt);
    return {};
  }

  requireInput(input.action === "book", "Unbekannte Aktion.");
  const { id, productId, quantity } = input;
  requireInput(typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id),
    "Ungültige Buchungskennung.");
  const previous = data.transactions.find((entry) => entry.id === id);
  if (previous) {
    requireInput(previous.personId === person.id && previous.productId === productId &&
      previous.quantity === quantity, "Buchungskennung bereits vergeben.");
    return { transaction: previous, duplicate: true };
  }
  requireInput(month === input.month, "Der Monat hat gewechselt. Bitte die Beträge erneut prüfen.");
  requireInput(typeof productId === "string" && /^drink-[1-9]$/.test(productId),
    "Getränk nicht gefunden.");
  requireInput(Number.isInteger(quantity) && quantity >= 1 && quantity <= 99,
    "Die Anzahl muss zwischen 1 und 99 liegen.");

  const unitPriceCents = 100;
  const transaction = {
    id, personId: person.id, personName: person.name, beerName: person.beerName, nfcId: person.nfcId,
    productId, productName: "Getränk " + productId.slice(-1), quantity,
    unitPriceCents, totalCents: quantity * unitPriceCents, createdAt, month,
  };
  data.transactions.push(transaction);
  transaction.balanceAfterCents = balanceAt(data, person.id, month);
  return { transaction };
}

async function write(input) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    // Änderungen lesen und schreiben denselben Journalstand unter einer Zeilensperre.
    const { rows: [{ data }] } = await client.query(journal + " FOR UPDATE");
    const { transaction, duplicate } = applyChange(data, input);
    if (!duplicate) {
      data.revision += 1;
      await client.query("UPDATE tresen_test_journal SET data = $1 WHERE id = 1", [data]);
    }
    await client.query("COMMIT");
    return json({ state: data, transaction });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(request) {
  try {
    if (request.method === "GET") {
      const { rows: [{ data }] } = await getPool().query(journal);
      return json({ state: data });
    }
    if (request.method !== "POST") return json({ error: "Methode nicht erlaubt." }, 405);
    const input = await request.json().catch(() => null);
    return await write(input);
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, 400);
    console.error("Tresen database request failed", error.code || error.name);
    return json({ error: "Die Datenbank ist gerade nicht erreichbar." }, 503);
  }
}
