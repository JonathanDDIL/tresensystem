# tresensystem
Abrechnungssystem für den Tresen

## Gemeinsame Testdaten

Der Branch `test` speichert Buchungen, Personen und Guthabenkorrekturen über
`/.netlify/functions/tresen` in PostgreSQL. Die Migration legt das Testjournal
mit 99 ab Werk leeren Konten an. Frühere lokale Browserdaten werden nicht
importiert. Die öffentliche Vorschau ist ausschließlich für Testdaten gedacht.

Netlify kann die Datenbank und die SQL-Migration mit `@netlify/database`
bereitstellen. Alternativ in einer separaten Testdatenbank die SQL-Datei aus
`netlify/database/migrations/` anwenden und die Verbindungs-URL in Netlify als
`TRESEN_TEST_DATABASE_URL` für den Test-Branch hinterlegen.

Zum Prüfen auf zwei Geräten die Testseite öffnen, am ersten Gerät für Person 01
buchen und am zweiten Gerät Person 01 oder ihren Bericht öffnen. Beide Geräte
sollten die Buchung und denselben Kontostand anzeigen.
