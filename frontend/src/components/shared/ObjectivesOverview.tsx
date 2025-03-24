import React from 'react';
import { SecurityObjective } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Type for the parsed objective data
interface EnhancedSecurityObjectiveData {
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
  milestones?: Array<{
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }>;
  assignees?: string[];
  risk_id?: string;
}

interface ObjectivesOverviewProps {
  objectives: SecurityObjective[];
}

const ObjectivesOverview: React.FC<ObjectivesOverviewProps> = ({ objectives }) => {
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

  // Calculate key metrics
  const calculateMetrics = () => {
    const total = objectives.length;
    let completed = 0;
    let inProgress = 0;
    let planning = 0;
    
    let highPriority = 0;
    let mediumPriority = 0;
    let lowPriority = 0;
    
    let totalProgress = 0;
    let objectivesWithProgress = 0;
    
    let completedOnTime = 0;
    let pastDue = 0;
    let dueSoon = 0;  // Due in the next 14 days
    
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);
    
    objectives.forEach(objective => {
      const data = getObjectiveData(objective.data);
      
      // Status counts
      if (data.status.toLowerCase() === 'completed') {
        completed++;
      } else if (data.status.toLowerCase() === 'in progress') {
        inProgress++;
      } else if (data.status.toLowerCase() === 'planning') {
        planning++;
      }
      
      // Priority counts
      if (data.priority === 1) {
        highPriority++;
      } else if (data.priority === 2) {
        mediumPriority++;
      } else {
        lowPriority++;
      }
      
      // Progress average
      if (data.progress !== undefined) {
        totalProgress += data.progress;
        objectivesWithProgress++;
      }
      
      // Due date metrics
      if (data.targetCompletionDate) {
        const dueDate = new Date(data.targetCompletionDate);
        
        if (data.status.toLowerCase() === 'completed') {
          if (data.actualCompletionDate) {
            const actualDate = new Date(data.actualCompletionDate);
            if (actualDate <= dueDate) {
              completedOnTime++;
            }
          }
        } else if (dueDate < now) {
          pastDue++;
        } else if (dueDate <= twoWeeksFromNow) {
          dueSoon++;
        }
      }
    });
    
    return {
      total,
      completed,
      inProgress,
      planning,
      highPriority,
      mediumPriority,
      lowPriority,
      averageProgress: objectivesWithProgress > 0 ? Math.round(totalProgress / objectivesWithProgress) : 0,
      completedOnTime,
      pastDue,
      dueSoon
    };
  };
  
  const metrics = calculateMetrics();
  
  // Calculate completion rate for progress bar
  const completionRate = metrics.total > 0 
    ? Math.round((metrics.completed / metrics.total) * 100) 
    : 0;
  
  // Get status distribution for visualization
  const statusDistribution = [
    { status: 'Completed', count: metrics.completed, color: 'bg-green-500' },
    { status: 'In Progress', count: metrics.inProgress, color: 'bg-amber-500' },
    { status: 'Planning', count: metrics.planning, color: 'bg-blue-500' },
    { status: 'Other', count: metrics.total - metrics.completed - metrics.inProgress - metrics.planning, color: 'bg-gray-400' }
  ].filter(item => item.count > 0);
  
  // Get priority distribution for visualization
  const priorityDistribution = [
    { priority: 'High', count: metrics.highPriority, color: 'bg-red-500' },
    { priority: 'Medium', count: metrics.mediumPriority, color: 'bg-yellow-500' },
    { priority: 'Low', count: metrics.lowPriority, color: 'bg-green-500' }
  ].filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
          <CardDescription>Summary of security objectives status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Completion Rate</span>
            <span className="text-sm font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2 mb-4" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 rounded-md p-3 flex flex-col">
              <span className="text-xs text-blue-600 font-medium">Total</span>
              <span className="text-2xl font-bold">{metrics.total}</span>
            </div>
            <div className="bg-green-50 rounded-md p-3 flex flex-col">
              <span className="text-xs text-green-600 font-medium">Completed</span>
              <span className="text-2xl font-bold">{metrics.completed}</span>
            </div>
            <div className="bg-amber-50 rounded-md p-3 flex flex-col">
              <span className="text-xs text-amber-600 font-medium">In Progress</span>
              <span className="text-2xl font-bold">{metrics.inProgress}</span>
            </div>
            <div className="bg-blue-50 rounded-md p-3 flex flex-col">
              <span className="text-xs text-blue-600 font-medium">Avg. Progress</span>
              <span className="text-2xl font-bold">{metrics.averageProgress}%</span>
            </div>
          </div>
          
          {/* Status Distribution */}
          <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
          <div className="h-6 flex rounded-full overflow-hidden mb-4">
            {statusDistribution.map((item) => (
              <div 
                key={item.status} 
                className={`${item.color} flex items-center justify-center text-white text-xs`}
                style={{ width: `${(item.count / metrics.total) * 100}%` }}
                title={`${item.status}: ${item.count} (${Math.round((item.count / metrics.total) * 100)}%)`}
              >
                {(item.count / metrics.total) * 100 > 10 ? `${item.status}` : ''}
              </div>
            ))}
          </div>
          
          {/* Priority Distribution */}
          <h4 className="text-sm font-medium mb-2">Priority Distribution</h4>
          <div className="space-y-2">
            {priorityDistribution.map((item) => (
              <div key={item.priority} className="flex items-center gap-2">
                <div className="w-24 font-medium text-sm">{item.priority}</div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div 
                    className={`${item.color} h-2 rounded-full`} 
                    style={{ width: `${(item.count / metrics.total) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm">{item.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Timeline & Alerts Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Timeline & Alerts</CardTitle>
          <CardDescription>Upcoming and overdue objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-red-50 rounded-md p-3 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-sm text-red-600 font-medium">Past Due</div>
                <div className="text-xl font-bold">{metrics.pastDue}</div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-md p-3 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-sm text-amber-600 font-medium">Due Soon</div>
                <div className="text-xl font-bold">{metrics.dueSoon}</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-md p-3 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-sm text-green-600 font-medium">On Time</div>
                <div className="text-xl font-bold">{metrics.completedOnTime}</div>
              </div>
            </div>
          </div>
          
          {objectives.length > 0 && metrics.pastDue > 0 && (
            <div className="border border-red-200 dark:border-red-800 rounded-md p-3 bg-red-50 dark:bg-red-950/30 mb-3">
              <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Overdue Objectives
              </h4>
              <div className="space-y-2">
                {objectives
                  .filter(obj => {
                    const data = getObjectiveData(obj.data);
                    if (!data.targetCompletionDate) return false;
                    return new Date(data.targetCompletionDate) < new Date() && 
                           data.status.toLowerCase() !== 'completed';
                  })
                  .slice(0, 3)
                  .map(obj => (
                    <div key={obj.id} className="text-sm flex justify-between">
                      <span className="truncate max-w-[250px]">{obj.title}</span>
                      <span className="text-red-700 dark:text-red-400 font-medium">
                        {new Date(getObjectiveData(obj.data).targetCompletionDate!).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                }
                {metrics.pastDue > 3 && (
                  <div className="text-xs text-red-600 dark:text-red-400 italic">
                    +{metrics.pastDue - 3} more overdue
                  </div>
                )}
              </div>
            </div>
          )}
          
          {objectives.length > 0 && metrics.dueSoon > 0 && (
            <div className="border border-amber-200 dark:border-amber-800 rounded-md p-3 bg-amber-50 dark:bg-amber-950/30">
              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Due Soon (Next 14 Days)
              </h4>
              <div className="space-y-2">
                {objectives
                  .filter(obj => {
                    const data = getObjectiveData(obj.data);
                    if (!data.targetCompletionDate) return false;
                    const dueDate = new Date(data.targetCompletionDate);
                    const now = new Date();
                    const twoWeeksFromNow = new Date();
                    twoWeeksFromNow.setDate(now.getDate() + 14);
                    return dueDate >= now && dueDate <= twoWeeksFromNow && 
                           data.status.toLowerCase() !== 'completed';
                  })
                  .slice(0, 3)
                  .map(obj => (
                    <div key={obj.id} className="text-sm flex justify-between">
                      <span className="truncate max-w-[250px]">{obj.title}</span>
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {new Date(getObjectiveData(obj.data).targetCompletionDate!).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                }
                {metrics.dueSoon > 3 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 italic">
                    +{metrics.dueSoon - 3} more due soon
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjectivesOverview; 