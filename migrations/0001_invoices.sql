CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  work_description TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at DESC);
