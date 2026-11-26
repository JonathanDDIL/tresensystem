CREATE TABLE tresen_monthly_invoices (
  month text PRIMARY KEY CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  cutoff timestamptz NOT NULL,
  pdf bytea NOT NULL
);
