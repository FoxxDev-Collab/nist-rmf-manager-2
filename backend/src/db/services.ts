import { assessmentsDb, risksDb, objectivesDb, clientsDb } from './config'

// Client Services
export const clientService = {
  getAll: () => {
    return clientsDb.query('SELECT * FROM clients ORDER BY name ASC').all();
  },

  getById: (id: string) => {
    return clientsDb.query('SELECT * FROM clients WHERE id = ?').get(id);
  },

  create: (client: { 
    id: string; 
    name: string; 
    description?: string; 
    contact_name?: string; 
    contact_email?: string; 
    contact_phone?: string; 
    industry?: string; 
    size?: string; 
    status?: string;
    assigned_consultant?: string;
    contract_status?: string;
    service_level?: string;
    compliance_targets?: string;
    last_review_date?: string;
    next_review_date?: string;
    onboarding_date?: string;
    client_success_score?: number;
    notes?: string; 
    created_at: string; 
    updated_at: string 
  }) => {
    const { 
      id, name, description, contact_name, contact_email, contact_phone, 
      industry, size, status, assigned_consultant, contract_status, service_level,
      compliance_targets, last_review_date, next_review_date, onboarding_date,
      client_success_score, notes, created_at, updated_at 
    } = client
    clientsDb.run(
      `INSERT INTO clients (
        id, name, description, contact_name, contact_email, contact_phone, 
        industry, size, status, assigned_consultant, contract_status, service_level,
        compliance_targets, last_review_date, next_review_date, onboarding_date,
        client_success_score, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        id, name, description || null, contact_name || null, contact_email || null, 
        contact_phone || null, industry || null, size || null, status || 'Active',
        assigned_consultant || null, contract_status || null, service_level || null,
        compliance_targets || null, last_review_date || null, next_review_date || null,
        onboarding_date || null, client_success_score || null, notes || null,
        created_at, updated_at
      ]
    )
    return client
  },

  update: (id: string, client: { 
    name?: string; 
    description?: string; 
    contact_name?: string; 
    contact_email?: string; 
    contact_phone?: string; 
    industry?: string; 
    size?: string; 
    status?: string;
    assigned_consultant?: string;
    contract_status?: string;
    service_level?: string;
    compliance_targets?: string;
    last_review_date?: string;
    next_review_date?: string;
    onboarding_date?: string;
    client_success_score?: number;
    notes?: string;
  }) => {
    const { 
      name, description, contact_name, contact_email, contact_phone, 
      industry, size, status, assigned_consultant, contract_status, service_level,
      compliance_targets, last_review_date, next_review_date, onboarding_date,
      client_success_score, notes
    } = client
    const updates: string[] = []
    const values: any[] = []

    if (name) {
      updates.push('name = ?')
      values.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (contact_name !== undefined) {
      updates.push('contact_name = ?')
      values.push(contact_name)
    }
    if (contact_email !== undefined) {
      updates.push('contact_email = ?')
      values.push(contact_email)
    }
    if (contact_phone !== undefined) {
      updates.push('contact_phone = ?')
      values.push(contact_phone)
    }
    if (industry !== undefined) {
      updates.push('industry = ?')
      values.push(industry)
    }
    if (size !== undefined) {
      updates.push('size = ?')
      values.push(size)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    if (assigned_consultant !== undefined) {
      updates.push('assigned_consultant = ?')
      values.push(assigned_consultant)
    }
    if (contract_status !== undefined) {
      updates.push('contract_status = ?')
      values.push(contract_status)
    }
    if (service_level !== undefined) {
      updates.push('service_level = ?')
      values.push(service_level)
    }
    if (compliance_targets !== undefined) {
      updates.push('compliance_targets = ?')
      values.push(compliance_targets)
    }
    if (last_review_date !== undefined) {
      updates.push('last_review_date = ?')
      values.push(last_review_date)
    }
    if (next_review_date !== undefined) {
      updates.push('next_review_date = ?')
      values.push(next_review_date)
    }
    if (onboarding_date !== undefined) {
      updates.push('onboarding_date = ?')
      values.push(onboarding_date)
    }
    if (client_success_score !== undefined) {
      updates.push('client_success_score = ?')
      values.push(client_success_score)
    }
    if (notes !== undefined) {
      updates.push('notes = ?')
      values.push(notes)
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      clientsDb.run(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return clientService.getById(id)
  },

  delete: (id: string) => {
    clientsDb.run('DELETE FROM clients WHERE id = ?', [id])
  },
  
  getAssessments: (clientId: string) => {
    const assessments = assessmentsDb.query('SELECT * FROM assessments WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    // Parse the JSON data string for each assessment
    return assessments.map((assessment: any) => {
      if (assessment && assessment.data && typeof assessment.data === 'string') {
        try {
          assessment.data = JSON.parse(assessment.data);
        } catch (e) {
          console.error('Error parsing assessment data:', e);
        }
      }
      return assessment;
    });
  }
}

// Assessment Services
export const assessmentService = {
  getAll: () => {
    const assessments = assessmentsDb.query('SELECT * FROM assessments ORDER BY created_at DESC').all();
    // Parse the JSON data string for each assessment
    return assessments.map((assessment: any) => {
      if (assessment && assessment.data && typeof assessment.data === 'string') {
        try {
          assessment.data = JSON.parse(assessment.data);
        } catch (e) {
          console.error('Error parsing assessment data:', e);
        }
      }
      return assessment;
    });
  },

  getById: (id: string) => {
    const assessment = assessmentsDb.query('SELECT * FROM assessments WHERE id = ?').get(id);
    if (assessment && typeof assessment === 'object' && 'data' in assessment && typeof assessment.data === 'string') {
      try {
        (assessment as any).data = JSON.parse(assessment.data);
      } catch (e) {
        console.error('Error parsing assessment data:', e);
      }
    }
    return assessment;
  },

  create: (assessment: { id: string; client_id?: string; title: string; description?: string; data: any; created_at: string; updated_at: string }) => {
    const { id, client_id, title, description, data, created_at, updated_at } = assessment
    
    // Validate data structure
    let validatedData = { ...data };
    
    // Ensure controls exist
    if (!validatedData.controls || typeof validatedData.controls !== 'object') {
      console.warn('Creating assessment with empty controls object');
      validatedData.controls = {};
    }
    
    // Ensure all required fields exist
    if (!validatedData.organization) validatedData.organization = 'Unknown';
    if (!validatedData.assessor) validatedData.assessor = 'Unknown';
    if (!validatedData.date) validatedData.date = new Date().toISOString();
    if (!validatedData.status) validatedData.status = 'In Progress';
    if (validatedData.score === undefined) validatedData.score = 0;
    if (validatedData.completion === undefined) validatedData.completion = 0;
    
    console.log(`Saving assessment with controls: ${Object.keys(validatedData.controls).length} control families`);
    
    // Stringify the data for storage
    const dataJson = JSON.stringify(validatedData);
    
    assessmentsDb.run(
      'INSERT INTO assessments (id, client_id, title, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, client_id || null, title, description || null, dataJson, created_at, updated_at]
    )
    
    // Confirm what was stored in the database
    const storedAssessment = assessmentsDb.query('SELECT * FROM assessments WHERE id = ?').get(id);
    if (storedAssessment) {
      try {
        const storedData = JSON.parse((storedAssessment as any).data);
        console.log('Stored assessment controls:', 
          storedData.controls ? `${Object.keys(storedData.controls).length} control families` : 'No controls');
      } catch (e) {
        console.error('Error parsing stored assessment data:', e);
      }
    }
    
    return { ...assessment, data: validatedData };
  },

  update: (id: string, assessment: { client_id?: string; title?: string; description?: string; data?: any }) => {
    const { client_id, title, description, data } = assessment
    const updates: string[] = []
    const values: any[] = []

    if (client_id !== undefined) {
      updates.push('client_id = ?')
      values.push(client_id)
    }
    if (title) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (data) {
      updates.push('data = ?')
      values.push(JSON.stringify(data))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      assessmentsDb.run(
        `UPDATE assessments SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return assessmentService.getById(id)
  },

  delete: (id: string) => {
    assessmentsDb.run('DELETE FROM assessments WHERE id = ?', [id])
  }
}

// Risk Services
export const riskService = {
  getAll: (assessmentId?: string) => {
    let risks;
    if (assessmentId) {
      risks = risksDb.query('SELECT * FROM risks WHERE assessment_id = ? ORDER BY created_at DESC').all(assessmentId);
    } else {
      risks = risksDb.query('SELECT * FROM risks ORDER BY created_at DESC').all();
    }
    
    // Parse the JSON data string for each risk
    return risks.map((risk: any) => {
      if (risk && risk.data && typeof risk.data === 'string') {
        try {
          risk.data = JSON.parse(risk.data);
        } catch (e) {
          console.error('Error parsing risk data:', e);
        }
      }
      return risk;
    });
  },

  getById: (id: string) => {
    const risk = risksDb.query('SELECT * FROM risks WHERE id = ?').get(id);
    if (risk && typeof risk === 'object' && 'data' in risk && typeof risk.data === 'string') {
      try {
        (risk as any).data = JSON.parse(risk.data);
      } catch (e) {
        console.error('Error parsing risk data:', e);
      }
    }
    return risk;
  },

  create: (risk: { id: string; assessmentId: string; title: string; description?: string; data: any; created_at: string; updated_at: string }) => {
    const { id, assessmentId, title, description, data, created_at, updated_at } = risk
    risksDb.run(
      'INSERT INTO risks (id, assessment_id, title, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, assessmentId, title, description || null, JSON.stringify(data), created_at, updated_at]
    )
    return risk
  },

  update: (id: string, risk: { title?: string; description?: string; data?: any }) => {
    const { title, description, data } = risk
    const updates: string[] = []
    const values: any[] = []

    if (title) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description) {
      updates.push('description = ?')
      values.push(description)
    }
    if (data) {
      updates.push('data = ?')
      values.push(JSON.stringify(data))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      risksDb.run(
        `UPDATE risks SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return riskService.getById(id)
  },

  delete: (id: string) => {
    risksDb.run('DELETE FROM risks WHERE id = ?', [id])
  }
}

// Security Objective Services
export const objectiveService = {
  getAll: () => {
    return objectivesDb.query('SELECT * FROM security_objectives ORDER BY created_at DESC').all()
  },

  getByClientId: (clientId: string) => {
    return objectivesDb.query('SELECT * FROM security_objectives WHERE client_id = ? ORDER BY created_at DESC').all(clientId)
  },

  getById: (id: string) => {
    return objectivesDb.query('SELECT * FROM security_objectives WHERE id = ?').get(id)
  },

  getByRiskId: (riskId: string) => {
    return objectivesDb.query('SELECT * FROM security_objectives WHERE source_risk_id = ? ORDER BY created_at DESC').all(riskId)
  },

  create: (objective: { id: string; client_id: string; source_risk_id?: string; title: string; description?: string; data: any; created_at: string; updated_at: string }) => {
    const { id, client_id, source_risk_id, title, description, data, created_at, updated_at } = objective
    objectivesDb.run(
      'INSERT INTO security_objectives (id, client_id, source_risk_id, title, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, client_id, source_risk_id || null, title, description || null, JSON.stringify(data), created_at, updated_at]
    )
    return objective
  },

  update: (id: string, objective: { client_id?: string; source_risk_id?: string; title?: string; description?: string; data?: any }) => {
    const { client_id, source_risk_id, title, description, data } = objective
    const updates: string[] = []
    const values: any[] = []

    if (client_id) {
      updates.push('client_id = ?')
      values.push(client_id)
    }
    if (source_risk_id !== undefined) {
      updates.push('source_risk_id = ?')
      values.push(source_risk_id)
    }
    if (title) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description) {
      updates.push('description = ?')
      values.push(description)
    }
    if (data) {
      updates.push('data = ?')
      values.push(JSON.stringify(data))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      objectivesDb.run(
        `UPDATE security_objectives SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return objectiveService.getById(id)
  },

  delete: (id: string) => {
    objectivesDb.run('DELETE FROM security_objectives WHERE id = ?', [id])
  }
}

// Initiative Services
export const initiativeService = {
  getAll: (objectiveId?: string) => {
    if (objectiveId) {
      return objectivesDb.query('SELECT * FROM initiatives WHERE objective_id = ? ORDER BY created_at DESC').all(objectiveId)
    }
    return objectivesDb.query('SELECT * FROM initiatives ORDER BY created_at DESC').all()
  },

  getById: (id: string) => {
    return objectivesDb.query('SELECT * FROM initiatives WHERE id = ?').get(id)
  },

  create: (initiative: { 
    id: string; 
    objectiveId: string; 
    title: string; 
    description?: string; 
    status?: string;
    priority?: string;
    assigned_to?: string;
    start_date?: string;
    due_date?: string;
    completion_percentage?: number;
    data: any; 
    created_at: string; 
    updated_at: string 
  }) => {
    const { 
      id, 
      objectiveId, 
      title, 
      description, 
      status, 
      priority, 
      assigned_to, 
      start_date, 
      due_date, 
      completion_percentage, 
      data, 
      created_at, 
      updated_at 
    } = initiative
    
    objectivesDb.run(
      `INSERT INTO initiatives (
        id, 
        objective_id, 
        title, 
        description, 
        status, 
        priority, 
        assigned_to, 
        start_date, 
        due_date, 
        completion_percentage, 
        data, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        objectiveId, 
        title, 
        description || null, 
        status || 'Not Started', 
        priority || 'Medium', 
        assigned_to || null, 
        start_date || null, 
        due_date || null, 
        completion_percentage || 0, 
        JSON.stringify(data), 
        created_at, 
        updated_at
      ]
    )
    
    return initiative
  },

  update: (id: string, initiative: { 
    title?: string; 
    description?: string; 
    status?: string;
    priority?: string;
    assigned_to?: string;
    start_date?: string;
    due_date?: string;
    completion_percentage?: number;
    data?: any 
  }) => {
    const { 
      title, 
      description, 
      status, 
      priority, 
      assigned_to, 
      start_date, 
      due_date, 
      completion_percentage, 
      data 
    } = initiative
    
    const updates: string[] = []
    const values: any[] = []

    if (title) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      values.push(priority)
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?')
      values.push(assigned_to)
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?')
      values.push(start_date)
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?')
      values.push(due_date)
    }
    if (completion_percentage !== undefined) {
      updates.push('completion_percentage = ?')
      values.push(completion_percentage)
    }
    if (data) {
      updates.push('data = ?')
      values.push(JSON.stringify(data))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      objectivesDb.run(
        `UPDATE initiatives SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return initiativeService.getById(id)
  },

  delete: (id: string) => {
    objectivesDb.run('DELETE FROM initiatives WHERE id = ?', [id])
  }
}

// Milestone Services
export const milestoneService = {
  getAll: (initiativeId?: string) => {
    if (initiativeId) {
      return objectivesDb.query('SELECT * FROM milestones WHERE initiative_id = ? ORDER BY order_index ASC, created_at ASC').all(initiativeId)
    }
    return objectivesDb.query('SELECT * FROM milestones ORDER BY created_at DESC').all()
  },

  getById: (id: string) => {
    return objectivesDb.query('SELECT * FROM milestones WHERE id = ?').get(id)
  },

  create: (milestone: { 
    id: string; 
    initiativeId: string; 
    title: string; 
    description?: string; 
    status?: string;
    priority?: string;
    assigned_to?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    completion_percentage?: number;
    order_index?: number;
    data?: any; 
    created_at: string; 
    updated_at: string 
  }) => {
    const { 
      id, 
      initiativeId, 
      title, 
      description, 
      status, 
      priority, 
      assigned_to, 
      start_date, 
      due_date, 
      completion_percentage, 
      order_index,
      data, 
      created_at, 
      updated_at 
    } = milestone
    
    objectivesDb.run(
      `INSERT INTO milestones (
        id, 
        initiative_id, 
        title, 
        description, 
        status, 
        priority, 
        assigned_to, 
        start_date, 
        due_date, 
        completion_percentage,
        order_index, 
        data, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        initiativeId, 
        title, 
        description || null, 
        status || 'Not Started', 
        priority || 'Medium', 
        assigned_to || null, 
        start_date || null, 
        due_date || null, 
        completion_percentage || 0,
        order_index || 0, 
        JSON.stringify(data || {}), 
        created_at, 
        updated_at
      ]
    )
    
    return milestone
  },

  update: (id: string, milestone: { 
    title?: string; 
    description?: string; 
    status?: string;
    priority?: string;
    assigned_to?: string;
    start_date?: string;
    due_date?: string;
    completion_percentage?: number;
    order_index?: number;
    data?: any 
  }) => {
    const { 
      title, 
      description, 
      status, 
      priority, 
      assigned_to, 
      start_date, 
      due_date, 
      completion_percentage,
      order_index, 
      data 
    } = milestone
    
    const updates: string[] = []
    const values: any[] = []

    if (title) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      values.push(priority)
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?')
      values.push(assigned_to)
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?')
      values.push(start_date)
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?')
      values.push(due_date)
    }
    if (completion_percentage !== undefined) {
      updates.push('completion_percentage = ?')
      values.push(completion_percentage)
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?')
      values.push(order_index)
    }
    if (data) {
      updates.push('data = ?')
      values.push(JSON.stringify(data))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      objectivesDb.run(
        `UPDATE milestones SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return milestoneService.getById(id)
  },

  delete: (id: string) => {
    objectivesDb.run('DELETE FROM milestones WHERE id = ?', [id])
  },
  
  updateOrder: (milestoneIds: string[]) => {
    // Begin transaction
    objectivesDb.run('BEGIN TRANSACTION');
    
    try {
      milestoneIds.forEach((id, index) => {
        objectivesDb.run(
          'UPDATE milestones SET order_index = ? WHERE id = ?',
          [index, id]
        );
      });
      
      // Commit transaction
      objectivesDb.run('COMMIT');
      return true;
    } catch (error) {
      // Rollback transaction in case of error
      objectivesDb.run('ROLLBACK');
      console.error('Error updating milestone order:', error);
      return false;
    }
  }
}

// Task Services
export const taskService = {
  getAll: (milestoneId?: string) => {
    if (milestoneId) {
      return objectivesDb.query('SELECT * FROM tasks WHERE milestone_id = ? ORDER BY order_index ASC, created_at ASC').all(milestoneId)
    }
    return objectivesDb.query('SELECT * FROM tasks ORDER BY created_at DESC').all()
  },

  getById: (id: string) => {
    return objectivesDb.query('SELECT * FROM tasks WHERE id = ?').get(id)
  },

  create: (task: { 
    id: string; 
    milestoneId: string; 
    title: string; 
    description?: string; 
    status?: string;
    priority?: string;
    assigned_to?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    estimated_hours?: number | null;
    actual_hours?: number | null;
    order_index?: number;
    data?: any; 
    created_at: string; 
    updated_at: string 
  }) => {
    const { 
      id, 
      milestoneId, 
      title, 
      description, 
      status, 
      priority, 
      assigned_to, 
      start_date, 
      due_date, 
      estimated_hours,
      actual_hours,
      order_index,
      data, 
      created_at, 
      updated_at 
    } = task
    
    objectivesDb.run(
      `INSERT INTO tasks (
        id, 
        milestone_id, 
        title, 
        description, 
        status, 
        priority, 
        assigned_to, 
        start_date, 
        due_date, 
        estimated_hours,
        actual_hours,
        order_index, 
        data, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        milestoneId, 
        title, 
        description || null, 
        status || 'Not Started', 
        priority || 'Medium', 
        assigned_to || null, 
        start_date || null, 
        due_date || null, 
        estimated_hours || null,
        actual_hours || null,
        order_index || 0, 
        JSON.stringify(data || {}), 
        created_at, 
        updated_at
      ]
    )
    
    return task
  },

  update: (id: string, task: { 
    title?: string; 
    description?: string; 
    status?: string;
    priority?: string;
    assigned_to?: string;
    start_date?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    order_index?: number;
    data?: any 
  }) => {
    const { 
      title, 
      description, 
      status, 
      priority, 
      assigned_to, 
      start_date, 
      due_date, 
      estimated_hours,
      actual_hours,
      order_index, 
      data 
    } = task
    
    const updates: string[] = []
    const values: any[] = []

    if (title) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      values.push(priority)
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?')
      values.push(assigned_to)
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?')
      values.push(start_date)
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?')
      values.push(due_date)
    }
    if (estimated_hours !== undefined) {
      updates.push('estimated_hours = ?')
      values.push(estimated_hours)
    }
    if (actual_hours !== undefined) {
      updates.push('actual_hours = ?')
      values.push(actual_hours)
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?')
      values.push(order_index)
    }
    if (data) {
      updates.push('data = ?')
      values.push(JSON.stringify(data))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      objectivesDb.run(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    return taskService.getById(id)
  },

  delete: (id: string) => {
    objectivesDb.run('DELETE FROM tasks WHERE id = ?', [id])
  },
  
  updateOrder: (taskIds: string[]) => {
    // Begin transaction
    objectivesDb.run('BEGIN TRANSACTION');
    
    try {
      taskIds.forEach((id, index) => {
        objectivesDb.run(
          'UPDATE tasks SET order_index = ? WHERE id = ?',
          [index, id]
        );
      });
      
      // Commit transaction
      objectivesDb.run('COMMIT');
      return true;
    } catch (error) {
      // Rollback transaction in case of error
      objectivesDb.run('ROLLBACK');
      console.error('Error updating task order:', error);
      return false;
    }
  }
}

// Comment Services
export const commentService = {
  getAll: (parentType: string, parentId: string) => {
    return objectivesDb.query(
      'SELECT * FROM comments WHERE parent_type = ? AND parent_id = ? ORDER BY created_at ASC'
    ).all(parentType, parentId)
  },

  create: (comment: { 
    id: string; 
    parentType: string; 
    parentId: string; 
    userId: string; 
    content: string; 
    created_at: string; 
    updated_at: string 
  }) => {
    const { id, parentType, parentId, userId, content, created_at, updated_at } = comment
    
    objectivesDb.run(
      'INSERT INTO comments (id, parent_type, parent_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, parentType, parentId, userId, content, created_at, updated_at]
    )
    
    return comment
  },

  update: (id: string, content: string) => {
    objectivesDb.run(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, id]
    )
    
    return objectivesDb.query('SELECT * FROM comments WHERE id = ?').get(id)
  },

  delete: (id: string) => {
    objectivesDb.run('DELETE FROM comments WHERE id = ?', [id])
  }
}

// Attachment Services
export const attachmentService = {
  getAll: (parentType: string, parentId: string) => {
    return objectivesDb.query(
      'SELECT * FROM attachments WHERE parent_type = ? AND parent_id = ? ORDER BY created_at DESC'
    ).all(parentType, parentId)
  },

  create: (attachment: { 
    id: string; 
    parentType: string; 
    parentId: string; 
    fileName: string; 
    filePath: string; 
    fileSize: number; 
    fileType: string; 
    uploadedBy: string; 
    created_at: string 
  }) => {
    const { id, parentType, parentId, fileName, filePath, fileSize, fileType, uploadedBy, created_at } = attachment
    
    objectivesDb.run(
      'INSERT INTO attachments (id, parent_type, parent_id, file_name, file_path, file_size, file_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, parentType, parentId, fileName, filePath, fileSize, fileType, uploadedBy, created_at]
    )
    
    return attachment
  },

  delete: (id: string) => {
    objectivesDb.run('DELETE FROM attachments WHERE id = ?', [id])
  }
} 