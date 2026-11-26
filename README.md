# tresensystem
Abrechnungssystem für den Tresen

## Gemeinsame Testdaten

Der Branch `test` speichert Buchungen, Personen und Guthabenkorrekturen über
`/.netlify/functions/tresen` in PostgreSQL. Die Migration legt das Testjournal
mit 100 ab Werk leeren Konten an. Frühere lokale Browserdaten werden nicht
importiert. Die öffentliche Vorschau ist ausschließlich für Testdaten gedacht.

Netlify kann die Datenbank und die SQL-Migration mit `@netlify/database`
bereitstellen. Alternativ in einer separaten Testdatenbank die SQL-Datei aus
`netlify/database/migrations/` anwenden und die Verbindungs-URL in Netlify als
`TRESEN_TEST_DATABASE_URL` für den Test-Branch hinterlegen.

Zum Prüfen auf zwei Geräten die Testseite öffnen, am ersten Gerät für Allgäuer Büble
buchen und am zweiten Gerät Allgäuer Büble oder ihren Bericht öffnen. Beide Geräte
sollten die Buchung und denselben Kontostand anzeigen.

Die fiktiven Vor- und Nachnamen kombinieren je 50 häufige weibliche und männliche
[Vornamen Erwachsener](https://www.beliebte-vornamen.de/49519-erwachsene.htm)
mit den 100 häufigsten [Nachnamen bei Namenskarte](https://www.namenskarte.com/h%C3%A4ufigste-nachnamen-deutschland).
