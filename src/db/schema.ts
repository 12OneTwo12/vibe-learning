/**
 * VibeLearning Database Schema
 *
 * SQLite schema definitions with comprehensive indexing
 * for optimal query performance.
 */

/**
 * SQL statements for creating the database schema
 */
/**
 * Schema for table creation (run first)
 * Note: mode_state uses minimal schema for migration compatibility
 */
export const SCHEMA_TABLES_SQL = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Concept progress table - tracks SM-2 state for each concept
-- Default level is 3 (mid-level) to respect experienced developers
CREATE TABLE IF NOT EXISTS concept_progress (
    concept_id TEXT PRIMARY KEY,
    current_level INTEGER DEFAULT 3 CHECK(current_level BETWEEN 1 AND 5),
    easiness_factor REAL DEFAULT 2.5 CHECK(easiness_factor >= 1.3),
    interval_days INTEGER DEFAULT 1 CHECK(interval_days >= 1),
    next_review TEXT,  -- ISO date string
    total_attempts INTEGER DEFAULT 0 CHECK(total_attempts >= 0),
    correct_count INTEGER DEFAULT 0 CHECK(correct_count >= 0),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Learning records table - individual learning attempts
CREATE TABLE IF NOT EXISTS learning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id TEXT NOT NULL,
    level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 5),
    result TEXT NOT NULL CHECK(result IN ('correct', 'partial', 'incorrect', 'skipped')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (concept_id) REFERENCES concept_progress(concept_id) ON DELETE CASCADE
);

-- Session state table - fatigue management (singleton)
CREATE TABLE IF NOT EXISTS session_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    questions_today INTEGER DEFAULT 0 CHECK(questions_today >= 0),
    last_question_at TEXT,
    consecutive_skips INTEGER DEFAULT 0 CHECK(consecutive_skips >= 0),
    last_reset_date TEXT DEFAULT (date('now'))
);

-- Mode state table - learning mode configuration (singleton)
-- Created with minimal schema; migrations add new columns
CREATE TABLE IF NOT EXISTS mode_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    paused_until TEXT,
    focus_area TEXT
);

-- Unknown unknowns table - concepts user encountered but hasn't explored
CREATE TABLE IF NOT EXISTS unknown_unknowns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id TEXT NOT NULL UNIQUE,
    related_to TEXT NOT NULL,
    appearances INTEGER DEFAULT 1 CHECK(appearances >= 1),
    explored INTEGER DEFAULT 0 CHECK(explored IN (0, 1)),
    context TEXT,
    why_important TEXT,
    first_seen TEXT DEFAULT (datetime('now')),
    explored_at TEXT
);

-- Senior mode rounds table - tracks persuasion rounds
CREATE TABLE IF NOT EXISTS senior_mode_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    current_round INTEGER DEFAULT 1 CHECK(current_round BETWEEN 1 AND 3),
    max_rounds INTEGER DEFAULT 3 CHECK(max_rounds BETWEEN 1 AND 3),
    passed INTEGER DEFAULT 0 CHECK(passed IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_records_concept ON learning_records(concept_id);
CREATE INDEX IF NOT EXISTS idx_records_created ON learning_records(created_at);
CREATE INDEX IF NOT EXISTS idx_records_result ON learning_records(result);
CREATE INDEX IF NOT EXISTS idx_records_concept_created ON learning_records(concept_id, created_at);

CREATE INDEX IF NOT EXISTS idx_progress_review ON concept_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_progress_level ON concept_progress(current_level);
CREATE INDEX IF NOT EXISTS idx_progress_created ON concept_progress(created_at);

CREATE INDEX IF NOT EXISTS idx_unknowns_explored ON unknown_unknowns(explored);
CREATE INDEX IF NOT EXISTS idx_unknowns_related ON unknown_unknowns(related_to);
CREATE INDEX IF NOT EXISTS idx_unknowns_appearances ON unknown_unknowns(appearances);
CREATE INDEX IF NOT EXISTS idx_unknowns_first_seen ON unknown_unknowns(first_seen);

CREATE INDEX IF NOT EXISTS idx_senior_session ON senior_mode_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_senior_concept ON senior_mode_rounds(concept_id);
`;

/**
 * Schema for initializing singleton tables (run after migrations)
 */
export const SCHEMA_INIT_SQL = `
-- Initialize singleton tables with default values
INSERT OR IGNORE INTO session_state (id, questions_today, consecutive_skips)
VALUES (1, 0, 0);

INSERT OR IGNORE INTO mode_state (id, senior_enabled, after_enabled)
VALUES (1, 1, 1);
`;

/**
 * Combined schema for backward compatibility
 * @deprecated Use SCHEMA_TABLES_SQL + migrations + SCHEMA_INIT_SQL
 */
export const SCHEMA_SQL = SCHEMA_TABLES_SQL;

/**
 * SQL to reset daily session state
 */
export const RESET_DAILY_STATE_SQL = `
UPDATE session_state
SET questions_today = 0,
    consecutive_skips = 0,
    last_reset_date = date('now')
WHERE id = 1 AND last_reset_date != date('now');
`;

/**
 * SQL to check if daily reset is needed
 */
export const CHECK_DAILY_RESET_SQL = `
SELECT last_reset_date FROM session_state WHERE id = 1;
`;
