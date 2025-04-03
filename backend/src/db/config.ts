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
      status TEXT DEFAULT 'Active', -- Active, Inactive, Prospective
      assigned_consultant TEXT,
      contract_status TEXT, -- Active, Expired, Negotiating, etc.
      service_level TEXT, -- Standard, Premium, etc.
      compliance_targets TEXT, -- JSON or comma-separated list of compliance frameworks
      last_review_date DATETIME,
      next_review_date DATETIME,
      onboarding_date DATETIME,
      client_success_score INTEGER, -- 0-100 score for client satisfaction/success
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
      source_risk_id TEXT, -- Link to the originating risk
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

  // Add source_risk_id column if it doesn't exist yet (for migration purposes)
  try {
    objectivesDb.run(`ALTER TABLE security_objectives ADD COLUMN source_risk_id TEXT;`)
    console.log('Added source_risk_id column to security_objectives table')
  } catch (error) {
    // Column might already exist, which is fine
    console.log('source_risk_id column may already exist in security_objectives table')
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

  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_objectives_source_risk_id 
    ON security_objectives(source_risk_id)
  `)

  // Initiatives table (in objectives database since they're related)
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY,
      objective_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Blocked, Deferred
      priority TEXT DEFAULT 'Medium', -- High, Medium, Low
      assigned_to TEXT, -- Person responsible
      start_date DATETIME,
      due_date DATETIME,
      completion_percentage INTEGER DEFAULT 0,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add new columns to initiatives if they don't exist yet (for migration purposes)
  try {
    objectivesDb.run(`ALTER TABLE initiatives ADD COLUMN status TEXT DEFAULT 'Not Started';`)
    objectivesDb.run(`ALTER TABLE initiatives ADD COLUMN priority TEXT DEFAULT 'Medium';`)
    objectivesDb.run(`ALTER TABLE initiatives ADD COLUMN assigned_to TEXT;`)
    objectivesDb.run(`ALTER TABLE initiatives ADD COLUMN start_date DATETIME;`)
    objectivesDb.run(`ALTER TABLE initiatives ADD COLUMN due_date DATETIME;`)
    objectivesDb.run(`ALTER TABLE initiatives ADD COLUMN completion_percentage INTEGER DEFAULT 0;`)
    console.log('Added project management columns to initiatives table')
  } catch (error) {
    // Columns might already exist, which is fine
    console.log('Some project management columns may already exist in initiatives table')
  }

  // Create indexes for faster initiative queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_objective_id 
    ON initiatives(objective_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_created_at 
    ON initiatives(created_at DESC)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_status 
    ON initiatives(status)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_due_date 
    ON initiatives(due_date)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_initiatives_assigned_to 
    ON initiatives(assigned_to)
  `)

  // Milestones table (in objectives database since they're related to initiatives)
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      initiative_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Blocked, Deferred
      priority TEXT DEFAULT 'Medium', -- High, Medium, Low
      assigned_to TEXT, -- Person responsible
      start_date DATETIME,
      due_date DATETIME,
      completion_percentage INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0, -- For ordering milestones within an initiative
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for faster milestone queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_milestones_initiative_id 
    ON milestones(initiative_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_milestones_created_at 
    ON milestones(created_at DESC)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_milestones_status 
    ON milestones(status)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_milestones_due_date 
    ON milestones(due_date)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_milestones_order_index 
    ON milestones(order_index)
  `)

  // Tasks table (for more granular work items within milestones)
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      milestone_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Blocked, Deferred
      priority TEXT DEFAULT 'Medium', -- High, Medium, Low
      assigned_to TEXT, -- Person responsible
      start_date DATETIME,
      due_date DATETIME,
      estimated_hours REAL,
      actual_hours REAL,
      order_index INTEGER DEFAULT 0, -- For ordering tasks within a milestone
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for faster task queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id 
    ON tasks(milestone_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status 
    ON tasks(status)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
    ON tasks(due_date)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
    ON tasks(assigned_to)
  `)

  // Comments table (for discussions on objectives, initiatives, milestones, and tasks)
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      parent_type TEXT NOT NULL, -- 'objective', 'initiative', 'milestone', or 'task'
      parent_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for faster comment queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_parent 
    ON comments(parent_type, parent_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_user_id 
    ON comments(user_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_created_at 
    ON comments(created_at DESC)
  `)

  // Attachments table (for files attached to objectives, initiatives, milestones, and tasks)
  objectivesDb.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      parent_type TEXT NOT NULL, -- 'objective', 'initiative', 'milestone', or 'task'
      parent_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for faster attachment queries
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_attachments_parent 
    ON attachments(parent_type, parent_id)
  `)
  
  objectivesDb.run(`
    CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by 
    ON attachments(uploaded_by)
  `)
}