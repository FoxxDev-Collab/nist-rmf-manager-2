"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import apiService, { Assessment, Risk } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, ArrowLeft, InfoIcon, CalendarIcon, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';

// Define the params type
type PageParams = {
  assessmentid: string;
}

// Risk status options
const RISK_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'identified', label: 'Identified' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'mitigating', label: 'Mitigating' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'closed', label: 'Closed' }
];

// Risk Timeline & Alerts Component
function RiskTimelineAndAlerts({ impact, likelihood }: { impact: number; likelihood: number }) {
  const baseScore = impact * likelihood;
  const riskScore = 100 - ((baseScore / 25) * 100);
  const today = new Date();
  
  // Calculate suggested dates based on risk level
  const getDateRange = () => {
    const dates = {
      identification: today,
      analysis: new Date(today),
      mitigation: new Date(today),
      review: new Date(today)
    };
    
    // Higher risk (lower score) = shorter timeline
    if (riskScore < 30) { // Critical
      dates.analysis.setDate(today.getDate() + 3);
      dates.mitigation.setDate(today.getDate() + 7);
      dates.review.setDate(today.getDate() + 14);
    } else if (riskScore < 50) { // High
      dates.analysis.setDate(today.getDate() + 7);
      dates.mitigation.setDate(today.getDate() + 21);
      dates.review.setDate(today.getDate() + 45);
    } else if (riskScore < 70) { // Medium
      dates.analysis.setDate(today.getDate() + 14);
      dates.mitigation.setDate(today.getDate() + 45);
      dates.review.setDate(today.getDate() + 90);
    } else { // Low
      dates.analysis.setDate(today.getDate() + 30);
      dates.mitigation.setDate(today.getDate() + 90);
      dates.review.setDate(today.getDate() + 180);
    }
    
    return dates;
  };
  
  const dates = getDateRange();
  
  // Get appropriate risk level colors
  const getRiskLevelClass = (score: number) => {
    if (score < 30) return {
      bg: "bg-red-100 dark:bg-red-900/30", 
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-700"
    };
    if (score < 50) return {
      bg: "bg-orange-100 dark:bg-orange-900/30", 
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-700"
    };
    if (score < 70) return {
      bg: "bg-yellow-100 dark:bg-yellow-900/30", 
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-200 dark:border-yellow-700"
    };
    return {
      bg: "bg-green-100 dark:bg-green-900/30", 
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-700"
    };
  };
  
  const levelClass = getRiskLevelClass(riskScore);
  
  return (
    <div className="space-y-6">
      {/* Risk Alerts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-md border p-3 flex items-center gap-3 ${levelClass.border} ${levelClass.bg}`}>
          <AlertTriangle className={`h-8 w-8 ${levelClass.text}`} />
          <div>
            <div className={`text-sm font-medium ${levelClass.text}`}>Risk Level</div>
            <div className="text-xl font-bold text-foreground dark:text-white">
              {riskScore < 30 ? 'Critical' : 
               riskScore < 50 ? 'High' : 
               riskScore < 70 ? 'Medium' : 'Low'}
            </div>
          </div>
        </div>
        
        <div className="rounded-md border dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 p-3 flex items-center gap-3">
          <Clock className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Estimated Timeline</div>
            <div className="text-xl font-bold text-foreground dark:text-white">
              {riskScore < 30 ? '2 weeks' : 
               riskScore < 50 ? '6 weeks' : 
               riskScore < 70 ? '12 weeks' : '6 months'}
            </div>
          </div>
        </div>
        
        <div className="rounded-md border dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Next Action</div>
            <div className="text-xl font-bold text-foreground dark:text-white">Analysis</div>
          </div>
        </div>
      </div>
      
      {/* Risk Timeline */}
      <div>
        <h3 className="text-sm font-medium mb-4 text-foreground dark:text-gray-200">Risk Management Timeline</h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-green-400 via-blue-500 to-purple-500 dark:from-green-500 dark:via-blue-600 dark:to-purple-600"></div>
          
          {/* Timeline items */}
          <div className="space-y-8">
            <div className="relative pl-10">
              <div className="absolute left-0 flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600 z-10">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="p-3 rounded-md border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground dark:text-gray-200">Risk Identification</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{format(dates.identification, 'PPP')} (Today)</p>
                  </div>
                  <Badge className="bg-green-500 dark:bg-green-700 text-white">Complete</Badge>
                </div>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">Initial risk assessment and documentation complete.</p>
              </div>
            </div>
            
            <div className="relative pl-10">
              <div className="absolute left-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-600 z-10">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="p-3 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground dark:text-gray-200">Risk Analysis</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Due: {format(dates.analysis, 'PPP')}</p>
                  </div>
                  <Badge className="bg-blue-500 dark:bg-blue-700 text-white">Next Action</Badge>
                </div>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
                  Analyze risk details, determine impact vectors, and identify potential mitigations.
                </p>
              </div>
            </div>
            
            <div className="relative pl-10">
              <div className="absolute left-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 z-10">
                <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground dark:text-gray-200">Mitigation Implementation</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Due: {format(dates.mitigation, 'PPP')}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700">Pending</Badge>
                </div>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
                  Implement controls and safeguards to reduce risk to acceptable levels.
                </p>
              </div>
            </div>
            
            <div className="relative pl-10">
              <div className="absolute left-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 z-10">
                <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground dark:text-gray-200">Review & Reassessment</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Due: {format(dates.review, 'PPP')}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700">Pending</Badge>
                </div>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
                  Review effectiveness of mitigations and reassess residual risk.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-600"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Overdue</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground dark:text-gray-400 italic mt-2 border-t dark:border-gray-800 pt-2">
        *Timeline is automatically adjusted based on risk level. Higher-risk items have accelerated timelines.
      </div>
    </div>
  );
}

export default function CreateRiskPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const { assessmentid } = unwrappedParams;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState(3);
  const [likelihood, setLikelihood] = useState(3);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('new');
  const [assessmentId, setAssessmentId] = useState(assessmentid || '');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [controlId, setControlId] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  
  // Calculate risk score
  const baseScore = impact * likelihood;
  const riskScore = 100 - ((baseScore / 25) * 100);

  // Get risk level based on score
  const getRiskLevel = (score: number) => {
    if (score < 30) return { 
      level: 'Critical', 
      color: 'text-red-600 dark:text-red-400', 
      bgColor: 'bg-red-100 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-900'
    };
    if (score < 50) return { 
      level: 'High', 
      color: 'text-orange-500 dark:text-orange-400', 
      bgColor: 'bg-orange-100 dark:bg-orange-950/30',
      borderColor: 'border-orange-200 dark:border-orange-900'
    };
    if (score < 70) return { 
      level: 'Medium', 
      color: 'text-yellow-500 dark:text-yellow-400', 
      bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-900' 
    };
    return { 
      level: 'Low', 
      color: 'text-green-500 dark:text-green-400', 
      bgColor: 'bg-green-100 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-900'
    };
  };

  const { level, color, bgColor, borderColor } = getRiskLevel(riskScore);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        if (assessmentId) {
          const data = await apiService.assessments.getById(assessmentId);
          setAssessment(data);
        }
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment data. Please try again later.');
      }
    };

    fetchAssessmentData();
  }, [assessmentId]);

  // Fetch all assessments for the dropdown
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await apiService.assessments.getAll();
        setAssessments(data);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments. Please try again later.');
      }
    };

    fetchAssessments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Risk title is required');
      return;
    }
    
    if (!assessmentId) {
      setError('You must select an assessment');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date().toISOString();
      
      const riskData: Omit<Risk, 'id'> = {
        assessmentId,
        title,
        description,
        data: {
          impact,
          likelihood,
          risk_score: riskScore,
          notes,
          status: status,
          ...(controlId ? { control_id: controlId } : {}),
          ...(targetDate ? { target_date: targetDate.toISOString() } : {})
        },
        created_at: now,
        updated_at: now
      };
      
      await apiService.risks.create(riskData);
      toast.success('Risk created successfully');
      router.push(`/assessment/${assessmentid}/risk`);
    } catch (err) {
      console.error('Error creating risk:', err);
      setError('Failed to create risk. Please try again.');
      toast.error('Failed to create risk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/assessment/${assessmentid}/risk`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Risks
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Risk</h1>
          <p className="text-muted-foreground mt-1">
            Add a new risk to {assessment?.title || 'this assessment'}
          </p>
        </div>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {assessment === null ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need at least one assessment to create a risk.{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={() => router.push('/assessment/create')}
            >
              Create an assessment
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border dark:border-gray-800">
              <CardHeader className="dark:bg-gray-900/50 rounded-t-lg">
                <CardTitle>Risk Details</CardTitle>
                <CardDescription>
                  Basic information about the risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Risk Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter risk title"
                    required
                    className="dark:bg-gray-900/50 dark:border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assessment">Assessment *</Label>
                  <Select 
                    value={assessmentId} 
                    onValueChange={setAssessmentId}
                    disabled={assessmentid !== ''}
                  >
                    <SelectTrigger className="dark:bg-gray-900/50 dark:border-gray-700">
                      <SelectValue placeholder="Select an assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments.map(assessment => (
                        <SelectItem key={assessment.id} value={assessment.id!}>
                          {assessment.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assessmentid !== '' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assessment is pre-selected from the current context
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Risk Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="dark:bg-gray-900/50 dark:border-gray-700">
                      <SelectValue placeholder="Select risk status" />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Resolution Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="targetDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal dark:bg-gray-900/50 dark:border-gray-700"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, 'PPP') : <span>Set target date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="controlId">
                    Associated Control ID
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            Optional: Link this risk to a specific control (e.g., AC-1, IA-2)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="controlId"
                    value={controlId}
                    onChange={(e) => setControlId(e.target.value)}
                    placeholder="e.g., AC-1, IA-2 (Optional)"
                    className="dark:bg-gray-900/50 dark:border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the risk in detail"
                    rows={5}
                    className="dark:bg-gray-900/50 dark:border-gray-700 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-8">
              <Card className="border dark:border-gray-800">
                <CardHeader className="dark:bg-gray-900/50 rounded-t-lg">
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>
                    Evaluate the risk impact and likelihood
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="impact">Impact</Label>
                        <Badge variant="outline" className="font-medium dark:border-gray-700">
                          {impact}/5
                        </Badge>
                      </div>
                      <Slider
                        id="impact"
                        min={1}
                        max={5}
                        step={1}
                        value={[impact]}
                        onValueChange={(values) => setImpact(values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Minimal</span>
                        <span>Low</span>
                        <span>Moderate</span>
                        <span>High</span>
                        <span>Severe</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="likelihood">Likelihood</Label>
                        <Badge variant="outline" className="font-medium dark:border-gray-700">
                          {likelihood}/5
                        </Badge>
                      </div>
                      <Slider
                        id="likelihood"
                        min={1}
                        max={5}
                        step={1}
                        value={[likelihood]}
                        onValueChange={(values) => setLikelihood(values[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Rare</span>
                        <span>Unlikely</span>
                        <span>Possible</span>
                        <span>Likely</span>
                        <span>Certain</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-md ${bgColor} border ${borderColor}`}>
                    <div className="text-sm font-medium mb-2">Risk Score:</div>
                    <div className="flex items-center">
                      <div className={`text-3xl font-bold ${color}`}>
                        {Math.round(riskScore)}/100
                      </div>
                      <div className={`ml-2 ${color} font-medium`}>
                        ({level})
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Score calculated as 100 - ((Impact × Likelihood) / 25) × 100
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes or context about this risk"
                      rows={3}
                      className="dark:bg-gray-900/50 dark:border-gray-700 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border dark:border-gray-800">
                <CardHeader className="dark:bg-gray-900/50 rounded-t-lg">
                  <CardTitle>Timeline & Alerts</CardTitle>
                  <CardDescription>
                    Management timeline and action items based on risk level
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <RiskTimelineAndAlerts impact={impact} likelihood={likelihood} />
                </CardContent>
              </Card>
            </div>
          </div>
          
          <CardFooter className="flex justify-end space-x-4 px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/assessment/${assessmentid}/risk`)}
              disabled={loading}
              className="dark:bg-gray-900/50 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title || !assessmentId}
            >
              {loading ? 'Creating...' : 'Create Risk'}
            </Button>
          </CardFooter>
        </form>
      )}
    </div>
  );
} 