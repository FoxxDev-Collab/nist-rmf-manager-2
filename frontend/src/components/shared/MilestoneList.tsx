import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, Plus, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Define types for our component
export interface TaskData {
  id: string;
  title: string;
  description?: string;
  status: "In Progress" | "Completed" | "Not Started" | "Blocked" | "Deferred";
  priority: number;
  due_date?: string | null;
  completion_percentage: number;
  assigned_to?: string | null;
}

export interface MilestoneData {
  id: string;
  title: string;
  description?: string;
  status: "In Progress" | "Completed" | "Not Started" | "Blocked" | "Deferred";
  start_date?: string | null;
  due_date?: string | null;
  completion_percentage: number;
  priority: number;
  assigned_to?: string | null;
  tasks: TaskData[];
}

interface MilestoneListProps {
  milestones: MilestoneData[];
  onMilestonesChange: (milestones: MilestoneData[]) => void;
  readOnly?: boolean;
}

export function MilestoneList({ milestones, onMilestonesChange, readOnly = false }: MilestoneListProps) {
  const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2);
  };
  
  const handleAddMilestone = () => {
    const newMilestone: MilestoneData = {
      id: generateId(),
      title: 'New Milestone',
      description: '',
      status: 'Not Started',
      start_date: null,
      due_date: null,
      completion_percentage: 0,
      priority: 1,
      assigned_to: null,
      tasks: []
    };
    
    onMilestonesChange([...milestones, newMilestone]);
  };
  
  const handleDeleteMilestone = (id: string) => {
    onMilestonesChange(milestones.filter(m => m.id !== id));
  };
  
  const handleUpdateMilestone = (id: string, field: keyof MilestoneData, value: string | number | null) => {
    onMilestonesChange(
      milestones.map(m => 
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };
  
  const handleAddTask = (milestoneId: string) => {
    const newTask: TaskData = {
      id: generateId(),
      title: 'New Task',
      description: '',
      status: 'Not Started',
      priority: 1,
      due_date: null,
      completion_percentage: 0,
      assigned_to: null
    };
    
    onMilestonesChange(
      milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, tasks: [...m.tasks, newTask] } 
          : m
      )
    );
  };
  
  const handleDeleteTask = (milestoneId: string, taskId: string) => {
    onMilestonesChange(
      milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, tasks: m.tasks.filter(t => t.id !== taskId) } 
          : m
      )
    );
  };
  
  const handleUpdateTask = (milestoneId: string, taskId: string, field: keyof TaskData, value: string | number | null) => {
    onMilestonesChange(
      milestones.map(m => 
        m.id === milestoneId 
          ? { 
              ...m, 
              tasks: m.tasks.map(t => 
                t.id === taskId 
                  ? { ...t, [field]: value } 
                  : t
              ) 
            } 
          : m
      )
    );
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Blocked': return 'bg-red-500';
      case 'Deferred': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };
  
  const calculateMilestoneProgress = (milestone: MilestoneData) => {
    if (milestone.status === 'Completed') return 100;
    if (milestone.status === 'Not Started') return 0;
    
    if (milestone.tasks.length === 0) {
      return milestone.completion_percentage || 0;
    }
    
    const taskTotal = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = milestone.tasks.filter(t => t.status === 'In Progress');
    
    const completedPercent = (completedTasks / taskTotal) * 100;
    const inProgressPercent = inProgressTasks.length > 0 
      ? (inProgressTasks.reduce((sum, task) => sum + (task.completion_percentage || 0), 0) / inProgressTasks.length) * (inProgressTasks.length / taskTotal)
      : 0;
    
    return Math.round(completedPercent + inProgressPercent);
  };
  
  const updateMilestoneProgress = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    const progress = calculateMilestoneProgress(milestone);
    handleUpdateMilestone(milestoneId, 'completion_percentage', progress);
    
    if (progress === 100 && milestone.status !== 'Completed') {
      handleUpdateMilestone(milestoneId, 'status', 'Completed');
    } else if (progress > 0 && progress < 100 && milestone.status !== 'In Progress') {
      handleUpdateMilestone(milestoneId, 'status', 'In Progress');
    }
  };

  // Calculate overall progress percentage
  const calculateOverallProgress = (): number => {
    if (!milestones.length) return 0;
    
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
    const inProgressMilestones = milestones.filter(m => m.status === 'In Progress').length;
    
    // Calculate completion based on milestone status
    const completedPercentage = (completedMilestones / totalMilestones) * 100;
    const inProgressContribution = (inProgressMilestones / totalMilestones) * 
      (milestones.filter(m => m.status === 'In Progress')
        .reduce((acc, curr) => acc + calculateMilestoneProgress(curr), 0) / 
        (inProgressMilestones || 1)) * 0.5;
    
    return Math.round(completedPercentage + inProgressContribution);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Milestones</h2>
        {!readOnly && (
          <Button onClick={handleAddMilestone}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        )}
      </div>
      
      <Progress value={calculateOverallProgress()} className="h-2" />
      
      {milestones.length === 0 ? (
        <div className="p-12 border-2 border-dashed rounded-lg text-center">
          <p className="text-muted-foreground mb-4">No milestones have been created yet</p>
          {!readOnly && (
            <Button onClick={handleAddMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Milestone
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="space-y-1 flex-1">
                    {readOnly ? (
                      <CardTitle className="text-xl">{milestone.title}</CardTitle>
                    ) : (
                      <Input
                        value={milestone.title}
                        onChange={(e) => handleUpdateMilestone(milestone.id, 'title', e.target.value)}
                        placeholder="Milestone title"
                        className="text-xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
                      />
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge className={cn("text-white", getStatusColor(milestone.status))}>
                        {milestone.status}
                      </Badge>
                      {milestone.due_date && (
                        <span className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!readOnly && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                
                <div className="mt-2">
                  {readOnly ? (
                    <p className="text-sm">{milestone.description || 'No description provided'}</p>
                  ) : (
                    <Textarea
                      value={milestone.description || ''}
                      onChange={(e) => handleUpdateMilestone(milestone.id, 'description', e.target.value)}
                      placeholder="Milestone description"
                      className="min-h-[80px] text-sm"
                    />
                  )}
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-medium">{milestone.completion_percentage}%</span>
                  </div>
                  <Progress value={milestone.completion_percentage} className="h-2" />
                </div>
                
                {!readOnly && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {milestone.due_date ? format(new Date(milestone.due_date), 'MMM dd, yyyy') : 'Set due date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={milestone.due_date ? new Date(milestone.due_date) : undefined}
                          onSelect={(date) => handleUpdateMilestone(milestone.id, 'due_date', date?.toISOString() || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Select
                      value={milestone.status}
                      onValueChange={(value) => handleUpdateMilestone(milestone.id, 'status', value)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                        <SelectItem value="Deferred">Deferred</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={milestone.priority.toString()}
                      onValueChange={(value) => handleUpdateMilestone(milestone.id, 'priority', parseInt(value))}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">High</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Tasks</h3>
                    {!readOnly && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAddTask(milestone.id)}
                        className="h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Task
                      </Button>
                    )}
                  </div>
                  
                  {milestone.tasks.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                      No tasks have been created yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {milestone.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-3 border rounded-md flex items-start justify-between"
                        >
                          <div className="flex-1 space-y-1">
                            {readOnly ? (
                              <div className="font-medium">{task.title}</div>
                            ) : (
                              <Input
                                value={task.title}
                                onChange={(e) => handleUpdateTask(milestone.id, task.id, 'title', e.target.value)}
                                className="border-none p-0 h-auto focus-visible:ring-0 font-medium"
                              />
                            )}
                            
                            <div className="flex gap-2 text-xs">
                              <Badge className={cn("text-white", getStatusColor(task.status))}>
                                {task.status}
                              </Badge>
                              {task.due_date && (
                                <span className="flex items-center text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {format(new Date(task.due_date), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                            
                            {!readOnly && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-xs h-7">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      {task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'Due date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={task.due_date ? new Date(task.due_date) : undefined}
                                      onSelect={(date) => handleUpdateTask(milestone.id, task.id, 'due_date', date?.toISOString() || null)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => {
                                    handleUpdateTask(milestone.id, task.id, 'status', value);
                                    if (value === 'Completed') {
                                      handleUpdateTask(milestone.id, task.id, 'completion_percentage', 100);
                                    } else if (value === 'Not Started') {
                                      handleUpdateTask(milestone.id, task.id, 'completion_percentage', 0);
                                    }
                                    // After updating task, update milestone progress
                                    setTimeout(() => updateMilestoneProgress(milestone.id), 0);
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs w-[130px]">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Blocked">Blocked</SelectItem>
                                    <SelectItem value="Deferred">Deferred</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select
                                  value={task.priority.toString()}
                                  onValueChange={(value) => handleUpdateTask(milestone.id, task.id, 'priority', parseInt(value))}
                                >
                                  <SelectTrigger className="h-7 text-xs w-[100px]">
                                    <SelectValue placeholder="Priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">High</SelectItem>
                                    <SelectItem value="2">Medium</SelectItem>
                                    <SelectItem value="3">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(milestone.id, task.id)}
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 