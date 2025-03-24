'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { assessments, risks, clients } from '@/services/api'
import type { Assessment } from '@/services/api'
import { 
  RiskScoreCard,
  ControlsStatusCard,
  ControlsStatusGraph,
  AssessmentOverview,
  FamilyScoresAccordion,
  ControlsList,
  DebugInfo
} from '@/components/shared/assessment'
import { Building, FileText } from 'lucide-react'

interface ControlStatus {
  status: string
  notes?: string
}

interface Control {
  id: string
  family: string
  status: ControlStatus
}

interface AssessmentData {
  organization: string
  assessor: string
  date: string
  status: string
  controls: Record<string, Record<string, ControlStatus>>
  assessment?: Record<string, unknown>
  score?: number
  completion?: number
}

// Define ComplianceScore interface for improved scoring
interface ComplianceScore {
  familyId: string;
  familyTitle: string;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  plannedControls: number;
  notImplementedControls: number;
  naControls: number;
  averageScore: number;
}

export default function AssessmentDetail({ id }: { id: string }) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [promotedControls, setPromotedControls] = useState<Set<string>>(new Set())
  const [creatingClient, setCreatingClient] = useState(false)

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Loading assessment with ID:', id);
      const data = await assessments.getById(id);
      console.log('Assessment data received:', data);
      setAssessment(data)
      
      // Initialize promoted controls from the assessment data
      if (data.data?.promotedControls) {
        setPromotedControls(new Set(data.data.promotedControls))
      }
    } catch (error) {
      toast.error('Failed to load assessment details')
      console.error('Error loading assessment:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadAssessment()
    }
  }, [id, loadAssessment])

  const handlePromoteToRisk = async (control: Control) => {
    if (!assessment) return
    
    try {
      const controlId = `${control.family}-${control.id}`
      
      // Create the risk with proper data structure
      await risks.promoteFromAssessment(assessment.id!, {
        title: `Risk from ${control.family}-${control.id}`,
        description: `Risk identified from control assessment with status: ${control.status.status}`,
        data: {
          impact: 3, // Default medium impact
          likelihood: 3, // Default medium likelihood
          risk_score: 9, // Default score (3 * 3)
          notes: `Promoted from control ${control.family}-${control.id} with status: ${control.status.status}`,
          control_id: controlId, // Store the control ID in the risk data
          status: 'New'
        }
      })
      
      // Update local state
      setPromotedControls(prev => new Set([...prev, controlId]))
      toast.success('Risk created successfully')
    } catch (error) {
      console.error('Error promoting to risk:', error)
      if (error instanceof Error) {
        if (error.message.includes('already been promoted')) {
          toast.error('This control has already been promoted to a risk')
        } else if (error.message.includes('Assessment not found')) {
          toast.error('Assessment not found. Please refresh the page.')
        } else {
          toast.error(`Failed to create risk: ${error.message}`)
        }
      } else {
        toast.error('Failed to create risk. Please try again.')
      }
    }
  }

  const handleCreateClient = async () => {
    if (!assessment) return;
    
    try {
      setCreatingClient(true);
      const result = await clients.createFromAssessment(assessment.id!);
      
      toast.success(`Client "${result.client.name}" created successfully`);
      // Refresh the assessment to show the client connection
      loadAssessment();
      
      // Optionally navigate to the client detail page
      router.push(`/clients/${result.client.id}`);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setCreatingClient(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-32">
          <p>Loading assessment details... (ID: {id})</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Assessment not found. ID: {id}</p>
          <div className="mt-4 p-4 bg-muted rounded-md text-sm">
            <p>Debug Info:</p>
            <pre className="mt-2 whitespace-pre-wrap">Assessment ID: {id}</pre>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Normalize the assessment data structure for consistent access
  console.log('Processing assessment data structure:', assessment);
  
  const processedData: AssessmentData = (() => {
    try {
      // Ensure data is an object
      const rawData = typeof assessment.data === 'string' 
        ? JSON.parse(assessment.data) 
        : assessment.data;
      
      // Handle nested assessment field if present
      const baseData = rawData.assessment || rawData;
      
      return {
        organization: baseData.organization || '',
        assessor: baseData.assessor || '',
        date: baseData.date || '',
        status: baseData.status || 'Unknown',
        controls: baseData.controls || {},
        score: baseData.score || baseData.overall_score || 0,
        completion: baseData.completion || 0
      };
    } catch (e) {
      console.error("Error processing assessment data:", e);
      return {
        organization: '',
        assessor: '',
        date: '',
        status: 'Error processing data',
        controls: {},
        score: 0,
        completion: 0
      };
    }
  })();
  
  console.log('Normalized data:', processedData);

  // Calculate improved scores based on control implementation status
  const detailedScores = (() => {
    const hasControls = Object.keys(processedData.controls).length > 0;
    if (!hasControls) return { 
      familyScores: [], 
      totalScore: 0, 
      totalControls: 0,
      implementedPercentage: 0,
      partialPercentage: 0,
      plannedPercentage: 0,
      notImplementedPercentage: 0
    };

    const familyScores: ComplianceScore[] = [];
    let totalScore = 0;
    let totalControls = 0;
    let totalImplemented = 0;
    let totalPartial = 0;
    let totalPlanned = 0;
    let totalNotImplemented = 0;
    let totalNA = 0;
    let applicableControls = 0;

    // Process each control family
    Object.entries(processedData.controls).forEach(([familyId, familyControls]) => {
      let familyTotalScore = 0;
      let implemented = 0;
      let partial = 0;
      let planned = 0;
      let notImplemented = 0;
      let na = 0;
      let applicable = 0;
      const familyControlCount = Object.keys(familyControls).length;

      // Process each control in the family
      Object.entries(familyControls).forEach(([
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _controlId, control]) => {
        const status = typeof control === 'string' ? control : control.status;
        const statusLower = status.toLowerCase();
        
        // Assign score based on implementation status
        let controlScore = 0;
        if (statusLower === 'not applicable') {
          na++;
        } else {
          applicable++;
          
          if (statusLower === 'implemented') {
            implemented++;
            controlScore = 100;
          } else if (statusLower.includes('partial')) {
            partial++;
            controlScore = 50;
          } else if (statusLower === 'planned') {
            planned++;
            controlScore = 25;
          } else if (statusLower.includes('not')) {
            notImplemented++;
            controlScore = 0;
          }
          
          familyTotalScore += controlScore;
        }
      });

      // Calculate family average score
      const familyScore = {
        familyId,
        familyTitle: familyId, // Could be replaced with a lookup for friendlier names
        totalControls: familyControlCount,
        implementedControls: implemented,
        partialControls: partial,
        plannedControls: planned,
        notImplementedControls: notImplemented,
        naControls: na,
        averageScore: applicable > 0 ? Math.round(familyTotalScore / applicable) : 0
      };

      familyScores.push(familyScore);
      
      // Update totals
      totalScore += familyTotalScore;
      totalControls += familyControlCount;
      totalImplemented += implemented;
      totalPartial += partial;
      totalPlanned += planned;
      totalNotImplemented += notImplemented;
      totalNA += na;
      applicableControls += applicable;
    });

    // Calculate overall average score and percentages
    const overallScore = applicableControls > 0 ? Math.round(totalScore / applicableControls) : 0;
    const totalApplicable = totalControls - totalNA;
    
    return {
      familyScores,
      totalScore: overallScore,
      totalControls,
      implementedPercentage: totalApplicable > 0 ? Math.round((totalImplemented / totalApplicable) * 100) : 0,
      partialPercentage: totalApplicable > 0 ? Math.round((totalPartial / totalApplicable) * 100) : 0,
      plannedPercentage: totalApplicable > 0 ? Math.round((totalPlanned / totalApplicable) * 100) : 0,
      notImplementedPercentage: totalApplicable > 0 ? Math.round((totalNotImplemented / totalApplicable) * 100) : 0
    };
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{assessment.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{processedData.status}</Badge>
            <p className="text-sm text-muted-foreground">
              {processedData.date ? new Date(processedData.date).toLocaleDateString() : 'No date'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {assessment.client_id ? (
            <Button 
              variant="outline"
              onClick={() => router.push(`/clients/${assessment.client_id}`)}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              View Client
            </Button>
          ) : (
            <Button 
              onClick={handleCreateClient}
              disabled={creatingClient}
              className="flex items-center gap-2"
              size="lg"
            >
              <Building className="h-5 w-5" />
              {creatingClient ? 'Creating...' : 'Create Client from Assessment'}
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => router.push(`/assessment/${id}/risk`)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Risks
          </Button>
        </div>
      </div>

      {/* Assessment Overview */}
      <AssessmentOverview
        organization={processedData.organization}
        assessor={processedData.assessor}
        date={processedData.date}
        status={processedData.status}
      />
      
      {/* Assessment Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RiskScoreCard score={processedData.score || 0} />
        <ControlsStatusCard
          implementedPercentage={detailedScores.implementedPercentage}
          partialPercentage={detailedScores.partialPercentage}
          notImplementedPercentage={detailedScores.notImplementedPercentage}
          plannedPercentage={detailedScores.plannedPercentage}
          totalControls={detailedScores.totalControls}
        />
        <ControlsStatusGraph
          implementedPercentage={detailedScores.implementedPercentage}
          partialPercentage={detailedScores.partialPercentage}
          notImplementedPercentage={detailedScores.notImplementedPercentage}
          plannedPercentage={detailedScores.plannedPercentage}
        />
      </div>
      
      {/* Family Scores Accordion */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Control Family Scores</h2>
        <FamilyScoresAccordion familyScores={detailedScores.familyScores} />
      </div>
      
      {/* Controls List */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Controls Assessment</h2>
        <ControlsList 
          controls={processedData.controls} 
          onPromoteToRisk={handlePromoteToRisk}
          promotedControls={promotedControls}
        />
      </div>
      
      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && (
        <DebugInfo
          id={assessment.id}
          title={assessment.title}
          description={assessment.description}
          data={assessment as unknown as Record<string, unknown>}
        />
      )}
    </div>
  )
} 