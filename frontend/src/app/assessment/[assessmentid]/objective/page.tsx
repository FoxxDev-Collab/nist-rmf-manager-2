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
  BarChart4,
  PieChart,
  ExternalLink
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from "@/components/ui/progress";
import ObjectivesOverview from '@/components/shared/ObjectivesOverview';

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
  const [completedObjectives, setCompletedObjectives] = useState<SecurityObjective[]>([]);
  const [activeObjectives, setActiveObjectives] = useState<SecurityObjective[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
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
        
        // Separate completed and active objectives
        const completed = objectivesData.filter(objective => {
          const data = getObjectiveData(objective.data);
          return data.status.toLowerCase() === 'completed';
        });
        
        const active = objectivesData.filter(objective => {
          const data = getObjectiveData(objective.data);
          return data.status.toLowerCase() !== 'completed';
        });
        
        setCompletedObjectives(completed);
        setActiveObjectives(active);
        
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
    if (!searchQuery) {
      // Reset to original state when search is cleared
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Filter objectives
    const filtered = objectives.filter(objective => 
      objective.title.toLowerCase().includes(query) || 
      (objective.description && objective.description.toLowerCase().includes(query))
    );
    
    // Also update completed and active objectives
    const completedFiltered = filtered.filter(objective => {
      const data = getObjectiveData(objective.data);
      return data.status.toLowerCase() === 'completed';
    });
    
    const activeFiltered = filtered.filter(objective => {
      const data = getObjectiveData(objective.data);
      return data.status.toLowerCase() !== 'completed';
    });
    
    setCompletedObjectives(completedFiltered);
    setActiveObjectives(activeFiltered);
    
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

  // Set the initial active tab when data is loaded
  useEffect(() => {
    if (!loading) {
      // Determine the default tab to show
      const getDefaultTab = () => {
        if (riskQueue.length > 0) return 'queue';
        if (activeObjectives.length > 0) return 'active';
        if (completedObjectives.length > 0) return 'completed';
        return 'overview'; // Default to overview if nothing else has content
      };
      
      setActiveTab(getDefaultTab());
    }
  }, [loading, riskQueue.length, activeObjectives.length, completedObjectives.length]);

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
          <Button onClick={() => router.push(`/assessment/${assessmentId}/objective/create`)}>
            <Plus className="h-4 w-4 mr-1" />
            New Objective
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/assessment/${assessmentId}/risk`)}
          >
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Risk Queue
              {riskQueue.length > 0 && (
                <Badge className="ml-2 bg-red-500">{riskQueue.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center">
              <BarChart4 className="h-4 w-4 mr-2" />
              In Progress
              {activeObjectives.length > 0 && (
                <Badge className="ml-2 bg-blue-500">{activeObjectives.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completed
              {completedObjectives.length > 0 && (
                <Badge className="ml-2 bg-green-500">{completedObjectives.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            {objectives.length === 0 ? (
              <div className="text-center py-12 border dark:border-border rounded-lg">
                <p className="text-muted-foreground">No security objectives found.</p>
                <div className="mt-4 flex justify-center space-x-4">
                  <Button 
                    onClick={() => router.push(`/assessment/${assessmentId}/objective/create`)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Objective
                  </Button>
                  {riskQueue.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('queue')}
                      className="gap-1"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View Risk Queue
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ObjectivesOverview objectives={objectives} />
            )}
          </TabsContent>
          
          {/* Risk Queue Tab */}
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
                  <div className="text-center py-8 border-2 border-dashed dark:border-border/50 rounded-lg">
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
                  <div className="space-y-3">
                    {riskQueue.map(risk => {
                      const { level, color } = getRiskLevel(risk.data.risk_score);
                      return (
                        <div key={risk.id} className="border dark:border-border rounded-md overflow-hidden">
                          <div className="flex justify-between items-center p-4">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-lg font-medium">{risk.title}</h3>
                                <Badge className={`ml-2 ${color} text-white dark:text-white`}>
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
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1 dark:bg-blue-700 dark:hover:bg-blue-800"
                              >
                                <Plus className="h-4 w-4" />
                                Convert to Objective
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/assessment/${assessmentId}/risk`)}
                                className="gap-1"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Risks
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Active Objectives Tab */}
          <TabsContent value="active" className="mt-0">
            {activeObjectives.length === 0 ? (
              <div className="text-center py-12 border dark:border-border rounded-lg">
                <p className="text-muted-foreground">No active objectives found.</p>
                <div className="mt-4 flex justify-center space-x-4">
                  <Button 
                    onClick={() => router.push(`/assessment/${assessmentId}/objective/create`)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Objective
                  </Button>
                  {riskQueue.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('queue')}
                      className="gap-1"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View Risk Queue
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeObjectives.map(objective => {
                  const data = getObjectiveData(objective.data);
                  const { level, color } = getPriorityInfo(data.priority || 3);
                  const statusInfo = getStatusInfo(data.status);
                  
                  return (
                    <Card key={objective.id} className="group relative hover:shadow-md transition-shadow border dark:border-border">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{objective.title}</CardTitle>
                          <Badge className={`${color} text-white dark:text-white`}>
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
                              <span className="text-foreground dark:text-foreground">Progress</span>
                              <span className="text-foreground dark:text-foreground">{data.progress}%</span>
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
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                            <strong className="text-foreground dark:text-foreground">Risk Notes:</strong> <span className="text-foreground dark:text-foreground">{String(data.risk_notes)}</span>
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
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
          
          {/* Completed Objectives Tab */}
          <TabsContent value="completed" className="mt-0">
            {completedObjectives.length === 0 ? (
              <div className="text-center py-12 border dark:border-border rounded-lg">
                <p className="text-muted-foreground">No completed objectives found.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Objectives will appear here when they are marked as completed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      Completed Objectives
                    </CardTitle>
                    <CardDescription>
                      Showing {completedObjectives.length} completed security objectives
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {completedObjectives.map(objective => {
                        const data = getObjectiveData(objective.data);
                        
                        return (
                          <div 
                            key={objective.id} 
                            className="flex justify-between items-center p-4 border dark:border-border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-lg font-medium">{objective.title}</h3>
                                <Badge className="ml-2 bg-green-500 text-white dark:text-white">Completed</Badge>
                                {data.targetCompletionDate && data.actualCompletionDate && (
                                  <Badge className="ml-2 bg-blue-500 text-white dark:text-white" variant="outline">
                                    {new Date(data.actualCompletionDate) <= new Date(data.targetCompletionDate) 
                                      ? 'On Time' 
                                      : 'Overdue'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {objective.description || 'No description provided.'}
                              </p>
                              <div className="flex mt-2 text-xs text-muted-foreground gap-3">
                                {data.actualCompletionDate && (
                                  <div className="flex items-center">
                                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                    Completed: {new Date(data.actualCompletionDate).toLocaleDateString()}
                                  </div>
                                )}
                                {data.risk_id && (
                                  <div className="flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    From Risk
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/assessment/${assessmentId}/objective/${objective.id}`)}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Completed Objectives Metrics */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Completion Metrics</CardTitle>
                    <CardDescription>Performance summary of completed objectives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-100 dark:border-green-900">
                        <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">On Time Completion</h3>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {completedObjectives.filter(obj => {
                              const data = getObjectiveData(obj.data);
                              if (!data.targetCompletionDate || !data.actualCompletionDate) return false;
                              return new Date(data.actualCompletionDate) <= new Date(data.targetCompletionDate);
                            }).length}
                          </span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {completedObjectives.filter(obj => {
                              const data = getObjectiveData(obj.data);
                              return data.targetCompletionDate && data.actualCompletionDate;
                            }).length > 0 ? 
                              `${Math.round((completedObjectives.filter(obj => {
                                const data = getObjectiveData(obj.data);
                                if (!data.targetCompletionDate || !data.actualCompletionDate) return false;
                                return new Date(data.actualCompletionDate) <= new Date(data.targetCompletionDate);
                              }).length / completedObjectives.filter(obj => {
                                const data = getObjectiveData(obj.data);
                                return data.targetCompletionDate && data.actualCompletionDate;
                              }).length) * 100)}%` : 
                              '0%'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-900">
                        <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Avg. Completion Time</h3>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {completedObjectives.filter(obj => {
                              const data = getObjectiveData(obj.data);
                              return data.startDate && data.actualCompletionDate;
                            }).length > 0 ? 
                              Math.round(completedObjectives.filter(obj => {
                                const data = getObjectiveData(obj.data);
                                return data.startDate && data.actualCompletionDate;
                              }).reduce((acc, obj) => {
                                const data = getObjectiveData(obj.data);
                                const start = new Date(data.startDate!);
                                const end = new Date(data.actualCompletionDate!);
                                return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                              }, 0) / completedObjectives.filter(obj => {
                                const data = getObjectiveData(obj.data);
                                return data.startDate && data.actualCompletionDate;
                              }).length) : 
                              0}
                          </span>
                          <span className="text-sm text-blue-600 dark:text-blue-400">days</span>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md border border-purple-100 dark:border-purple-900">
                        <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">From Risks</h3>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {completedObjectives.filter(obj => {
                              const data = getObjectiveData(obj.data);
                              return data.risk_id;
                            }).length}
                          </span>
                          <span className="text-sm text-purple-600 dark:text-purple-400">
                            {completedObjectives.length > 0 ? 
                              `${Math.round((completedObjectives.filter(obj => {
                                const data = getObjectiveData(obj.data);
                                return data.risk_id;
                              }).length / completedObjectives.length) * 100)}%` : 
                              '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}