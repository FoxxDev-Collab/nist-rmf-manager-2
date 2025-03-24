"use client";

import axios, { InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Types
export interface AssessmentData {
  organization: string
  assessor: string
  date: string
  status: string
  controls: Record<string, Record<string, ControlStatus>>
  score?: number
  completion?: number
  promotedControls?: string[] // Array of control IDs that have been promoted to risks
}

export interface ControlStatus {
  status: string
  notes?: string
}

export interface RiskData {
  impact: number
  likelihood: number
  risk_score: number
  notes?: string
  status?: string
  control_id?: string
  promoted_from?: {
    assessment_id: string
    control_id: string
    control_status: string
  }
}

export interface SecurityObjectiveData {
  description: string
  status: string
  priority: number
  progress?: number
  risk_notes?: string
  startDate?: string
  targetCompletionDate?: string
  actualCompletionDate?: string
  budget?: {
    allocated: number
    spent: number
    currency: string
  }
  milestones?: Array<{
    id: string
    title: string
    dueDate: string
    completed: boolean
  }>
  assignees?: string[]
  risk_id?: string
}

export interface InitiativeData {
  description: string
  status: string
  priority: number
  startDate?: string
  endDate?: string
}

export interface Client {
  id?: string
  name: string
  description?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  industry?: string
  size?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface Assessment {
  id?: string
  client_id?: string
  title: string
  description?: string
  data: AssessmentData
  created_at?: string
  updated_at?: string
}

export interface Risk {
  id?: string
  assessmentId: string
  title: string
  description?: string
  data: RiskData
  created_at?: string
  updated_at?: string
}

export interface SecurityObjective {
  id?: string
  client_id?: string
  title: string
  description?: string
  data: SecurityObjectiveData
  created_at?: string
  updated_at?: string
}

export interface Initiative {
  id?: string
  objectiveId: string
  title: string
  description?: string
  data: InitiativeData
  created_at?: string
  updated_at?: string
}

// Auth
export const auth = {
  login: async (passCode: string): Promise<string> => {
    const response = await api.post('/auth', { passCode })
    const token = response.data.token
    localStorage.setItem('auth_token', token)
    return token
  },

  logout: () => {
    localStorage.removeItem('auth_token')
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token')
  }
}

// Client service
export const clients = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/clients')
    return response.data
  },

  getById: async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`)
    return response.data
  },

  create: async (client: Omit<Client, 'id'>): Promise<Client> => {
    const response = await api.post('/clients', client)
    return response.data
  },

  update: async (id: string, client: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, client)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`)
  },
  
  getAssessments: async (id: string): Promise<Assessment[]> => {
    const response = await api.get(`/clients/${id}/assessments`)
    return response.data
  },
  
  createFromAssessment: async (assessmentId: string): Promise<{success: boolean, client: Client, message: string}> => {
    const response = await api.post(`/assessments/${assessmentId}/create-client`)
    return response.data
  }
}

// Assessments
export const assessments = {
  getAll: async (): Promise<Assessment[]> => {
    const response = await api.get('/assessments')
    return response.data
  },

  getById: async (id: string): Promise<Assessment> => {
    const response = await api.get(`/assessments/${id}`)
    return response.data
  },

  create: async (assessment: Omit<Assessment, 'id'>): Promise<Assessment> => {
    const response = await api.post('/assessments/import', assessment)
    return response.data
  },

  update: async (id: string, assessment: Partial<Assessment>): Promise<Assessment> => {
    const response = await api.put(`/assessments/${id}`, assessment)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assessments/${id}`)
  }
}

// Risks
export const risks = {
  getAll: async (assessmentId?: string): Promise<Risk[]> => {
    const response = await api.get('/risks', {
      params: { assessment: assessmentId }
    })
    return response.data
  },

  getById: async (id: string): Promise<Risk> => {
    const response = await api.get(`/risks/${id}`)
    return response.data
  },

  create: async (risk: Omit<Risk, 'id'>): Promise<Risk> => {
    const response = await api.post('/risks', risk)
    return response.data
  },

  update: async (id: string, risk: Partial<Risk>): Promise<Risk> => {
    const response = await api.put(`/risks/${id}`, risk);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/risks/${id}`)
  },

  promoteFromAssessment: async (assessmentId: string, riskData: Partial<Risk>): Promise<Risk> => {
    const response = await api.post(`/assessments/${assessmentId}/promote-risk`, riskData)
    return response.data
  }
}

// Security Objectives
export const objectives = {
  getAll: async (): Promise<SecurityObjective[]> => {
    const response = await api.get('/security-objectives')
    return response.data
  },

  getByClientId: async (clientId: string): Promise<SecurityObjective[]> => {
    const response = await api.get(`/clients/${clientId}/security-objectives`)
    return response.data
  },

  getById: async (id: string): Promise<SecurityObjective> => {
    const response = await api.get(`/security-objectives/${id}`)
    return response.data
  },

  create: async (objective: Omit<SecurityObjective, 'id'>): Promise<SecurityObjective> => {
    const response = await api.post('/security-objectives', objective)
    return response.data
  },

  update: async (id: string, objective: Partial<SecurityObjective>): Promise<SecurityObjective> => {
    const response = await api.put(`/security-objectives/${id}`, objective)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/security-objectives/${id}`)
  }
}

// Initiatives
export const initiatives = {
  getAll: async (objectiveId?: string): Promise<Initiative[]> => {
    const response = await api.get('/initiatives', {
      params: { objective: objectiveId }
    })
    return response.data
  },

  getById: async (id: string): Promise<Initiative> => {
    const response = await api.get(`/initiatives/${id}`)
    return response.data
  },

  create: async (initiative: Omit<Initiative, 'id'>): Promise<Initiative> => {
    const response = await api.post('/initiatives', initiative)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/initiatives/${id}`)
  }
}

const apiService = {
  auth,
  clients,
  assessments,
  risks,
  objectives,
  initiatives,
  // Migration utilities
  migrations: {
    fixObjectiveClientIds: async (): Promise<{message: string, count: number}> => {
      const response = await api.post('/migrate/objectives');
      return response.data;
    }
  }
}

export default apiService 