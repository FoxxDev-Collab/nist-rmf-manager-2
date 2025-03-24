import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { initializeDatabases } from './db/config'
import { assessmentService, riskService, objectiveService, initiativeService, clientService } from './db/services'
import { assessmentsDb } from './db/config'
import dotenv from 'dotenv'

dotenv.config()

// Types
interface AssessmentData {
  organization?: string;
  assessor?: string;
  date?: string;
  status?: string;
  controls?: Record<string, Record<string, any>>;
  score?: number;
  completion?: number;
  promotedControls?: string[];
}

interface Assessment {
  id?: string;
  client_id?: string;
  title?: string;
  description?: string;
  client_name?: string;
  organization_name?: string;
  assessor_name?: string;
  assessment_date?: string;
  status?: string;
  completion?: number;
  created_at: string;
  updated_at: string;
  overall_score: number | null;
  score?: number;
  controls?: any;
  original_data?: any;
  data?: AssessmentData;
}

interface RiskData {
  impact?: number;
  likelihood?: number;
  risk_score?: number;
  notes?: string;
  status?: string;
  control_id?: string;
  promoted_from?: {
    assessment_id: string;
    control_id: string;
    control_status: string;
  };
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
  client_id?: string
  title: string;
  description: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
  target_date?: string;
  created_at: string;
  updated_at: string;
  risks?: Risk[];
  initiatives?: Initiative[];
  data?: {
    status: string;
    priority: number;
    progress: number;
  };
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

interface Client {
  id?: string;
  name: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  size?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
    
    const title = assessment.title || 'Untitled Assessment'
    const description = assessment.description || ''
    const organization = assessment.data?.organization || assessment.organization_name || 'Unknown'
    
    // Handle the controls data properly - only use what's provided, don't add all control families
    let controlsData = {}
    if (assessment.data?.controls) {
      // Use only the controls provided in the assessment data
      controlsData = assessment.data.controls
    } else if (assessment.controls) {
      // Use the controls directly provided at the root level
      controlsData = assessment.controls
    }
    // Don't add any additional control families that weren't in the original data
    
    const assessor = assessment.data?.assessor || assessment.assessor_name || 'Unknown';
    const date = assessment.data?.date || assessment.assessment_date || now;
    const status = assessment.data?.status || assessment.status || 'In Progress';
    const score = assessment.data?.score || assessment.overall_score || assessment.score || 0;
    const completion = assessment.data?.completion || assessment.completion || 0;
    
    // Convert assessment from API schema to database schema
    const assessmentData = {
      id,
      client_id: assessment.client_id || undefined,
      title,
      description,
      data: {
        organization,
        assessor,
        date,
        status,
        score,
        completion,
        controls: controlsData
      },
      created_at: assessment.created_at || now,
      updated_at: now
    }
    
    console.log('Importing assessment with controls:', typeof controlsData, Array.isArray(controlsData) ? 'array' : 'object', Object.keys(controlsData).length);
    
    try {
      const result = assessmentService.create(assessmentData);
      return result;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  })
  .delete('/api/assessments/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    assessmentService.delete(params.id)
    return { success: true }
  })
  .put('/api/assessments/:id', async ({ params, body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const existingAssessment = assessmentService.getById(params.id)
    if (!existingAssessment) throw new Error('Assessment not found')
    
    // Type guard for the body
    if (typeof body !== 'object' || body === null) {
      throw new Error('Invalid request body')
    }
    
    const bodyData = (body as { data?: AssessmentData }).data || {}
    const existingData = (existingAssessment as Assessment).data || {}
    
    // Merge the existing data with the update
    const updatedAssessment: Assessment = {
      ...(existingAssessment as Assessment),
      ...(body as Partial<Assessment>),
      data: {
        ...existingData,
        ...bodyData
      },
      created_at: (existingAssessment as Assessment).created_at,
      updated_at: new Date().toISOString(),
      overall_score: (existingAssessment as Assessment).overall_score
    }
    
    return assessmentService.update(params.id, updatedAssessment)
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
    try {
      await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
      const assessment = assessmentService.getById(params.id)
      if (!assessment) throw new Error('Assessment not found')
      
      const riskData = body as Partial<Risk & { data?: RiskData }>
      const controlId = riskData.data?.control_id
      
      if (!controlId) {
        throw new Error('Control ID is required when promoting to risk')
      }
      
      // Check if this control has already been promoted to a risk
      const existingRisks = riskService.getAll(params.id)
      const existingPromotedRisk = existingRisks.find(risk => 
        risk.data?.control_id === controlId
      )
      
      if (existingPromotedRisk) {
        throw new Error('This control has already been promoted to a risk')
      }
      
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      
      // Extract impact and likelihood from the risk data
      const impact = riskData.data?.impact || 3
      const likelihood = riskData.data?.likelihood || 3
      const risk_score = impact * likelihood
      
      // Create the risk with proper data structure
      const risk = {
        id,
        assessmentId: params.id,
        title: riskData.title || 'Promoted Risk',
        description: riskData.description || '',
        data: {
          impact,
          likelihood,
          risk_score,
          notes: riskData.data?.notes || '',
          status: riskData.data?.status || 'New',
          control_id: controlId,
          promoted_from: {
            assessment_id: params.id,
            control_id: controlId,
            control_status: riskData.data?.status || 'Unknown'
          }
        },
        created_at: now,
        updated_at: now
      }
      
      // Create the risk
      const createdRisk = riskService.create(risk)
      
      // Update the assessment's promoted controls list
      const assessmentData = (assessment as Assessment).data || {}
      const promotedControls = assessmentData.promotedControls || []
      if (!promotedControls.includes(controlId)) {
        promotedControls.push(controlId)
        await assessmentService.update(params.id, {
          data: {
            ...assessmentData,
            promotedControls
          }
        })
      }
      
      return createdRisk
    } catch (error) {
      console.error('Error promoting risk:', error)
      throw error
    }
  })
  // Security Objectives
  .get('/api/security-objectives', async ({ headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return objectiveService.getAll()
  })
  .get('/api/clients/:id/security-objectives', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return objectiveService.getByClientId(params.id)
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
    
    // Ensure client_id is provided
    if (!objective.client_id) {
      throw new Error('client_id is required to create an objective')
    }
    
    // Convert objective from API schema to database schema
    const objectiveData = {
      id,
      client_id: objective.client_id,
      title: objective.title,
      description: objective.description || '',
      data: objective.data || {
        status: 'Planning',
        priority: 3,
        progress: 0
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
  .put('/api/security-objectives/:id', async ({ params, body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const objective = body as SecurityObjective
    const now = new Date().toISOString()
    
    // Convert objective from API schema to database schema
    const objectiveData = {
      client_id: objective.client_id,
      title: objective.title,
      description: objective.description || '',
      data: objective.data || {
        status: 'Planning',
        priority: 3,
        progress: 0
      },
      updated_at: now
    }
    
    return objectiveService.update(params.id, objectiveData)
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
  // Clients
  .get('/api/clients', async ({ headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return clientService.getAll()
  })
  .get('/api/clients/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const client = clientService.getById(params.id)
    if (!client) throw new Error('Client not found')
    return client
  })
  .post('/api/clients', async ({ body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const client = body as Client
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Convert client to database schema
    const clientData = {
      id,
      name: client.name,
      description: client.description || '',
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      industry: client.industry || '',
      size: client.size || '',
      notes: client.notes || '',
      created_at: client.created_at || now,
      updated_at: now
    }
    
    return clientService.create(clientData)
  })
  .put('/api/clients/:id', async ({ params, body, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    const client = body as Client
    
    // Convert client to database schema
    const clientData = {
      name: client.name,
      description: client.description || '',
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      industry: client.industry || '',
      size: client.size || '',
      notes: client.notes || '',
    }
    
    return clientService.update(params.id, clientData)
  })
  .delete('/api/clients/:id', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    clientService.delete(params.id)
    return { success: true }
  })
  .get('/api/clients/:id/assessments', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    return clientService.getAssessments(params.id)
  })
  // Create client from assessment endpoint
  .post('/api/assessments/:id/create-client', async ({ params, headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    
    // Get the assessment
    const assessment = assessmentService.getById(params.id)
    if (!assessment) throw new Error('Assessment not found')
    
    // Extract client info from assessment
    const assessmentData = (assessment as Assessment).data
    if (!assessmentData?.organization) throw new Error('Assessment has no organization data')
    
    const clientId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Create client
    const clientData = {
      id: clientId,
      name: assessmentData.organization,
      description: `Client created from assessment: ${(assessment as Assessment).title || 'Untitled'}`,
      created_at: now,
      updated_at: now
    }
    
    // Create the client
    clientService.create(clientData)
    
    // Update the assessment with the client_id
    assessmentService.update(params.id, { client_id: clientId })
    
    return { 
      success: true, 
      client: clientService.getById(clientId),
      message: `Client "${assessmentData.organization}" created and linked to assessment`
    }
  })
  // Migration endpoint to fix client_id associations for objectives
  .post('/api/migrate/objectives', async ({ headers, auth }) => {
    await auth.verifyToken(headers.authorization?.split(' ')[1] || '')
    
    // Get all objectives without client_id
    const allObjectives = objectiveService.getAll() as any[];
    const objectivesWithoutClient = allObjectives.filter(obj => !obj.client_id);
    
    if (objectivesWithoutClient.length === 0) {
      return { message: "No objectives found needing migration", count: 0 };
    }
    
    // Get all assessments with client_id
    const assessmentsWithClient = (assessmentService.getAll() as any[]).filter(a => a.client_id);
    
    if (assessmentsWithClient.length === 0) {
      return { message: "No assessments with client_id found for migration", count: 0 };
    }
    
    // Create default client if needed for orphaned objectives
    let defaultClientId = null;
    const clients = clientService.getAll() as any[];
    if (clients.length > 0) {
      defaultClientId = clients[0].id;
    } else {
      const clientId = crypto.randomUUID();
      const now = new Date().toISOString();
      const defaultClient = {
        id: clientId,
        name: "Default Client",
        description: "Default client created during migration",
        created_at: now,
        updated_at: now
      };
      clientService.create(defaultClient);
      defaultClientId = clientId;
    }
    
    // Update each objective
    let count = 0;
    for (const objective of objectivesWithoutClient) {
      // Try to find a client through risk -> assessment -> client chain
      let clientId = defaultClientId;
      
      // Prefer the first assessment's client
      if (assessmentsWithClient.length > 0) {
        clientId = assessmentsWithClient[0].client_id;
      }
      
      // Update the objective with the client_id
      objectiveService.update(objective.id, { client_id: clientId });
      count++;
    }
    
    return { 
      message: `Successfully migrated ${count} objectives with client associations`,
      count: count
    };
  })
  .listen(3001)

console.log(`🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`)