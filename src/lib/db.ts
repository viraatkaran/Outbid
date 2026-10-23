import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  owner_token TEXT NOT NULL UNIQUE,
  email TEXT,
  alerts INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  listing_id INTEGER,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  scope TEXT NOT NULL DEFAULT 'category',
  amount_cents INTEGER NOT NULL,
  email TEXT,
  created_listing INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  scope TEXT NOT NULL DEFAULT 'category',
  payment_ref TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_created ON bids(created_at);
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clicks_listing ON clicks(listing_id, day);
CREATE UNIQUE INDEX IF NOT EXISTS uq_clicks_verified ON clicks(listing_id, day, visitor_hash) WHERE verified = 1;
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  source TEXT,
  token TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts_sent (
  listing_id INTEGER NOT NULL,
  board_key TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (listing_id, board_key, day)
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

/** Adds columns introduced after the first release to databases that already exist. */
function migrate(d: Database.Database) {
  const addColumn = (table: string, col: string, def: string) => {
    const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === col)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  };
  addColumn("listings", "country", "TEXT NOT NULL DEFAULT 'US'");
  addColumn("listings", "alerts", "INTEGER NOT NULL DEFAULT 1");
  addColumn("orders", "country", "TEXT NOT NULL DEFAULT 'US'");
  addColumn("orders", "scope", "TEXT NOT NULL DEFAULT 'category'");
  addColumn("orders", "created_listing", "INTEGER NOT NULL DEFAULT 0");
  addColumn("bids", "scope", "TEXT NOT NULL DEFAULT 'category'");
  addColumn("subscribers", "token", "TEXT");
  d.exec("UPDATE subscribers SET token = lower(hex(randomblob(16))) WHERE token IS NULL");
  d.exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_subscribers_token ON subscribers(token)");
  d.exec("CREATE INDEX IF NOT EXISTS idx_listings_board ON listings(country, category)");
  d.exec("CREATE INDEX IF NOT EXISTS idx_bids_scope ON bids(scope, created_at)");
}

const g = globalThis as unknown as { __db?: Database.Database };

export function db(): Database.Database {
  if (g.__db) return g.__db;
  const file = process.env.DATABASE_PATH || "./data/app.db";
  if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const d = new Database(file);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.exec(SCHEMA);
  migrate(d);
  g.__db = d;
  return d;
}

export const nowIso = () => new Date().toISOString();
