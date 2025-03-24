import { assessmentsDb, risksDb, objectivesDb, clientsDb } from './config'

// Client Services
export const clientService = {
  getAll: () => {
    return clientsDb.query('SELECT * FROM clients ORDER BY name ASC').all();
  },

  getById: (id: string) => {
    return clientsDb.query('SELECT * FROM clients WHERE id = ?').get(id);
  },

  create: (client: { id: string; name: string; description?: string; contact_name?: string; contact_email?: string; contact_phone?: string; industry?: string; size?: string; notes?: string; created_at: string; updated_at: string }) => {
    const { id, name, description, contact_name, contact_email, contact_phone, industry, size, notes, created_at, updated_at } = client
    clientsDb.run(
      'INSERT INTO clients (id, name, description, contact_name, contact_email, contact_phone, industry, size, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description || null, contact_name || null, contact_email || null, contact_phone || null, industry || null, size || null, notes || null, created_at, updated_at]
    )
    return client
  },

  update: (id: string, client: { name?: string; description?: string; contact_name?: string; contact_email?: string; contact_phone?: string; industry?: string; size?: string; notes?: string }) => {
    const { name, description, contact_name, contact_email, contact_phone, industry, size, notes } = client
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

  create: (objective: { id: string; client_id: string; title: string; description?: string; data: any; created_at: string; updated_at: string }) => {
    const { id, client_id, title, description, data, created_at, updated_at } = objective
    objectivesDb.run(
      'INSERT INTO security_objectives (id, client_id, title, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, client_id, title, description || null, JSON.stringify(data), created_at, updated_at]
    )
    return objective
  },

  update: (id: string, objective: { client_id?: string; title?: string; description?: string; data?: any }) => {
    const { client_id, title, description, data } = objective
    const updates: string[] = []
    const values: any[] = []

    if (client_id) {
      updates.push('client_id = ?')
      values.push(client_id)
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

  create: (initiative: { id: string; objectiveId: string; title: string; description?: string; data: any; created_at: string; updated_at: string }) => {
    const { id, objectiveId, title, description, data, created_at, updated_at } = initiative
    objectivesDb.run(
      'INSERT INTO initiatives (id, objective_id, title, description, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, objectiveId, title, description || null, JSON.stringify(data), created_at, updated_at]
    )
    return initiative
  },

  update: (id: string, initiative: { title?: string; description?: string; data?: any }) => {
    const { title, description, data } = initiative
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