-- Preserve account IDs, existing NFC assignments and all journal entries.
WITH fixtures AS (
  SELECT value AS person
  FROM jsonb_array_elements($fixtures$
[
  {
    "id": "person-01",
    "beerName": "Allgäuer Büble",
    "name": "Michael Müller",
    "nfcId": "NFC-0001"
  },
  {
    "id": "person-02",
    "beerName": "Alpirsbacher Klosterbräu",
    "name": "Sabine Schmidt",
    "nfcId": "NFC-0002"
  },
  {
    "id": "person-03",
    "beerName": "Andechser",
    "name": "Thomas Schneider",
    "nfcId": "NFC-0003"
  },
  {
    "id": "person-04",
    "beerName": "Astra",
    "name": "Susanne Fischer",
    "nfcId": "NFC-0004"
  },
  {
    "id": "person-05",
    "beerName": "Augustiner",
    "name": "Andreas Weber",
    "nfcId": "NFC-0005"
  },
  {
    "id": "person-06",
    "beerName": "Ayinger",
    "name": "Petra Meyer",
    "nfcId": "NFC-0006"
  },
  {
    "id": "person-07",
    "beerName": "Bad Brambacher",
    "name": "Peter Wagner",
    "nfcId": "NFC-0007"
  },
  {
    "id": "person-08",
    "beerName": "Barre",
    "name": "Monika Becker",
    "nfcId": "NFC-0008"
  },
  {
    "id": "person-09",
    "beerName": "Bayreuther Hell",
    "name": "Stefan Hoffmann",
    "nfcId": "NFC-0009"
  },
  {
    "id": "person-10",
    "beerName": "Beck’s",
    "name": "Claudia Schäfer",
    "nfcId": "NFC-0010"
  },
  {
    "id": "person-11",
    "beerName": "Berliner Kindl",
    "name": "Christian Schulz",
    "nfcId": "NFC-0011"
  },
  {
    "id": "person-12",
    "beerName": "Berliner Pilsner",
    "name": "Birgit Bauer",
    "nfcId": "NFC-0012"
  },
  {
    "id": "person-13",
    "beerName": "Bernard",
    "name": "Hans Koch",
    "nfcId": "NFC-0013"
  },
  {
    "id": "person-14",
    "beerName": "Bitburger",
    "name": "Andrea Richter",
    "nfcId": "NFC-0014"
  },
  {
    "id": "person-15",
    "beerName": "Brauhaus Riegele",
    "name": "Klaus Klein",
    "nfcId": "NFC-0015"
  },
  {
    "id": "person-16",
    "beerName": "Brinkhoff’s",
    "name": "Stefanie Wolf",
    "nfcId": "NFC-0016"
  },
  {
    "id": "person-17",
    "beerName": "Budweiser Budvar",
    "name": "Jan Schröder",
    "nfcId": "NFC-0017"
  },
  {
    "id": "person-18",
    "beerName": "Carlsberg",
    "name": "Karin Braun",
    "nfcId": "NFC-0018"
  },
  {
    "id": "person-19",
    "beerName": "Chiemseer",
    "name": "Wolfgang Hofmann",
    "nfcId": "NFC-0019"
  },
  {
    "id": "person-20",
    "beerName": "Clausthaler",
    "name": "Katrin Schwarz",
    "nfcId": "NFC-0020"
  },
  {
    "id": "person-21",
    "beerName": "Coors",
    "name": "Frank Neumann",
    "nfcId": "NFC-0021"
  },
  {
    "id": "person-22",
    "beerName": "Corona",
    "name": "Julia Schmitt",
    "nfcId": "NFC-0022"
  },
  {
    "id": "person-23",
    "beerName": "DAB",
    "name": "Matthias Zimmermann",
    "nfcId": "NFC-0023"
  },
  {
    "id": "person-24",
    "beerName": "Darguner",
    "name": "Anna Hartmann",
    "nfcId": "NFC-0024"
  },
  {
    "id": "person-25",
    "beerName": "Diebels",
    "name": "Jürgen Schmitz",
    "nfcId": "NFC-0025"
  },
  {
    "id": "person-26",
    "beerName": "Distelhäuser",
    "name": "Nicole Schmid",
    "nfcId": "NFC-0026"
  },
  {
    "id": "person-27",
    "beerName": "Duckstein",
    "name": "Alexander Meier",
    "nfcId": "NFC-0027"
  },
  {
    "id": "person-28",
    "beerName": "Einbecker",
    "name": "Anja Lange",
    "nfcId": "NFC-0028"
  },
  {
    "id": "person-29",
    "beerName": "Einsiedler",
    "name": "Martin Werner",
    "nfcId": "NFC-0029"
  },
  {
    "id": "person-30",
    "beerName": "Erdinger",
    "name": "Gabriele Krause",
    "nfcId": "NFC-0030"
  },
  {
    "id": "person-31",
    "beerName": "Feldschlösschen",
    "name": "Bernd Maier",
    "nfcId": "NFC-0031"
  },
  {
    "id": "person-32",
    "beerName": "Flensburger",
    "name": "Angelika Krüger",
    "nfcId": "NFC-0032"
  },
  {
    "id": "person-33",
    "beerName": "Franziskaner",
    "name": "Markus Lehmann",
    "nfcId": "NFC-0033"
  },
  {
    "id": "person-34",
    "beerName": "Freiberger",
    "name": "Martina Mayer",
    "nfcId": "NFC-0034"
  },
  {
    "id": "person-35",
    "beerName": "Früh Kölsch",
    "name": "Thorsten Huber",
    "nfcId": "NFC-0035"
  },
  {
    "id": "person-36",
    "beerName": "Fürstenberg",
    "name": "Brigitte Walter",
    "nfcId": "NFC-0036"
  },
  {
    "id": "person-37",
    "beerName": "Gaffel",
    "name": "Uwe König",
    "nfcId": "NFC-0037"
  },
  {
    "id": "person-38",
    "beerName": "Gambrinus",
    "name": "Heike Herrmann",
    "nfcId": "NFC-0038"
  },
  {
    "id": "person-39",
    "beerName": "Glückauf",
    "name": "Jens Köhler",
    "nfcId": "NFC-0039"
  },
  {
    "id": "person-40",
    "beerName": "Gösser",
    "name": "Sandra Kaiser",
    "nfcId": "NFC-0040"
  },
  {
    "id": "person-41",
    "beerName": "Grevensteiner",
    "name": "Jörg Fuchs",
    "nfcId": "NFC-0041"
  },
  {
    "id": "person-42",
    "beerName": "Guinness",
    "name": "Renate Lang",
    "nfcId": "NFC-0042"
  },
  {
    "id": "person-43",
    "beerName": "Hacker-Pschorr",
    "name": "Ralf Schulze",
    "nfcId": "NFC-0043"
  },
  {
    "id": "person-44",
    "beerName": "Hansa",
    "name": "Barbara Jung",
    "nfcId": "NFC-0044"
  },
  {
    "id": "person-45",
    "beerName": "Hasen-Bräu",
    "name": "Sven Peters",
    "nfcId": "NFC-0045"
  },
  {
    "id": "person-46",
    "beerName": "Hasseröder",
    "name": "Christina Möller",
    "nfcId": "NFC-0046"
  },
  {
    "id": "person-47",
    "beerName": "Heineken",
    "name": "Daniel Weiß",
    "nfcId": "NFC-0047"
  },
  {
    "id": "person-48",
    "beerName": "Herforder",
    "name": "Katharina Scholz",
    "nfcId": "NFC-0048"
  },
  {
    "id": "person-49",
    "beerName": "Herrenhäuser",
    "name": "Sebastian Keller",
    "nfcId": "NFC-0049"
  },
  {
    "id": "person-50",
    "beerName": "Hirschbräu",
    "name": "Christine Roth",
    "nfcId": "NFC-0050"
  },
  {
    "id": "person-51",
    "beerName": "Hoegaarden",
    "name": "Rainer Hahn",
    "nfcId": "NFC-0051"
  },
  {
    "id": "person-52",
    "beerName": "Hofbräu München",
    "name": "Kerstin Frank",
    "nfcId": "NFC-0052"
  },
  {
    "id": "person-53",
    "beerName": "Holsten",
    "name": "Manfred Vogel",
    "nfcId": "NFC-0053"
  },
  {
    "id": "person-54",
    "beerName": "Jever",
    "name": "Ursula Beck",
    "nfcId": "NFC-0054"
  },
  {
    "id": "person-55",
    "beerName": "Kaiserdom",
    "name": "Oliver Friedrich",
    "nfcId": "NFC-0055"
  },
  {
    "id": "person-56",
    "beerName": "Kapuziner",
    "name": "Maria Berger",
    "nfcId": "NFC-0056"
  },
  {
    "id": "person-57",
    "beerName": "Karlsberg",
    "name": "Holger Günther",
    "nfcId": "NFC-0057"
  },
  {
    "id": "person-58",
    "beerName": "Ketterer",
    "name": "Ute Schubert",
    "nfcId": "NFC-0058"
  },
  {
    "id": "person-59",
    "beerName": "König Ludwig",
    "name": "Dirk Winkler",
    "nfcId": "NFC-0059"
  },
  {
    "id": "person-60",
    "beerName": "König Pilsener",
    "name": "Sarah Lorenz",
    "nfcId": "NFC-0060"
  },
  {
    "id": "person-61",
    "beerName": "Köstritzer",
    "name": "Tobias Baumann",
    "nfcId": "NFC-0061"
  },
  {
    "id": "person-62",
    "beerName": "Krombacher",
    "name": "Marion Kraus",
    "nfcId": "NFC-0062"
  },
  {
    "id": "person-63",
    "beerName": "Kulmbacher",
    "name": "Philipp Ludwig",
    "nfcId": "NFC-0063"
  },
  {
    "id": "person-64",
    "beerName": "Landskron",
    "name": "Silvia Schuster",
    "nfcId": "NFC-0064"
  },
  {
    "id": "person-65",
    "beerName": "Leffe",
    "name": "Carsten Böhm",
    "nfcId": "NFC-0065"
  },
  {
    "id": "person-66",
    "beerName": "Leikeim",
    "name": "Melanie Krämer",
    "nfcId": "NFC-0066"
  },
  {
    "id": "person-67",
    "beerName": "Licher",
    "name": "Florian Simon",
    "nfcId": "NFC-0067"
  },
  {
    "id": "person-68",
    "beerName": "Löwenbräu",
    "name": "Ulrike Franke",
    "nfcId": "NFC-0068"
  },
  {
    "id": "person-69",
    "beerName": "Maisel’s Weisse",
    "name": "Dieter Winter",
    "nfcId": "NFC-0069"
  },
  {
    "id": "person-70",
    "beerName": "Mönchshof",
    "name": "Bettina Vogt",
    "nfcId": "NFC-0070"
  },
  {
    "id": "person-71",
    "beerName": "Moritz Fiege",
    "name": "Christoph Jäger",
    "nfcId": "NFC-0071"
  },
  {
    "id": "person-72",
    "beerName": "Neumarkter Lammsbräu",
    "name": "Jutta Albrecht",
    "nfcId": "NFC-0072"
  },
  {
    "id": "person-73",
    "beerName": "Oettinger",
    "name": "Dennis Schumacher",
    "nfcId": "NFC-0073"
  },
  {
    "id": "person-74",
    "beerName": "Original Ritterguts Gose",
    "name": "Silke Martin",
    "nfcId": "NFC-0074"
  },
  {
    "id": "person-75",
    "beerName": "Paulaner",
    "name": "Joachim Haas",
    "nfcId": "NFC-0075"
  },
  {
    "id": "person-76",
    "beerName": "Peroni",
    "name": "Tanja Groß",
    "nfcId": "NFC-0076"
  },
  {
    "id": "person-77",
    "beerName": "Pfaffen Kölsch",
    "name": "Patrick Schulte",
    "nfcId": "NFC-0077"
  },
  {
    "id": "person-78",
    "beerName": "Pfungstädter",
    "name": "Christiane Stein",
    "nfcId": "NFC-0078"
  },
  {
    "id": "person-79",
    "beerName": "Pilsner Urquell",
    "name": "Marc Graf",
    "nfcId": "NFC-0079"
  },
  {
    "id": "person-80",
    "beerName": "Radeberger",
    "name": "Elke Sommer",
    "nfcId": "NFC-0080"
  },
  {
    "id": "person-81",
    "beerName": "Ratsherrn",
    "name": "Carl Heinrich",
    "nfcId": "NFC-0081"
  },
  {
    "id": "person-82",
    "beerName": "Reissdorf",
    "name": "Nadine Otto",
    "nfcId": "NFC-0082"
  },
  {
    "id": "person-83",
    "beerName": "Rothaus",
    "name": "Andre Ziegler",
    "nfcId": "NFC-0083"
  },
  {
    "id": "person-84",
    "beerName": "Schlenkerla",
    "name": "Ingrid Dietrich",
    "nfcId": "NFC-0084"
  },
  {
    "id": "person-85",
    "beerName": "Schneider Weisse",
    "name": "Marco Schreiber",
    "nfcId": "NFC-0085"
  },
  {
    "id": "person-86",
    "beerName": "Schöfferhofer",
    "name": "Daniela Brandt",
    "nfcId": "NFC-0086"
  },
  {
    "id": "person-87",
    "beerName": "Schussenrieder",
    "name": "Tim Engel",
    "nfcId": "NFC-0087"
  },
  {
    "id": "person-88",
    "beerName": "Schwaben Bräu",
    "name": "Angela Seidel",
    "nfcId": "NFC-0088"
  },
  {
    "id": "person-89",
    "beerName": "Singha",
    "name": "Kai Kuhn",
    "nfcId": "NFC-0089"
  },
  {
    "id": "person-90",
    "beerName": "Spaten",
    "name": "Jennifer Jansen",
    "nfcId": "NFC-0090"
  },
  {
    "id": "person-91",
    "beerName": "Starnberger",
    "name": "Marcel Horn",
    "nfcId": "NFC-0091"
  },
  {
    "id": "person-92",
    "beerName": "Stella Artois",
    "name": "Anke Sauer",
    "nfcId": "NFC-0092"
  },
  {
    "id": "person-93",
    "beerName": "Störtebeker",
    "name": "Robert Arnold",
    "nfcId": "NFC-0093"
  },
  {
    "id": "person-94",
    "beerName": "Tannenzäpfle",
    "name": "Cornelia Thomas",
    "nfcId": "NFC-0094"
  },
  {
    "id": "person-95",
    "beerName": "Tegernseer",
    "name": "Werner Ernst",
    "nfcId": "NFC-0095"
  },
  {
    "id": "person-96",
    "beerName": "Tucher",
    "name": "Nina Bergmann",
    "nfcId": "NFC-0096"
  },
  {
    "id": "person-97",
    "beerName": "Ur-Krostitzer",
    "name": "Lars Pohl",
    "nfcId": "NFC-0097"
  },
  {
    "id": "person-98",
    "beerName": "Veltins",
    "name": "Sonja Kühn",
    "nfcId": "NFC-0098"
  },
  {
    "id": "person-99",
    "beerName": "Warsteiner",
    "name": "Rolf Kramer",
    "nfcId": "NFC-0099"
  },
  {
    "id": "person-100",
    "beerName": "Wernesgrüner",
    "name": "Katja Busch",
    "nfcId": "NFC-0100"
  }
]
$fixtures$::jsonb)
), accounts AS (
  SELECT account.person || jsonb_build_object(
    'beerName', COALESCE(fixtures.person->>'beerName', account.person->>'name'),
    'name', CASE WHEN account.person->>'name' ~ '^Person [0-9]+$'
      THEN COALESCE(fixtures.person->>'name', account.person->>'name')
      ELSE account.person->>'name' END
  ) AS person
  FROM tresen_test_journal AS journal
  CROSS JOIN LATERAL jsonb_array_elements(journal.data->'people') AS account(person)
  LEFT JOIN fixtures ON fixtures.person->>'id' = account.person->>'id'
  UNION ALL
  SELECT fixtures.person FROM fixtures
  WHERE NOT EXISTS (
    SELECT 1 FROM tresen_test_journal AS journal
    CROSS JOIN LATERAL jsonb_array_elements(journal.data->'people') AS account(person)
    WHERE account.person->>'id' = fixtures.person->>'id'
  )
)
UPDATE tresen_test_journal
SET data = data || jsonb_build_object(
  'people', (SELECT jsonb_agg(person ORDER BY substring(person->>'id' FROM 8)::integer) FROM accounts),
  'revision', (data->>'revision')::integer + 1
)
WHERE id = 1;
