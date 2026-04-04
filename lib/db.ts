import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'eios.db')

let db: Database.Database | null = null

export function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nodeId TEXT NOT NULL,
      util REAL,
      tempC REAL,
      tokensPerSec REAL,
      memUsedGB REAL,
      memTotalGB REAL,
      powerW REAL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      nodeId TEXT NOT NULL,
      customerId TEXT NOT NULL,
      severity TEXT NOT NULL,
      anomaly TEXT NOT NULL,
      decision TEXT,
      rca TEXT,
      resolvedAt INTEGER,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding BLOB
    );
  `)
}

export function logMetrics(metrics: {
  nodeId: string
  util: number
  tempC: number
  tokensPerSec: number
  memUsedGB: number
  memTotalGB: number
  powerW: number
  timestamp: number
}) {
  const db = getDB()
  db.prepare(`
    INSERT INTO metrics_log (nodeId, util, tempC, tokensPerSec, memUsedGB, memTotalGB, powerW, timestamp)
    VALUES (@nodeId, @util, @tempC, @tokensPerSec, @memUsedGB, @memTotalGB, @powerW, @timestamp)
  `).run(metrics)
}

export function getRecentMetrics(nodeId: string, limit = 12) {
  const db = getDB()
  return db.prepare(`
    SELECT * FROM metrics_log
    WHERE nodeId = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(nodeId, limit)
}

export function writeIncident(incident: {
  id: string
  nodeId: string
  customerId: string
  severity: string
  anomaly: string
  decision?: string
  rca?: string
}) {
  const db = getDB()
  db.prepare(`
    INSERT OR REPLACE INTO incidents (id, nodeId, customerId, severity, anomaly, decision, rca, timestamp)
    VALUES (@id, @nodeId, @customerId, @severity, @anomaly, @decision, @rca, @timestamp)
  `).run({ ...incident, timestamp: Date.now() })
}

export function getIncidents(limit = 20) {
  const db = getDB()
  return db.prepare(`
    SELECT * FROM incidents
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit)
}

export function getNodeTrend(nodeId: string) {
  const db = getDB()
  const oneHourAgo = Date.now() - 3600000
  return db.prepare(`
    SEL