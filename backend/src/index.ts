import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { initializeDatabases } from './db/config'
import { assessmentService, riskService, objectiveService, initiativeService } from './db/services'
import { assessmentsDb } from './db/config'
import dotenv from 'dotenv'

dotenv.config()

// Types
interface Assessment {
  id?: string
  client_name: string;        // For backward compatibility
  organization_name?: string;  // New field name
  assessor_name?: string;
  assessment_date?: string;
  status?: string;
  completion?: number;
  created_at: string;
  updated_at: string;
  overall_score: number | null; // For backward compatibility
  score?: number;  
  controls?: any;
  original_data?: any;
  data?: any;
}

interface Risk {
  id?: string
  assessmentId: string;
  control_id: string;
  title: string;
  description: string;
  status: 'New' | 'In Review' | 'Accepted' | 'Mitigated' | 'Transferred' | 'Avoided' | 'Closed';
  impact: number;
  likelihood: number;
  risk_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  objectives?: SecurityObjective[];
}

interface SecurityObjective {
  id?: string
  title: string;
  description: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
  target_date?: string;
  created_at: string;
  updated_at: string;
  risks?: Risk[];
  initiatives?: Initiative[];
}

interface Initiative {
  id?: string
  objective_id: string;
  title: string;
  description: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold';
  start_date?: string;
  end_date?: string;
  owner?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  objective?: SecurityObjective;
}

const PASS_CODE = process.env.PASS_CODE || 'your-secure-pass-code'

// Initialize databases
initializeDatabases()

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .derive(({ jwt }) => ({
    auth: {
      verifyPassCode: async (passCode: string): Promise<string> => {
        if (passCode !== PASS_CODE) {
          throw new Error('Invalid pass code')
        }
        return await jwt.sign({ authenticated: 'true', timestamp: Date.now() })
      },
      verifyToken: async (token: string) => {
        return await jwt.verify(token)
      }
    }
  }))
  // Authentication
  .post('/api/auth', async ({ body, auth }): Promise<{ token: string }> => {
    const { passCode } = body as { passCode: string }
    const token = await auth.verifyPassCode(passCode)
    return { token }
  })
  // Assessment Management
  .get('/api/assessments', async ({ headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return assessmentService.getAll()
  })
  .get('/api/assessments/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const assessment = assessmentService.getById(params.id)
    if (!assessment) throw new Error('Assessment not found')
    return assessment
  })
  // Debug endpoint
  .get('/api/debug/assessment/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const assessment = assessmentService.getById(params.id) as any;
    
    if (!assessment) {
      return { error: 'Assessment not found' };
    }
    
    // Return useful debug information
    return {
      assessmentId: params.id,
      assessment,
      hasControls: assessment.data && assessment.data.controls ? true : false,
      controlsKeys: assessment.data && assessment.data.controls ? Object.keys(assessment.data.controls) : [],
      controlsCount: assessment.data && assessment.data.controls ? Object.keys(assessment.data.controls).length : 0
    };
  })
  .post('/api/assessments/import', async ({ body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const assessment = body as Assessment
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Extract controls data directly from the request body or from the original_data
    let controlsData = assessment.controls || 
                        assessment.original_data?.controls || 
                        assessment.data?.controls;
    
    // Add some default controls data for testing if none exists
    if (!controlsData || Object.keys(controlsData).length === 0) {
      console.log('No controls data found in import, adding sample controls data');
      controlsData = {
        "NIST.800-53.AC-1": {
          "AC-1.a": { "status": "Implemented", "notes": "Sample control data" },
          "AC-1.b": { "status": "Planned", "notes": "This is a test" }
        },
        "NIST.800-53.AC-2": {
          "AC-2.a": { "status": "Not Implemented", "notes": "Test data" }
        }
      };
    } else {
      console.log('Found controls data with keys:', Object.keys(controlsData));
    }
    
    // Convert assessment from API schema to database schema
    const assessmentData = {
      id,
      title: assessment.organization_name || assessment.client_name,
      description: `Assessment by ${assessment.assessor_name || 'Unknown'} on ${assessment.assessment_date || now}`,
      data: {
        organization: assessment.organization_name || assessment.client_name,
        assessor: assessment.assessor_name || 'Unknown',
        date: assessment.assessment_date || now,
        status: assessment.status || 'In Progress',
        score: assessment.overall_score || assessment.score,
        completion: assessment.completion || 0,
        controls: controlsData
      },
      created_at: assessment.created_at || now,
      updated_at: now
    }
    
    console.log('Importing assessment with controls:', typeof controlsData, Array.isArray(controlsData) ? 'array' : 'object', Object.keys(controlsData).length);
    
    return assessmentService.create(assessmentData)
  })
  .delete('/api/assessments/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    assessmentService.delete(params.id)
    return { success: true }
  })
  // Risk Management
  .get('/api/risks', async ({ query, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return riskService.getAll(query.assessment as string)
  })
  .get('/api/risks/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const risk = riskService.getById(params.id)
    if (!risk) throw new Error('Risk not found')
    return risk
  })
  .post('/api/risks', async ({ body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const risk = body as Risk
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Extract impact and likelihood, defaulting to 3 if not provided
    const impact = risk.impact || 3
    const likelihood = risk.likelihood || 3
    // Calculate risk score as impact * likelihood
    const risk_score = impact * likelihood
    
    // Convert risk from API schema to database schema
    const riskData = {
      id,
      assessmentId: risk.assessmentId,
      title: risk.title,
      description: risk.description || '',
      data: {
        impact,
        likelihood,
        risk_score,
        notes: risk.notes || ''
      },
      created_at: risk.created_at || now,
      updated_at: now
    }
    
    return riskService.create(riskData)
  })
  .put('/api/risks/:id', async ({ params, body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const risk = body as Partial<Risk & { data?: { impact?: number, likelihood?: number, notes?: string } }>
    
    // Extract impact and likelihood if provided
    let data = undefined;
    
    if (risk.data) {
      const impact = risk.data.impact || 3
      const likelihood = risk.data.likelihood || 3
      // Calculate risk score as impact * likelihood
      const risk_score = impact * likelihood
      
      data = {
        ...risk.data,
        impact,
        likelihood,
        risk_score
      }
    }
    
    // Update the risk
    const updatedData = {
      title: risk.title,
      description: risk.description,
      data
    }
    
    const updatedRisk = riskService.update(params.id, updatedData)
    if (!updatedRisk) throw new Error('Risk not found or update failed')
    
    return updatedRisk
  })
  .delete('/api/risks/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    riskService.delete(params.id)
    return { success: true }
  })
  .post('/api/assessments/:id/promote-risk', async ({ params, body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const assessment = assessmentService.getById(params.id)
    if (!assessment) throw new Error('Assessment not found')
    const riskData = body as Partial<Risk>
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Extract impact and likelihood, defaulting to 3 if not provided
    const impact = riskData.impact || 3
    const likelihood = riskData.likelihood || 3
    // Calculate risk score as impact * likelihood
    const risk_score = impact * likelihood
    
    const risk = {
      id,
      assessmentId: params.id,
      title: riskData.title || 'Promoted Risk',
      description: riskData.description || '',
      data: {
        impact,
        likelihood,
        risk_score,
        notes: riskData.notes || '',
        status: riskData.status || 'New',
        control_id: riskData.control_id || 'CTRL-UNKNOWN'
      },
      created_at: now,
      updated_at: now
    }
    return riskService.create(risk)
  })
  // Security Objectives
  .get('/api/security-objectives', async ({ headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return objectiveService.getAll()
  })
  .get('/api/security-objectives/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const objective = objectiveService.getById(params.id)
    if (!objective) throw new Error('Security objective not found')
    return objective
  })
  .post('/api/security-objectives', async ({ body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const objective = body as SecurityObjective
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Convert objective from API schema to database schema
    const objectiveData = {
      id,
      title: objective.title,
      description: objective.description || '',
      data: {
        status: objective.status || 'New',
        target_date: objective.target_date || '',
        description: objective.description || ''
      },
      created_at: objective.created_at || now,
      updated_at: now
    }
    
    return objectiveService.create(objectiveData)
  })
  .delete('/api/security-objectives/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    objectiveService.delete(params.id)
    return { success: true }
  })
  // Initiatives
  .get('/api/initiatives', async ({ query, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return initiativeService.getAll(query.objective as string)
  })
  .get('/api/initiatives/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const initiative = initiativeService.getById(params.id)
    if (!initiative) throw new Error('Initiative not found')
    return initiative
  })
  .post('/api/initiatives', async ({ body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const initiative = body as Initiative
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Convert initiative from API schema to database schema
    const initiativeData = {
      id,
      objectiveId: initiative.objective_id,
      title: initiative.title,
      description: initiative.description || '',
      data: {
        status: initiative.status || 'New',
        start_date: initiative.start_date || '',
        end_date: initiative.end_date || '',
        owner: initiative.owner || '',
        progress: initiative.progress || 0
      },
      created_at: initiative.created_at || now,
      updated_at: now
    }
    
    return initiativeService.create(initiativeData)
  })
  .delete('/api/initiatives/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    initiativeService.delete(params.id)
    return { success: true }
  })
  .listen(3001)

console.log(`🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`)