import { Database } from 'bun:sqlite'
import { mkdir } from 'node:fs/promises'

// Database paths
const DB_PATH = {
  ASSESSMENTS: './data/assessments.db',
  RISKS: './data/risks.db',
  OBJECTIVES: './data/objectives.db'
}

// Ensure data directory exists
try {
  await mkdir('./data', { recursive: true })
} catch (error) {
  console.error('Error creating data directory:', error)
}

// Create database instances
export const assessmentsDb = new Database(DB_PATH.ASSESSMENTS)
export const risksDb = new Database(DB_PATH.RISKS)
export const objectivesDb = new Database(DB_PATH.OBJECTIVES)

// Initialize tables
export function initializeDatabases() {
  // Assessments table
  assessmentsDb.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create index for faster assessment queries
  assessmentsDb.run(`
    CREATE INDEX IF NOT EXISTS idx_assessments_created_at 
    ON assessments(created_at DESC)
  `)

  // Risks table
  risksDb.run(`
    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for faster risk queries
  risksDb.run(`
    CREATE INDEX IF NOT EXISTS idx_risks_assessment_id 
    ON risks(assessment_id)
  `)
  
  risksDb.run(`
    CREATE INDEX IF NOT EXISTS idx_risks_created_at 
    ON risks(created_at DESC)
  `)

  // Security Objectives table
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS security_objectives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create index for faster objective queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_objectives_created_at 
    ON security_objectives(created_at DESC)
  `)

  // Initiatives table (in objectives database since they're related)
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY,
      objective_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for faster initiative queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_objective_id 
    ON initiatives(objective_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_created_at 
    ON initiatives(created_at DESC)
  `)
}