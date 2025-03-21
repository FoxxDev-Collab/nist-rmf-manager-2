"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiService, { SecurityObjective, SecurityObjectiveData } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  DollarSign, 
  BarChart4, 
  Clock, 
  CheckCircle2, 
  Info, 
  AlertCircle,
  Edit,
  Save,
  Plus,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

// Enhanced objective data model with project management fields
interface EnhancedSecurityObjectiveData extends SecurityObjectiveData {
  risk_notes?: string;
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
  risk_id?: string;
  progress?: number;
}

export default function ObjectiveDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentid as string;
  const objectiveId = params.objectiveid as string;
  
  const [objective, setObjective] = useState<SecurityObjective | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state for edit mode
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
  }>({
    title: '',
    description: '',
    status: 'Planning',
    priority: '3',
    progress: 0
  });
  
  // Fetch objective details
  useEffect(() => {
    const fetchObjectiveDetails = async () => {
      try {
        setLoading(true);
        const data = await apiService.objectives.getById(objectiveId);
        setObjective(data);
        
        // Initialize form data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          status: getObjectiveData(data.data).status || 'Planning',
          priority: String(getObjectiveData(data.data).priority || 3),
          progress: getObjectiveData(data.data).progress || 0
        });
      } catch (err) {
        console.error('Error fetching objective details:', err);
        setError('Failed to load objective details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchObjectiveDetails();
  }, [objectiveId]);
  
  // Helper function to parse data if it's a string
  const getObjectiveData = (data: unknown): EnhancedSecurityObjectiveData => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as EnhancedSecurityObjectiveData;
      } catch (e) {
        console.error('Error parsing objective data:', e);
        return { 
          description: '', 
          status: 'New', 
          priority: 3 
        };
      }
    }
    return (data as EnhancedSecurityObjectiveData) || { 
      description: '', 
      status: 'New', 
      priority: 3 
    };
  };
  
  // Get priority level and color
  const getPriorityInfo = (priority: number) => {
    if (priority === 1) return { level: 'High', color: 'bg-red-500' };
    if (priority === 2) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-green-500' };
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleProgressChange = (value: number) => {
    setFormData({
      ...formData,
      progress: value
    });
  };
  
  const handleSave = async () => {
    if (!objective) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare updated objective data
      const objectiveData = getObjectiveData(objective.data);
      const updatedData: EnhancedSecurityObjectiveData = {
        description: formData.description || '',
        status: formData.status,
        priority: parseInt(formData.priority),
        progress: formData.progress,
        // Preserve other fields from the original data
        risk_notes: objectiveData.risk_notes,
        startDate: objectiveData.startDate,
        targetCompletionDate: objectiveData.targetCompletionDate,
        actualCompletionDate: objectiveData.actualCompletionDate,
        budget: objectiveData.budget,
        milestones: objectiveData.milestones,
        assignees: objectiveData.assignees,
        risk_id: objectiveData.risk_id
      };
      
      // Since there's no update method, use delete and create
      await apiService.objectives.delete(objectiveId);
      
      // Create new objective with the same ID to maintain continuity
      const now = new Date().toISOString();
      await apiService.objectives.create({
        title: formData.title,
        description: formData.description || '',
        data: updatedData,
        created_at: objective.created_at || now,
        updated_at: now
      });
      
      // Refresh objective data
      const updated = await apiService.objectives.getById(objectiveId);
      setObjective(updated);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating objective:', err);
      setError('Failed to update objective. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Reset form data to current objective values
    if (objective) {
      setFormData({
        title: objective.title || '',
        description: objective.description || '',
        status: getObjectiveData(objective.data).status || 'Planning',
        priority: String(getObjectiveData(objective.data).priority || 3),
        progress: getObjectiveData(objective.data).progress || 0
      });
    }
    setEditMode(false);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p>Loading objective details...</p>
      </div>
    );
  }
  
  if (!objective) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Objective not found. It may have been deleted or you don&apos;t have access to it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button 
            onClick={() => router.push(`/assessment/${assessmentId}/objective`)}
            variant="secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Objectives
          </Button>
        </div>
      </div>
    );
  }
  
  const objectiveData = getObjectiveData(objective.data);
  const { level, color } = getPriorityInfo(objectiveData.priority || 3);
  const statusInfo = getStatusInfo(objectiveData.status || 'New');
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/assessment/${assessmentId}/objective`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Objectives
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          {editMode ? (
            <Input 
              value={formData.title}
              name="title"
              onChange={handleInputChange}
              className="text-3xl font-bold h-auto py-1 px-2"
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight">{objective.title}</h1>
          )}
          <div className="flex items-center mt-2 space-x-2">
            <Badge className={color}>{level} Priority</Badge>
            <span className={`flex items-center ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          {editMode ? (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Objective
            </Button>
          )}
        </div>
      </div>
      
      <Separator />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center">
            <ClipboardList className="h-4 w-4 mr-2" />
            Milestones {objectiveData.milestones && (
              <Badge className="ml-2" variant="outline">{objectiveData.milestones.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea 
                  value={formData.description}
                  name="description"
                  onChange={handleInputChange}
                  rows={5}
                />
              ) : (
                <p>{objective.description || 'No description provided.'}</p>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status & Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => handleSelectChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => handleSelectChange('priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">High</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="3">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Progress ({formData.progress}%)</Label>
                      <Input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={formData.progress}
                        onChange={(e) => handleProgressChange(Number(e.target.value))}
                      />
                      <Progress value={formData.progress} className="h-2" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Status</h3>
                      <div className={`flex items-center ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Priority</h3>
                      <Badge className={color}>{level}</Badge>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <h3 className="font-medium">Progress</h3>
                        <span>{objectiveData.progress || 0}%</span>
                      </div>
                      <Progress value={objectiveData.progress || 0} className="h-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Start Date</h3>
                  <p className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                    {objectiveData.startDate ? (
                      format(new Date(objectiveData.startDate), 'PPP')
                    ) : (
                      'Not set'
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Target Completion</h3>
                  <p className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                    {objectiveData.targetCompletionDate ? (
                      format(new Date(objectiveData.targetCompletionDate), 'PPP')
                    ) : (
                      'Not set'
                    )}
                  </p>
                </div>
                
                {objectiveData.budget && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Budget</h3>
                    <p className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      {objectiveData.budget.allocated.toLocaleString()} {objectiveData.budget.currency}
                      {objectiveData.budget.spent > 0 && (
                        <span className="text-muted-foreground ml-1">
                          ({objectiveData.budget.spent.toLocaleString()} spent)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {objectiveData.risk_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Source Risk Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{objectiveData.risk_notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Project Milestones</CardTitle>
              {!editMode && (
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Milestone
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!objectiveData.milestones || objectiveData.milestones.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No milestones defined yet</p>
                  {!editMode && (
                    <Button variant="link" size="sm" className="mt-2">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add First Milestone
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {objectiveData.milestones.map((milestone) => (
                    <div 
                      key={milestone.id} 
                      className="p-4 border rounded-md flex items-start justify-between"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium">{milestone.title}</h3>
                        {milestone.dueDate && (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                            Due: {format(new Date(milestone.dueDate), 'PPP')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={milestone.completed ? "default" : "outline"}
                          className={milestone.completed ? "bg-green-500" : ""}
                        >
                          {milestone.completed ? "Completed" : "Pending"}
                        </Badge>
                        {!editMode && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 