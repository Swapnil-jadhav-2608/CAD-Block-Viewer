-- database/schema.sql
CREATE TABLE IF NOT EXISTS "Files" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Blocks" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  coordinates JSONB,
  properties JSONB,
  "FileId" INTEGER REFERENCES "Files"(id)
);