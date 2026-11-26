CREATE TABLE tresen_test_journal (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL
);

INSERT INTO tresen_test_journal (id, data)
SELECT 1, jsonb_build_object(
  'version', 1, 'revision', 0, 'transactions', '[]'::jsonb,
  'adjustments', '[]'::jsonb,
  'people', jsonb_agg(jsonb_build_object(
    'id', 'person-' || lpad(n::text, 2, '0'),
    'name', 'Person ' || lpad(n::text, 2, '0'),
    'nfcId', 'NFC-' || lpad(n::text, 4, '0')
  ) ORDER BY n)
)
FROM generate_series(1, 99) AS n;
