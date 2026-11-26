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

export function getPool() {
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

function requireUniqueBeerName(data, beerName, exceptId) {
  requireInput(!data.people.some((person) =>
    person.id !== exceptId &&
    (person.beerName || person.name).toLocaleLowerCase("de") === beerName.toLocaleLowerCase("de")),
    "Dieser Biername ist bereits vergeben.");
}

function createPerson(data, input) {
  const beerName = typeof input.beerName === "string" ? input.beerName.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const nfcId = typeof input.nfcId === "string" ? input.nfcId.trim() : "";
  requireInput(beerName && beerName.length <= 80 && name && name.length <= 80 && nfcId && nfcId.length <= 120,
    "Bitte gültigen Biernamen, Vor- und Nachnamen und NFC-Kennung eingeben.");
  requireUniqueBeerName(data, beerName);
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

const inventoryDrinks = [
  "DFK", "Vita Zitrone", "Vita Cola", "Vita Pur", "Radler", "Jever Fun", "Erdinger alkoholfrei",
];
const inventoryDateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
});
const inventoryKey = (name) => name.toLocaleLowerCase("de");

function ensureInventory(data) {
  data.inventory ??= {
    stock: inventoryDrinks.map((name) => ({ name, bottles: null })),
    counts: [],
  };
  return data;
}

function recordStockChange(data, input, now) {
  const delivery = input.action === "record-delivery";
  const date = input.date;
  const validDate = typeof date === "string" && /^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(date)
    ? new Date(date + "T00:00:00Z") : null;
  requireInput(validDate && Number.isFinite(validDate.getTime()) &&
    validDate.toISOString().slice(0, 10) === date && date <= inventoryDateFormat.format(now),
    "Bitte ein gültiges Datum bis heute auswählen.");
  requireInput(Array.isArray(input.items) && input.items.length <= 250,
    "Ungültige Getränkeliste.");
  const names = new Set();
  const stock = input.items.map((entry) => {
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    requireInput(name && name.length <= 80 && !names.has(inventoryKey(name)),
      "Bitte eindeutige Getränkenamen eingeben.");
    requireInput(Number.isSafeInteger(entry.bottles) && entry.bottles >= 0,
      "Bitte für jedes Getränk eine ganze Flaschenzahl ab 0 eingeben.");
    names.add(inventoryKey(name));
    return { name, bottles: entry.bottles };
  });
  if (delivery) {
    requireInput(typeof input.id === "string" && /^[0-9a-f-]{36}$/i.test(input.id),
      "Ungültige Lieferkennung.");
    const deliveries = data.inventory.deliveries ??= [];
    const previous = deliveries.find(({ id }) => id === input.id);
    if (previous) {
      requireInput(previous.date === date && previous.items.length === stock.length &&
        previous.items.every((item, index) => item.name === stock[index].name &&
          item.bottles === stock[index].bottles), "Lieferkennung bereits vergeben.");
      return { duplicate: true };
    }
    requireInput(stock.some(({ bottles }) => bottles > 0), "Bitte mindestens eine gelieferte Flasche eintragen.");
    const current = new Map(data.inventory.stock.map((item) => [inventoryKey(item.name), item]));
    for (const { name, bottles } of stock) {
      const key = inventoryKey(name);
      const existing = current.get(key);
      if (existing && bottles === 0) continue;
      const total = (existing?.bottles ?? 0) + bottles;
      requireInput(Number.isSafeInteger(total), "Der Flaschenbestand ist zu groß.");
      current.set(key, { name: existing?.name ?? name, bottles: total });
    }
    data.inventory.stock = [...current.values()];
    deliveries.push({ id: input.id, date, recordedAt: now.toISOString(), items: stock });
    return {};
  }

  requireInput(data.inventory.stock.every(({ name }) => names.has(inventoryKey(name))),
    "Die Getränkeliste wurde geändert. Bitte die Inventur erneut öffnen.");
  data.inventory.stock = stock;
  data.inventory.counts.push({ date, recordedAt: now.toISOString(), items: stock });
  return {};
}

function applyChange(data, input) {
  requireInput(input && typeof input === "object", "Ungültige Anfrage.");
  if (input.action === "record-inventory" || input.action === "record-delivery") {
    return recordStockChange(ensureInventory(data), input, new Date());
  }
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

  if (input.action === "edit-person") {
    requireInput(input.beerName !== undefined || input.targetCents !== undefined,
      "Keine Änderungen angegeben.");
    if (input.beerName !== undefined) {
      const beerName = typeof input.beerName === "string" ? input.beerName.trim() : "";
      requireInput(beerName && beerName.length <= 80, "Bitte einen gültigen Biernamen eingeben.");
      requireUniqueBeerName(data, beerName, person.id);
      person.beerName = beerName;
    }
    if (input.targetCents !== undefined) setBalance(data, person, input, month, createdAt);
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
    return json({ state: ensureInventory(data), transaction });
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
      return json({ state: ensureInventory(data) });
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
