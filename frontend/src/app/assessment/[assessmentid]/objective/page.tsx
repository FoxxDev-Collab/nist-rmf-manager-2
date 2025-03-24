"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import apiService, { SecurityObjective, SecurityObjectiveData, Risk } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Search, 
  Trash2, 
  CalendarClock, 
  DollarSign, 
  ClipboardList, 
  Users, 
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  BarChart4
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

// Enhanced objective data model with project management fields
interface EnhancedSecurityObjectiveData extends SecurityObjectiveData {
  // Existing extension
  risk_notes?: string;
  
  // Project management fields
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  milestones?: Array<{
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }>;
  assignees?: string[];
  risk_id?: string; // Reference to the original risk
  progress?: number; // Overall progress percentage
}

export default function ObjectivesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const assessmentId = params.assessmentid as string;
  const [objectives, setObjectives] = useState<SecurityObjective[]>([]);
  const [riskQueue, setRiskQueue] = useState<Risk[]>([]);
  const [filteredObjectives, setFilteredObjectives] = useState<SecurityObjective[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // Check for success message in URL
  useEffect(() => {
    const success = searchParams.get('success');
    const message = searchParams.get('message');
    
    if (success === 'true' && message) {
      setSuccessMessage(decodeURIComponent(message));
      
      // Clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch security objectives and risk queue
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both objectives and risks in parallel
        const [objectivesData, risksData] = await Promise.all([
          apiService.objectives.getAll(),
          apiService.risks.getAll(assessmentId)
        ]);
        
        setObjectives(objectivesData);
        setFilteredObjectives(objectivesData);
        
        // Filter the risk queue to exclude risks that have already been converted to objectives
        // by checking the risk_id property in the objectives' data
        const convertedRiskIds = new Set<string>();
        objectivesData.forEach(objective => {
          const data = getObjectiveData(objective.data);
          if (data.risk_id) {
            convertedRiskIds.add(data.risk_id);
          }
        });
        
        // Filter out risks that have already been converted to objectives
        const filteredRisks = risksData.filter(risk => !convertedRiskIds.has(risk.id!));
        setRiskQueue(filteredRisks);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load security objectives and risks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId]);

  // Filter objectives based on search query
  useEffect(() => {
    let result = objectives;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(objective => 
        objective.title.toLowerCase().includes(query) || 
        (objective.description && objective.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredObjectives(result);
  }, [searchQuery, objectives]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this security objective?')) return;
    
    try {
      await apiService.objectives.delete(id);
      setObjectives(objectives.filter(objective => objective.id !== id));
    } catch (err) {
      console.error('Error deleting objective:', err);
      setError('Failed to delete security objective. Please try again.');
    }
  };

  // Get priority level and color
  const getPriorityInfo = (priority: number) => {
    if (priority === 1) return { level: 'High', color: 'bg-red-500' };
    if (priority === 2) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-green-500' };
  };

  // Helper function to parse data if it's a string
  const getObjectiveData = (data: unknown): EnhancedSecurityObjectiveData => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as EnhancedSecurityObjectiveData;
      } catch (e) {
        console.error('Error parsing objective data:', e);
        return { description: '', status: 'New', priority: 3 };
      }
    }
    return (data as EnhancedSecurityObjectiveData) || { description: '', status: 'New', priority: 3 };
  };

  // Calculate risk level based on risk score
  const getRiskLevel = (score: number) => {
    if (score >= 15) return { level: 'Critical', color: 'bg-red-600' };
    if (score >= 10) return { level: 'High', color: 'bg-orange-500' };
    if (score >= 5) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-green-500' };
  };

  // Handler to create an objective from a risk
  const handleCreateObjective = async (risk: Risk) => {
    try {
      // Navigate to the objective creation page
      router.push(`/assessment/${assessmentId}/objective/create?riskId=${risk.id}`);
      
      // Remove the risk from the queue immediately to provide visual feedback
      setRiskQueue(prev => prev.filter(r => r.id !== risk.id));
    } catch (err) {
      console.error('Error handling risk:', err);
      setError('Failed to process the risk. Please try again.');
    }
  };

  // Get the status of an objective with proper styling
  const getStatusInfo = (status: string) => {
    switch(status.toLowerCase()) {
      case 'planning':
        return { label: 'Planning', color: 'text-blue-500', icon: <Clock className="h-4 w-4 mr-1" /> };
      case 'in progress':
        return { label: 'In Progress', color: 'text-amber-500', icon: <BarChart4 className="h-4 w-4 mr-1" /> };
      case 'completed':
        return { label: 'Completed', color: 'text-green-500', icon: <CheckCircle2 className="h-4 w-4 mr-1" /> };
      default:
        return { label: status, color: 'text-gray-500', icon: <ClipboardList className="h-4 w-4 mr-1" /> };
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Objectives</h1>
          <p className="text-muted-foreground mt-1">
            Manage security projects and initiatives
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => router.push(`/assessment/${assessmentId}/risk`)}>
            View All Risks
          </Button>
        </div>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 text-green-800 border border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {riskQueue.length > 0 && (
        <Alert className="bg-amber-50 text-amber-800 border border-amber-200 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            <strong>{riskQueue.length} risk{riskQueue.length > 1 ? 's' : ''}</strong> in the queue ready to be converted to security objectives.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative flex-1 mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search objectives and risks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading data...</div>
      ) : (
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="queue" className="flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Risk Queue
              {riskQueue.length > 0 && (
                <Badge className="ml-2 bg-red-500">{riskQueue.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex items-center">
              <ClipboardList className="h-4 w-4 mr-2" />
              Active Objectives
              {objectives.length > 0 && (
                <Badge className="ml-2">{objectives.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <ArrowUpRight className="h-5 w-5 mr-2 text-red-500" />
                  Risks Requiring Attention
                </CardTitle>
                <CardDescription>
                  Create security objectives from identified risks. 
                  {riskQueue.length > 0 ? 
                    ` ${riskQueue.length} risk${riskQueue.length > 1 ? 's' : ''} need attention.` : 
                    ' All risks have been addressed.'}
                </CardDescription>
                
                {riskQueue.length > 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Converting risks to objectives allows you to track mitigation efforts, assign resources, and monitor progress.
                    Each objective created from a risk will maintain a reference to the original risk for traceability.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {riskQueue.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No risks in the queue</p>
                    <p className="text-sm text-muted-foreground mt-2 mb-3">
                      All identified risks have been addressed or there are no risks requiring attention.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/assessment/${assessmentId}/risk`)}
                      className="mt-1"
                    >
                      Manage Risks
                    </Button>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {riskQueue.map(risk => {
                      const { level, color } = getRiskLevel(risk.data.risk_score);
                      return (
                        <AccordionItem key={risk.id} value={risk.id!} className="border rounded-md mb-3 overflow-hidden">
                          <div className="flex justify-between items-center p-4">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-lg font-medium">{risk.title}</h3>
                                <Badge className={`ml-2 ${color}`}>
                                  {level} ({risk.data.risk_score})
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {risk.description || 'No description provided'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => handleCreateObjective(risk)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                              >
                                <Plus className="h-4 w-4" />
                                Convert to Objective
                              </Button>
                              <AccordionTrigger className="h-9 w-9 p-0 m-0 justify-center" />
                            </div>
                          </div>
                          <AccordionContent className="border-t px-4 py-3 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Risk Details</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Impact:</span>
                                    <span className="text-sm font-medium">{risk.data.impact}/5</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Likelihood:</span>
                                    <span className="text-sm font-medium">{risk.data.likelihood}/5</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Notes</h4>
                                <p className="text-sm text-muted-foreground">
                                  {risk.data.notes || 'No additional notes provided'}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="objectives" className="mt-0">
            {filteredObjectives.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No security objectives found.</p>
                <p className="mt-2 text-muted-foreground">
                  Create objectives from risks in the queue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredObjectives.map(objective => {
                  const data = getObjectiveData(objective.data);
                  const { level, color } = getPriorityInfo(data.priority || 3);
                  const statusInfo = getStatusInfo(data.status);
                  
                  return (
                    <Card key={objective.id} className="group relative hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{objective.title}</CardTitle>
                          <Badge className={`${color} text-white`}>
                            {level} Priority
                          </Badge>
                        </div>
                        <CardDescription className="mt-1 flex items-center">
                          <span className={`flex items-center ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          {objective.description || 'No description provided.'}
                        </p>
                        
                        {data.progress !== undefined && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{data.progress}%</span>
                            </div>
                            <Progress value={data.progress} className="h-2" />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          {data.targetCompletionDate && (
                            <div className="flex items-center">
                              <CalendarClock className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Due: {new Date(data.targetCompletionDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          {data.budget?.allocated && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Budget: ${data.budget.allocated}
                              </span>
                            </div>
                          )}
                          
                          {data.milestones && (
                            <div className="flex items-center">
                              <ClipboardList className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Milestones: {data.milestones.length}
                              </span>
                            </div>
                          )}
                          
                          {data.assignees && data.assignees.length > 0 && (
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Team: {data.assignees.length}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {data.risk_notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                            <strong>Risk Notes:</strong> {String(data.risk_notes)}
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-2 flex justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/assessment/${assessmentId}/objective/${objective.id}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(objective.id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}