-- Splitwise Clone Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color  VARCHAR(7) DEFAULT '#1F7A5C',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  group_type   VARCHAR(30) DEFAULT 'other', -- trip, home, couple, other
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id  INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Expenses. group_id is NULL for a one-on-one (non-group) expense between two friends.
CREATE TABLE IF NOT EXISTS expenses (
  id           SERIAL PRIMARY KEY,
  group_id     INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  description  VARCHAR(255) NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  currency     VARCHAR(10) DEFAULT 'INR',
  category     VARCHAR(50) DEFAULT 'General',
  split_type   VARCHAR(20) DEFAULT 'equal', -- equal, exact, percentage, shares
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Who paid, and how much, for each expense (supports multiple payers)
CREATE TABLE IF NOT EXISTS expense_payers (
  id          SERIAL PRIMARY KEY,
  expense_id  INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount_paid NUMERIC(12,2) NOT NULL
);

-- Who owes how much for each expense
CREATE TABLE IF NOT EXISTS expense_splits (
  id           SERIAL PRIMARY KEY,
  expense_id   INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount_owed  NUMERIC(12,2) NOT NULL
);

-- Settlements ("I paid you back")
CREATE TABLE IF NOT EXISTS settlements (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  from_user   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  to_user     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  note        VARCHAR(255),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_user ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_payers_expense ON expense_payers(expense_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);
