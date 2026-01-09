import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './env.js';

// Ensure data directory exists
const dataDir = path.dirname(config.database.path);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
export const db = new Database(config.database.path);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase(): void {
    console.log('[DB] Initializing database schema...');

    // Users table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      balance REAL DEFAULT 1000.00,
      wallet_address TEXT,
      preferred_payment_method TEXT DEFAULT 'pix',
      kyc_status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Events table
    db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sport TEXT NOT NULL,
      start_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      video_url TEXT,
      latency_target INTEGER DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Markets table
    db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      market_type TEXT NOT NULL,
      description TEXT,
      current_odds REAL NOT NULL,
      status TEXT DEFAULT 'open',
      market_close_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

    // Bets table
    db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      bet_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      market_id TEXT NOT NULL,
      amount REAL NOT NULL,
      odds REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      placed_at TEXT NOT NULL,
      server_received_at TEXT NOT NULL,
      latency_ms INTEGER,
      video_frame_hash TEXT,
      odds_hash TEXT,
      trace_id TEXT,
      settlement_id TEXT,
      access_level TEXT DEFAULT 'PROVISIONAL',
      erc8004_proof TEXT,
      confirmed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (market_id) REFERENCES markets(id)
    )
  `);

    // Disputes table
    db.exec(`
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      bet_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      tee_validation_result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (bet_id) REFERENCES bets(bet_id)
    )
  `);

    // Video frames table
    db.exec(`
    CREATE TABLE IF NOT EXISTS video_frames (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      frame_hash TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

    // Access logs table
    db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      trace_id TEXT NOT NULL,
      access_level TEXT NOT NULL,
      granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      upgraded_at TEXT,
      expires_at TEXT,
      revoked_at TEXT,
      status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

    // Payment traces table
    db.exec(`
    CREATE TABLE IF NOT EXISTS payment_traces (
      trace_id TEXT PRIMARY KEY,
      payer TEXT NOT NULL,
      payee TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'BRL',
      intent_timestamp TEXT NOT NULL,
      settlement_timestamp TEXT,
      fiat_reference_hash TEXT,
      settlement_status TEXT DEFAULT 'PENDING',
      blockchain_tx_hash TEXT,
      erc8004_validation_id TEXT,
      erc8004_feedback_id TEXT
    )
  `);

    // ERC-8004 simulated registries
    db.exec(`
    CREATE TABLE IF NOT EXISTS erc8004_validations (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      agent TEXT NOT NULL,
      validation_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata TEXT
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS erc8004_feedback (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      agent TEXT NOT NULL,
      rating REAL NOT NULL,
      feedback_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      proof TEXT
    )
  `);

    // Merkle roots table for blockchain anchoring
    db.exec(`
    CREATE TABLE IF NOT EXISTS merkle_roots (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      merkle_root TEXT NOT NULL,
      bet_ids TEXT NOT NULL,
      tx_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

    console.log('[DB] Database schema initialized successfully');
}
