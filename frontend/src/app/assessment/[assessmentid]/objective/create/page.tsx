"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import apiService, { Risk, SecurityObjectiveData } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Enhanced objective data model matching the one in the objectives page
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

export default function CreateObjectivePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const assessmentId = params.assessmentid as string;
  const [clientId, setClientId] = useState<string | null>(null);
  const riskId = searchParams.get('riskId');

  const [sourceRisk, setSourceRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('3'); // Default to Low
  const [status, setStatus] = useState<string>('Planning'); // Default to Planning
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [budgetAllocated, setBudgetAllocated] = useState<string>('');
  const [budgetCurrency, setBudgetCurrency] = useState<string>('USD');
  const [milestones, setMilestones] = useState<Array<{
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }>>([]);

  // Fetch the source risk if riskId is provided
  useEffect(() => {
    const fetchSourceRisk = async () => {
      try {
        setLoading(true);
        const riskId = searchParams.get('riskId');

        // Fetch assessment to get client_id
        const assessment = await apiService.assessments.getById(assessmentId);
        setClientId(assessment?.client_id || null);
        
        if (!assessment?.client_id) {
          setError('This assessment is not associated with a client. Please link it to a client first.');
          setLoading(false);
          return;
        }

        if (riskId) {
          const risk = await apiService.risks.getById(riskId);
          if (risk) {
            setSourceRisk(risk);
            // Pre-fill form fields with risk details
            setTitle(`Mitigate: ${risk.title}`);
            setDescription(risk.description || '');
            setPriority(risk.data.risk_score > 12 ? '1' : risk.data.risk_score > 6 ? '2' : '3');
          }
        }
      } catch (err) {
        console.error('Error fetching risk:', err);
        setError('Failed to load risk details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSourceRisk();
  }, [assessmentId, searchParams]);

  const handleAddMilestone = () => {
    // Generate a random ID safely (works in both newer and older browsers)
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2);
      
    const newMilestone = {
      id: newId,
      title: '',
      dueDate: '',
      completed: false
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id));
  };

  const handleUpdateMilestone = (id: string, field: string, value: string | boolean) => {
    setMilestones(milestones.map(milestone => 
      milestone.id === id ? { ...milestone, [field]: value } : milestone
    ));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!clientId) {
      setError('Cannot create objective: No client associated with this assessment');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare objective data
      const objectiveData: EnhancedSecurityObjectiveData = {
        description: description,
        status: status,
        priority: parseInt(priority),
        startDate: startDate?.toISOString(),
        targetCompletionDate: targetDate?.toISOString(),
        budget: budgetAllocated ? {
          allocated: parseFloat(budgetAllocated),
          spent: 0,
          currency: budgetCurrency
        } : undefined,
        milestones: milestones.length > 0 ? milestones : undefined,
        progress: 0 // Start at 0%
      };

      // If created from a risk, include risk details
      if (sourceRisk) {
        objectiveData.risk_id = sourceRisk.id;
        objectiveData.risk_notes = sourceRisk.data.notes || `Risk Score: ${sourceRisk.data.risk_score}`;
      }

      // Create the objective
      await apiService.objectives.create({
        client_id: clientId,
        title: title,
        description: description,
        data: {
          ...objectiveData,
          status: status,
          priority: parseInt(priority),
          progress: 0
        }
      });

      // Navigate back to objectives page with success message
      router.push(`/assessment/${assessmentId}/objective?success=true&message=${encodeURIComponent(
        sourceRisk ? 
          `Risk "${sourceRisk.title}" successfully converted to an objective.` : 
          "New objective created successfully."
      )}`);
    } catch (err) {
      console.error('Error creating objective:', err);
      setError('Failed to create security objective. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Create Security Objective</h1>
          {sourceRisk && (
            <p className="text-muted-foreground mt-1">
              Creating from risk: <span className="font-medium">{sourceRisk.title}</span>
            </p>
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

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Objective Details</CardTitle>
                <CardDescription>Define the basic information for this security objective</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter objective title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe the objective and expected outcomes"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center">
                            <Badge className="bg-red-500 mr-2">High</Badge>
                            High Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center">
                            <Badge className="bg-yellow-500 mr-2">Medium</Badge>
                            Medium Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center">
                            <Badge className="bg-green-500 mr-2">Low</Badge>
                            Low Priority
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Set timeline, budget, and milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Completion Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {targetDate ? format(targetDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={targetDate}
                          onSelect={setTargetDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Budget</Label>
                  <div className="flex gap-2">
                    <div className="w-2/3">
                      <Input
                        type="number"
                        placeholder="Allocated budget"
                        value={budgetAllocated}
                        onChange={(e) => setBudgetAllocated(e.target.value)}
                      />
                    </div>
                    <div className="w-1/3">
                      <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Milestones</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={handleAddMilestone}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  {milestones.length === 0 ? (
                    <div className="text-center p-4 border-2 border-dashed rounded-md">
                      <p className="text-sm text-muted-foreground">No milestones added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start gap-2 p-3 border rounded-md">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Milestone title"
                              value={milestone.title}
                              onChange={(e) => handleUpdateMilestone(milestone.id, 'title', e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !milestone.dueDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {milestone.dueDate ? (
                                      format(new Date(milestone.dueDate), 'PPP')
                                    ) : (
                                      <span>Due date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={milestone.dueDate ? new Date(milestone.dueDate) : undefined}
                                    onSelect={(date) => 
                                      handleUpdateMilestone(
                                        milestone.id, 
                                        'dueDate', 
                                        date ? date.toISOString() : ''
                                      )
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMilestone(milestone.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 space-y-6">
            {sourceRisk && (
              <Card>
                <CardHeader>
                  <CardTitle>Source Risk</CardTitle>
                  <CardDescription>This objective is created from a risk</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">Risk Title</h3>
                      <p className="text-sm">{sourceRisk.title}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Risk Score</h3>
                      <div className="mt-1">
                        <Badge 
                          className={cn(
                            sourceRisk.data.risk_score >= 15 ? "bg-red-500" : 
                            sourceRisk.data.risk_score >= 8 ? "bg-orange-500" : 
                            sourceRisk.data.risk_score >= 4 ? "bg-yellow-500" : 
                            "bg-green-500"
                          )}
                        >
                          {sourceRisk.data.risk_score} / 25
                        </Badge>
                      </div>
                    </div>
                    
                    {sourceRisk.data.notes && (
                      <div>
                        <h3 className="text-sm font-medium">Risk Notes</h3>
                        <p className="text-sm text-muted-foreground">{sourceRisk.data.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Create Objective</CardTitle>
                <CardDescription>Save this security objective</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Review the details before creating this objective. Once created, you&apos;ll be able to track progress
                  and update it as needed.
                </p>
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Security Objective"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 