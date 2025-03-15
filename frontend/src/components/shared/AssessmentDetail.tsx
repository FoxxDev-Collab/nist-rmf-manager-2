'use client'

// src/pages/AssessmentDetail.tsx
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { assessments, risks } from '@/services/api'
import type { Assessment } from '@/services/api'

// CSS classes for the score categories
const scoreClasses = {
  critical: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    lightBg: 'bg-red-100'
  },
  poor: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    lightBg: 'bg-orange-100'
  },
  fair: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    lightBg: 'bg-yellow-100'
  },
  good: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    lightBg: 'bg-green-100'
  },
  excellent: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    border: 'border-emerald-500',
    lightBg: 'bg-emerald-100'
  }
};

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
  assessment?: any
  score?: number
  completion?: number
}

// Function to get status colors for badge variants
const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('not') || statusLower === 'failed') return 'destructive';
  if (statusLower.includes('partial')) return 'secondary';
  if (statusLower === 'planned') return 'secondary';
  if (statusLower === 'implemented' || statusLower === 'completed') return 'default';
  return 'default';
};

// Function to get the appropriate icon for a status
const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('not') || statusLower === 'failed') return <XCircle className="h-4 w-4" />;
  if (statusLower.includes('partial') || statusLower === 'planned') return <HelpCircle className="h-4 w-4" />;
  if (statusLower === 'implemented' || statusLower === 'completed') return <CheckCircle className="h-4 w-4" />;
  return null;
};

export default function AssessmentDetail({ id }: { id: string }) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [selectedControl, setSelectedControl] = useState<Control | null>(null)
  const [riskTitle, setRiskTitle] = useState('')
  const [riskDescription, setRiskDescription] = useState('')
  const [riskImpact, setRiskImpact] = useState(3)
  const [riskLikelihood, setRiskLikelihood] = useState(3)
  const [promoting, setPromoting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Loading assessment with ID:', id);
      const data = await assessments.getById(id);
      console.log('Assessment data received:', data);
      setAssessment(data)
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

  const handlePromoteClick = (control: Control) => {
    setSelectedControl(control)
    setRiskTitle(`${control.family}-${control.id.split('-')[1]} Risk`)
    setRiskDescription(`Risk identified from ${control.family}-${control.id.split('-')[1]} control with status: ${control.status.status}`)
    
    // Set default impact and likelihood based on control status
    if (control.status.status === 'Not Implemented') {
      setRiskImpact(4)
      setRiskLikelihood(4)
    } else if (control.status.status === 'Partially Implemented') {
      setRiskImpact(3)
      setRiskLikelihood(3)
    } else if (control.status.status === 'Planned') {
      setRiskImpact(2)
      setRiskLikelihood(3)
    }
    
    setShowPromoteModal(true)
  }

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedControl || !assessment) return
    
    try {
      setPromoting(true)
      
      await risks.promoteFromAssessment(assessment.id!, {
        title: riskTitle,
        description: riskDescription,
        data: {
          impact: riskImpact,
          likelihood: riskLikelihood,
          risk_score: riskImpact * riskLikelihood,
          notes: `Promoted from control ${selectedControl.family}-${selectedControl.id} with status: ${selectedControl.status.status}`
        }
      })
      
      toast.success('Risk created successfully')
      setShowPromoteModal(false)
    } catch (error) {
      toast.error('Failed to create risk')
      console.error(error)
    } finally {
      setPromoting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex justify-center items-center h-32">
            <p>Loading assessment details... (ID: {id})</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
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
          </CardContent>
        </Card>
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

  // Check if we have controls data to display
  const hasControls = Object.keys(processedData.controls).length > 0;

  // Calculate statistics about controls
  const controlStats = (() => {
    if (!hasControls) return { total: 0, implemented: 0, partial: 0, notImplemented: 0, planned: 0, other: 0 };
    
    let total = 0;
    let implemented = 0;
    let partial = 0;
    let notImplemented = 0;
    let planned = 0;
    let other = 0;
    
    Object.values(processedData.controls).forEach(familyControls => {
      Object.values(familyControls).forEach(control => {
        const status = typeof control === 'string' ? control : control.status;
        const statusLower = status.toLowerCase();
        
        total++;
        if (statusLower === 'implemented') implemented++;
        else if (statusLower.includes('partial')) partial++;
        else if (statusLower.includes('not')) notImplemented++;
        else if (statusLower === 'planned') planned++;
        else other++;
      });
    });
    
    return { total, implemented, partial, notImplemented, planned, other };
  })();

  // Filter controls based on selected status
  const filteredControls = (() => {
    if (!activeTab || activeTab === 'all') return processedData.controls;
    
    const result: Record<string, Record<string, ControlStatus>> = {};
    
    Object.entries(processedData.controls).forEach(([family, familyControls]) => {
      const filteredFamilyControls: Record<string, ControlStatus> = {};
      
      Object.entries(familyControls).forEach(([controlId, control]) => {
        const status = typeof control === 'string' ? control : control.status;
        const statusLower = status.toLowerCase();
        
        if (
          (activeTab === 'implemented' && statusLower === 'implemented') ||
          (activeTab === 'partial' && statusLower.includes('partial')) ||
          (activeTab === 'notImplemented' && statusLower.includes('not')) ||
          (activeTab === 'planned' && statusLower === 'planned')
        ) {
          filteredFamilyControls[controlId] = typeof control === 'string' ? { status: control } : control;
        }
      });
      
      if (Object.keys(filteredFamilyControls).length > 0) {
        result[family] = filteredFamilyControls;
      }
    });
    
    return result;
  })();

  // Determine if any controls are present after filtering
  const hasFilteredControls = Object.keys(filteredControls).length > 0;

  // Get risk level with CSS classes instead of variants
  const getRiskLevelClass = (score: number): { level: string, colorClass: string } => {
    if (score >= 15) return { level: 'Critical', colorClass: 'bg-red-600' };
    if (score >= 10) return { level: 'High', colorClass: 'bg-orange-500' };
    if (score >= 5) return { level: 'Medium', colorClass: 'bg-yellow-500' };
    return { level: 'Low', colorClass: 'bg-green-500' };
  };

  // Get CSS class based on assessment score
  const getScoreClass = (score: number) => {
    if (score < 30) return scoreClasses.critical;
    if (score < 50) return scoreClasses.poor;
    if (score < 70) return scoreClasses.fair;
    if (score < 85) return scoreClasses.good;
    return scoreClasses.excellent;
  };

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

  // Calculate improved scores based on control implementation status
  const calculateDetailedScores = () => {
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
      let familyControlCount = Object.keys(familyControls).length;

      // Process each control in the family
      Object.entries(familyControls).forEach(([controlId, control]) => {
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
  };

  // Get the detailed scores
  const detailedScores = calculateDetailedScores();
  const riskLevel = getRiskLevelClass(processedData.score || 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{assessment.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusColor(processedData.status)}>
                {processedData.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Risk Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Overall risk score based on control implementation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                {/* Use the detailed score and getScoreClass for color */}
                <div 
                  className={`h-full ${getScoreClass(detailedScores.totalScore).bg}`} 
                  style={{ width: `${detailedScores.totalScore}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-2xl font-bold ${getScoreClass(detailedScores.totalScore).text}`}>
                  {detailedScores.totalScore}
                </p>
                <Badge className={`${getScoreClass(detailedScores.totalScore).bg} text-white`}>
                  {detailedScores.totalScore < 30 ? 'Critical Risk' : 
                   detailedScores.totalScore < 50 ? 'High Risk' : 
                   detailedScores.totalScore < 70 ? 'Medium Risk' : 
                   detailedScores.totalScore < 85 ? 'Low Risk' : 
                   'Minimal Risk'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Controls Status
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Summary of control implementation statuses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-green-500"></span>
                  <span>Implemented</span>
                </div>
                <Badge variant="outline">{detailedScores.implementedPercentage}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                  <span>Partially Implemented</span>
                </div>
                <Badge variant="outline">{detailedScores.partialPercentage}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  <span>Not Implemented</span>
                </div>
                <Badge variant="outline">{detailedScores.notImplementedPercentage}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-purple-500"></span>
                  <span>Planned</span>
                </div>
                <Badge variant="outline">{detailedScores.plannedPercentage}%</Badge>
              </div>
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Controls</span>
                  <Badge variant="outline">{detailedScores.totalControls}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Status Graph */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Controls Status Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Implemented</span>
                  <span>{detailedScores.implementedPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${detailedScores.implementedPercentage}%` }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Partially Implemented</span>
                  <span>{detailedScores.partialPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: `${detailedScores.partialPercentage}%` }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Planned</span>
                  <span>{detailedScores.plannedPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${detailedScores.plannedPercentage}%` }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Not Implemented</span>
                  <span>{detailedScores.notImplementedPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${detailedScores.notImplementedPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>  
      </div>

      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-medium">Organization</p>
              <p className="text-muted-foreground">{processedData.organization || 'Not specified'}</p>
            </div>
            <div>
              <p className="font-medium">Assessor</p>
              <p className="text-muted-foreground">{processedData.assessor || 'Not specified'}</p>
            </div>
            <div>
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">
                {processedData.date 
                  ? new Date(processedData.date).toLocaleDateString() 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              <p className="text-muted-foreground">
                <Badge variant={getStatusColor(processedData.status)}>
                  {processedData.status || 'Not specified'}
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Scores Card */}
      <Card>
        <CardHeader>
          <CardTitle>Family Scores</CardTitle>
          <CardDescription>Detailed compliance scores by control family</CardDescription>
        </CardHeader>
        <CardContent>
          {detailedScores.familyScores.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No control family data available.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {detailedScores.familyScores.map(family => (
                <div key={family.familyId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">{family.familyTitle}</h3>
                    <Badge className={`${getScoreClass(family.averageScore).bg} text-white`}>
                      Score: {family.averageScore}
                    </Badge>
                  </div>
                  
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full ${getScoreClass(family.averageScore).bg}`} 
                      style={{ width: `${family.averageScore}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Implemented:</span>
                      <span className="font-medium">{family.implementedControls}/{family.totalControls} 
                        ({family.totalControls > 0 ? Math.round((family.implementedControls / (family.totalControls - family.naControls)) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partial:</span>
                      <span className="font-medium">{family.partialControls}/{family.totalControls}
                        ({family.totalControls > 0 ? Math.round((family.partialControls / (family.totalControls - family.naControls)) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Planned:</span>
                      <span className="font-medium">{family.plannedControls}/{family.totalControls}
                        ({family.totalControls > 0 ? Math.round((family.plannedControls / (family.totalControls - family.naControls)) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Not Implemented:</span>
                      <span className="font-medium">{family.notImplementedControls}/{family.totalControls}
                        ({family.totalControls > 0 ? Math.round((family.notImplementedControls / (family.totalControls - family.naControls)) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            View and manage security controls by status
          </CardDescription>
          <Tabs defaultValue="all" className="mt-2" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">All ({controlStats.total})</TabsTrigger>
              <TabsTrigger value="implemented">Implemented ({controlStats.implemented})</TabsTrigger>
              <TabsTrigger value="partial">Partial ({controlStats.partial})</TabsTrigger>
              <TabsTrigger value="notImplemented">Not Implemented ({controlStats.notImplemented})</TabsTrigger>
              <TabsTrigger value="planned">Planned ({controlStats.planned})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {!hasControls ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No controls data available for this assessment.</p>
            </div>
          ) : !hasFilteredControls ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No controls match the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredControls).map(([family, familyControls]) => (
                <div key={family} className="space-y-4">
                  <h3 className="text-xl font-semibold">{family}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(familyControls).map(([controlId, control]) => {
                      // Normalize control data structure
                      const controlStatus = typeof control === 'string' 
                        ? { status: control } 
                        : (control as ControlStatus);
                      
                      const statusColor = getStatusColor(controlStatus.status);
                      const statusIcon = getStatusIcon(controlStatus.status);
                      
                      // Create CSS classes based on status
                      const getBorderClass = (status: string) => {
                        const statusLower = status.toLowerCase();
                        if (statusLower.includes('not') || statusLower === 'failed') 
                          return "border-l-4 border-l-destructive";
                        if (statusLower.includes('partial')) 
                          return "border-l-4 border-l-yellow-500";
                        if (statusLower === 'planned') 
                          return "border-l-4 border-l-purple-500";
                        if (statusLower === 'implemented' || statusLower === 'completed') 
                          return "border-l-4 border-l-green-500";
                        return "border-l-4 border-l-gray-300";
                      };
                      
                      return (
                        <Card key={controlId} className={getBorderClass(controlStatus.status)}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{controlId}</h4>
                                <p className="text-sm flex items-center gap-1 mt-1">
                                  <Badge variant={statusColor} className="flex items-center gap-1">
                                    {statusIcon}
                                    {controlStatus.status}
                                  </Badge>
                                </p>
                                {controlStatus.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    "{controlStatus.notes}"
                                  </p>
                                )}
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePromoteClick({
                                        id: controlId,
                                        family,
                                        status: controlStatus
                                      })}
                                    >
                                      Promote to Risk
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Create a risk based on this control's implementation status</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">Assessment ID: {assessment.id}</p>
            <p className="font-medium">Title: {assessment.title}</p>
            <p className="font-medium">Description: {assessment.description}</p>
            <details className="mt-4 p-4 border rounded-md">
              <summary className="cursor-pointer font-medium">Raw Data (Click to expand)</summary>
              <pre className="mt-4 p-4 bg-muted rounded-md text-xs overflow-auto max-h-[500px]">
                {JSON.stringify(assessment, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPromoteModal} onOpenChange={setShowPromoteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promote to Risk</DialogTitle>
            <DialogDescription>
              Create a risk item based on the control's implementation status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePromoteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="risk-title">Risk Title</Label>
              <Input
                id="risk-title"
                value={riskTitle}
                onChange={(e) => setRiskTitle(e.target.value)}
                required
                disabled={promoting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-description">Description</Label>
              <Input
                id="risk-description"
                value={riskDescription}
                onChange={(e) => setRiskDescription(e.target.value)}
                required
                disabled={promoting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Impact (1-5)</Label>
                <span className="text-sm font-medium px-2 py-0.5 bg-muted rounded-md">{riskImpact}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Low</span>
                <Slider
                  value={[riskImpact]}
                  onValueChange={([value]) => setRiskImpact(value)}
                  min={1}
                  max={5}
                  step={1}
                  disabled={promoting}
                  className="flex-1"
                />
                <span className="text-xs">High</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Likelihood (1-5)</Label>
                <span className="text-sm font-medium px-2 py-0.5 bg-muted rounded-md">{riskLikelihood}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Low</span>
                <Slider
                  value={[riskLikelihood]}
                  onValueChange={([value]) => setRiskLikelihood(value)}
                  min={1}
                  max={5}
                  step={1}
                  disabled={promoting}
                  className="flex-1"
                />
                <span className="text-xs">High</span>
              </div>
            </div>
            
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="font-medium">Risk Score:</span>
                {riskImpact * riskLikelihood >= 15 ? (
                  <Badge className="ml-auto text-white bg-red-600">
                    {riskImpact * riskLikelihood} - Critical
                  </Badge>
                ) : riskImpact * riskLikelihood >= 10 ? (
                  <Badge className="ml-auto text-white bg-orange-500">
                    {riskImpact * riskLikelihood} - High
                  </Badge>
                ) : riskImpact * riskLikelihood >= 5 ? (
                  <Badge className="ml-auto text-white bg-yellow-500">
                    {riskImpact * riskLikelihood} - Medium
                  </Badge>
                ) : (
                  <Badge className="ml-auto text-white bg-green-500">
                    {riskImpact * riskLikelihood} - Low
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Calculated as Impact × Likelihood
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPromoteModal(false)} disabled={promoting}>
                Cancel
              </Button>
              <Button type="submit" disabled={promoting}>
                {promoting ? 'Creating Risk...' : 'Create Risk'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

