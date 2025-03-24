import { Database } from 'bun:sqlite'
import { mkdir } from 'node:fs/promises'

// Database paths
const DB_PATH = {
  CLIENTS: './data/clients.db',
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
export const clientsDb = new Database(DB_PATH.CLIENTS)
export const assessmentsDb = new Database(DB_PATH.ASSESSMENTS)
export const risksDb = new Database(DB_PATH.RISKS)
export const objectivesDb = new Database(DB_PATH.OBJECTIVES)

// Initialize tables
export function initializeDatabases() {
  // Clients table
  clientsDb.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      industry TEXT,
      size TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create index for faster client queries
  clientsDb.run(`
    CREATE INDEX IF NOT EXISTS idx_clients_created_at 
    ON clients(created_at DESC)
  `)

  // Assessments table - add client_id field
  assessmentsDb.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add client_id column if it doesn't exist yet (for migration purposes)
  try {
    assessmentsDb.run(`ALTER TABLE assessments ADD COLUMN client_id TEXT;`)
    console.log('Added client_id column to assessments table')
  } catch (error) {
    // Column might already exist, which is fine
    console.log('client_id column may already exist in assessments table')
  }

  // Create indexes for faster assessment queries
  assessmentsDb.run(`
    CREATE INDEX IF NOT EXISTS idx_assessments_created_at 
    ON assessments(created_at DESC)
  `)
  
  assessmentsDb.run(`
    CREATE INDEX IF NOT EXISTS idx_assessments_client_id 
    ON assessments(client_id)
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
      client_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add client_id column if it doesn't exist yet (for migration purposes)
  try {
    objectivesDb.run(`ALTER TABLE security_objectives ADD COLUMN client_id TEXT;`)
    console.log('Added client_id column to security_objectives table')
  } catch (error) {
    // Column might already exist, which is fine
    console.log('client_id column may already exist in security_objectives table')
  }

  // Create index for faster objective queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_objectives_created_at 
    ON security_objectives(created_at DESC)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_objectives_client_id 
    ON security_objectives(client_id)
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