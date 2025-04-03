"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiService, { SecurityObjective, SecurityObjectiveData as ApiSecurityObjectiveData } from '@/services/api';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  ArrowLeft, 
  CalendarIcon, 
  ClipboardList, 
  DollarSign, 
  BarChart4, 
  Clock, 
  CheckCircle2, 
  Info, 
  AlertCircle,
  Edit,
  Save,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MilestoneList } from '@/components/shared/MilestoneList';
import { MilestoneData } from '@/components/shared/MilestoneList';

// Define type for the OLD milestone structure for compatibility
interface OldMilestoneFormat {
  id: string;
  title: string;
  dueDate?: string; // Optional to match potential old data
  completed?: boolean; // Optional to match potential old data
}

// Rename local interface to avoid conflict
interface LocalSecurityObjectiveData {
  description: string;
  status: string;
  priority: number;
  progress?: number;
  risk_notes?: string;
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  milestones?: MilestoneData[];
  assignees?: string[];
  risk_id?: string;
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
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  
  // Form state for edit mode
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: '1',
    progress: 0,
    risk_notes: '',
    startDate: '',
    targetCompletionDate: '',
    actualCompletionDate: '',
    budget: { allocated: 0, spent: 0, currency: 'USD' }
  });
  
  // Fetch objective details
  useEffect(() => {
    const fetchObjectiveDetails = async () => {
      try {
        setLoading(true);
        const data = await apiService.objectives.getById(objectiveId);
        setObjective(data);
        
        const objectiveData = getObjectiveData(data.data);
        
        // Convert existing milestones data to the new format if needed
        if (objectiveData.milestones && Array.isArray(objectiveData.milestones)) {
          // Map old milestone format to new format if needed
          // Use a union type for the milestone parameter
          const formattedMilestones = objectiveData.milestones.map((milestone: OldMilestoneFormat | MilestoneData) => {
            if ('status' in milestone) {
              // Already in new format (MilestoneData)
              return milestone as MilestoneData;
            } else {
              // Convert from old format
              return {
                id: milestone.id,
                title: milestone.title,
                description: '',
                status: milestone.completed ? 'Completed' as const : 'Not Started' as const,
                due_date: milestone.dueDate || null,
                start_date: null,
                completion_percentage: milestone.completed ? 100 : 0,
                priority: 1,
                assigned_to: null,
                tasks: []
              };
            }
          });
          setMilestones(formattedMilestones);
        }
        
        // Initialize form data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          status: objectiveData.status || 'Not Started',
          priority: String(objectiveData.priority || 1),
          progress: objectiveData.progress || 0,
          risk_notes: objectiveData.risk_notes || '',
          startDate: objectiveData.startDate || '',
          targetCompletionDate: objectiveData.targetCompletionDate || '',
          actualCompletionDate: objectiveData.actualCompletionDate || '',
          budget: objectiveData.budget || { allocated: 0, spent: 0, currency: 'USD' }
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
  
  // Get full objective data
  const getObjectiveData = (data: ApiSecurityObjectiveData): LocalSecurityObjectiveData => {
    return {
      description: data.description || '',
      status: data.status || 'Not Started',
      priority: data.priority || 1,
      progress: data.progress !== undefined ? data.progress : 0,
      risk_notes: data.risk_notes || '',
      startDate: data.startDate || '',
      targetCompletionDate: data.targetCompletionDate || '',
      actualCompletionDate: data.actualCompletionDate || '',
      budget: data.budget || { allocated: 0, spent: 0, currency: 'USD' },
      milestones: data.milestones || [],
      assignees: data.assignees || [],
      risk_id: data.risk_id
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
  
  // Calculate progress from milestones
  const calculateProgressFromMilestones = (milestonesList: MilestoneData[] = []) => {
    if (!milestonesList.length) return 0;
    
    const totalMilestones = milestonesList.length;
    const completedMilestones = milestonesList.filter(m => m.status === 'Completed').length;
    const inProgressMilestones = milestonesList.filter(m => m.status === 'In Progress').length;
    
    const completedPercentage = (completedMilestones / totalMilestones) * 100;
    const inProgressContribution = (inProgressMilestones / totalMilestones) * 
      (milestonesList.filter(m => m.status === 'In Progress')
        .reduce((acc, curr) => acc + (curr.completion_percentage || 0), 0) / 
        (inProgressMilestones || 1)) * 0.5;
    
    return Math.round(completedPercentage + inProgressContribution);
  };
  
  // Handle saving the objective with updated milestones
  const handleSave = async () => {
    if (!objective) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare updated objective data
      const objectiveData = getObjectiveData(objective.data);
      
      // Calculate progress from milestones
      const calculatedProgress = calculateProgressFromMilestones(milestones);
      
      const updatedData: LocalSecurityObjectiveData = {
        description: formData.description || '',
        status: formData.status,
        priority: parseInt(formData.priority),
        progress: calculatedProgress, // Use calculated progress instead of form data
        // Preserve and update fields
        risk_notes: objectiveData.risk_notes,
        startDate: formData.startDate,
        targetCompletionDate: formData.targetCompletionDate,
        actualCompletionDate: formData.actualCompletionDate,
        budget: formData.budget || { allocated: 0, spent: 0, currency: 'USD' },
        milestones: milestones,
        assignees: objectiveData.assignees,
        risk_id: objectiveData.risk_id
      };
      
      // Update the objective using the update method
      const updated = await apiService.objectives.update(objectiveId, {
        client_id: objective.client_id,
        title: objective.title,
        description: updatedData.description,
        data: updatedData as ApiSecurityObjectiveData
      });
      
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
        status: getObjectiveData(objective.data).status || 'Not Started',
        priority: String(getObjectiveData(objective.data).priority || 1),
        progress: getObjectiveData(objective.data).progress || 0,
        risk_notes: getObjectiveData(objective.data).risk_notes || '',
        startDate: getObjectiveData(objective.data).startDate || '',
        targetCompletionDate: getObjectiveData(objective.data).targetCompletionDate || '',
        actualCompletionDate: getObjectiveData(objective.data).actualCompletionDate || '',
        budget: getObjectiveData(objective.data).budget || { allocated: 0, spent: 0, currency: 'USD' }
      });
    }
    setEditMode(false);
  };
  
  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData({
      ...formData,
      [field]: date ? date.toISOString() : undefined
    });
  };

  const handleBudgetChange = (field: string, value: string) => {
    // Ensure budget object exists
    const currentBudget = formData.budget || { allocated: 0, spent: 0, currency: 'USD' };
    
    setFormData({
      ...formData,
      budget: {
        ...currentBudget,
        [field]: field === 'allocated' || field === 'spent' ? parseFloat(value) || 0 : value
      }
    });
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
  const { level, color } = getPriorityInfo(objectiveData.priority || 1);
  const statusInfo = getStatusInfo(objectiveData.status || 'Not Started');
  
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
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="startDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? (
                              format(new Date(formData.startDate), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.startDate ? new Date(formData.startDate) : undefined}
                            onSelect={(date) => handleDateChange('startDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetCompletionDate">Target Completion Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="targetCompletionDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.targetCompletionDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.targetCompletionDate ? (
                              format(new Date(formData.targetCompletionDate), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.targetCompletionDate ? new Date(formData.targetCompletionDate) : undefined}
                            onSelect={(date) => handleDateChange('targetCompletionDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {formData.status === 'Completed' && (
                      <div className="space-y-2">
                        <Label htmlFor="actualCompletionDate">Actual Completion Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="actualCompletionDate"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.actualCompletionDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.actualCompletionDate ? (
                                format(new Date(formData.actualCompletionDate), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.actualCompletionDate ? new Date(formData.actualCompletionDate) : undefined}
                              onSelect={(date) => handleDateChange('actualCompletionDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget-allocated">Budget</Label>
                      <div className="flex gap-2">
                        <Input
                          id="budget-allocated"
                          type="number"
                          placeholder="Allocated amount"
                          value={formData.budget?.allocated || ''}
                          onChange={(e) => handleBudgetChange('allocated', e.target.value)}
                          className="flex-1"
                        />
                        <Select 
                          value={formData.budget?.currency || 'USD'} 
                          onValueChange={(value) => handleBudgetChange('currency', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {(formData.budget?.allocated ?? 0) > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="budget-spent">Budget Spent</Label>
                        <Input
                          id="budget-spent"
                          type="number"
                          placeholder="Spent amount"
                          value={formData.budget?.spent || ''}
                          onChange={(e) => handleBudgetChange('spent', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
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
        
        <TabsContent value="milestones" className="space-y-5">
          <MilestoneList 
            milestones={milestones} 
            onMilestonesChange={(updatedMilestones) => {
              setMilestones(updatedMilestones);
              // Also update the progress based on milestone completion
              const progress = calculateProgressFromMilestones(updatedMilestones);
              setFormData({
                ...formData,
                progress
              });
            }}
            readOnly={!editMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 