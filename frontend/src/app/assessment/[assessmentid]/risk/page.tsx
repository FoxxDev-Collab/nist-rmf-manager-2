"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiService, { Risk, Assessment } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Search, Trash2, Edit3, ArrowUpCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RiskMatrixOverview from '@/components/shared/RiskMatrixOverview';
import RiskEditModal from '@/components/shared/RiskEditModal';

// CSS classes for the score categories
const scoreClasses = {
  critical: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    lightBg: 'bg-red-100',
    color: '#dc2626'
  },
  high: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    lightBg: 'bg-orange-100',
    color: '#f97316'
  },
  medium: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    lightBg: 'bg-yellow-100',
    color: '#eab308'
  },
  low: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    lightBg: 'bg-green-100',
    color: '#22c55e'
  }
};

export default function RisksPage() {
  const params = useParams();
  const assessmentId = params.assessmentid as string;
  const [risks, setRisks] = useState<Risk[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // State for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<Risk | null>(null);
  const [promotingRisk, setPromotingRisk] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch risks and assessments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assessmentsData, risksData] = await Promise.all([
          apiService.assessments.getAll(),
          apiService.risks.getAll(assessmentId) // Filter risks by current assessment
        ]);
        
        setAssessments(assessmentsData);
        
        // Make sure all risks have a valid assessmentId (fix the association issue)
        const fixedRisks = risksData.map(risk => {
          if (!risk.assessmentId || risk.assessmentId === '') {
            return {
              ...risk,
              assessmentId: assessmentId // Set to current assessment ID if missing
            };
          }
          return risk;
        });
        
        setRisks(fixedRisks);
        setFilteredRisks(fixedRisks);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load risks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId]);

  // Filter risks based on search query
  useEffect(() => {
    let result = risks;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(risk => 
        risk.title.toLowerCase().includes(query) || 
        (risk.description && risk.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredRisks(result);
  }, [searchQuery, risks]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;
    
    try {
      await apiService.risks.delete(id);
      setRisks(risks.filter(risk => risk.id !== id));
    } catch (err) {
      console.error('Error deleting risk:', err);
      setError('Failed to delete risk. Please try again.');
    }
  };

  // Open the edit modal for a risk
  const handleEditRisk = (risk: Risk) => {
    setCurrentRisk(risk);
    setIsEditModalOpen(true);
  };

  // Handle saving updated risk
  const handleSaveRisk = async () => {
    try {
      // Refresh the risks data
      const risksData = await apiService.risks.getAll(assessmentId);
      
      // Make sure all risks have a valid assessmentId
      const fixedRisks = risksData.map(risk => {
        if (!risk.assessmentId || risk.assessmentId === '') {
          return {
            ...risk,
            assessmentId: assessmentId
          };
        }
        return risk;
      });
      
      setRisks(fixedRisks);
      setFilteredRisks(fixedRisks);
      setIsEditModalOpen(false);
      setCurrentRisk(null);
    } catch (err) {
      console.error('Error refreshing risks after save:', err);
      setError('Failed to refresh risks data. Please try again.');
    }
  };

  // Get assessment title by ID
  const getAssessmentTitle = (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    return assessment ? assessment.title : 'Unknown Assessment';
  };

  // Calculate risk level based on impact and likelihood
  const getRiskLevel = (impact: number, likelihood: number) => {
    // Calculate base score (1-25)
    const baseScore = impact * likelihood;
    
    // Scale to 0-100 and invert the scale (higher score = lower risk)
    const score = 100 - ((baseScore / 25) * 100);
    
    if (score < 30) return { level: 'Critical', color: scoreClasses.critical.bg };
    if (score < 50) return { level: 'High', color: scoreClasses.high.bg };
    if (score < 70) return { level: 'Medium', color: scoreClasses.medium.bg };
    return { level: 'Low', color: scoreClasses.low.bg };
  };

  // Get CSS class based on risk score
  const getScoreClass = (impact: number, likelihood: number) => {
    // Calculate base score (1-25)
    const baseScore = impact * likelihood;
    
    // Scale to 0-100 and invert the scale (higher score = lower risk)
    const score = 100 - ((baseScore / 25) * 100);
    
    if (score < 30) return scoreClasses.critical;
    if (score < 50) return scoreClasses.high;
    if (score < 70) return scoreClasses.medium;
    return scoreClasses.low;
  };

  // Calculate risk score based on impact and likelihood
  const getRiskScore = (impact: number, likelihood: number) => {
    // Calculate base score (1-25)
    const baseScore = impact * likelihood;
    
    // Scale to 0-100 and invert the scale (higher score = lower risk)
    return 100 - ((baseScore / 25) * 100);
  };

  // Handle promoting a risk to an objective
  const handlePromoteToObjective = async (risk: Risk) => {
    try {
      if (risk.id) {
        setPromotingRisk(risk.id);
      }
      setError(null);
      setSuccessMessage(null);
      
      // Convert risk priority based on risk score
      const getPriorityFromRiskScore = (score: number) => {
        if (score >= 15) return 1; // High priority
        if (score >= 10) return 2; // Medium priority
        return 3; // Low priority
      };
      
      // Create a new security objective based on the risk
      const newObjective = {
        title: `Risk mitigation: ${risk.title}`,
        description: `This objective addresses the risk: ${risk.description}`,
        data: {
          description: `Objective derived from risk assessment with impact ${risk.data.impact}/5 and likelihood ${risk.data.likelihood}/5.`,
          status: 'New',
          priority: getPriorityFromRiskScore(risk.data.risk_score),
          risk_notes: risk.data.notes
        }
      };
      
      // Call the API to create a new security objective
      await apiService.objectives.create(newObjective);
      
      // Show success message
      setSuccessMessage(`Risk "${risk.title}" has been successfully promoted to an objective.`);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (err) {
      console.error('Error promoting risk to objective:', err);
      setError('Failed to promote risk to objective. Please try again.');
    } finally {
      setPromotingRisk(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
          <p className="text-muted-foreground mt-1">
            View, manage, and analyze identified risks
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/assessment/${assessmentId}/objective`)}
            className="gap-1"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Objectives
          </Button>
          <Button onClick={() => router.push(`/assessment/${assessmentId}/risk/create`)} className="gap-1">
            <Plus className="h-4 w-4" />
            New Risk
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
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            {successMessage}{' '}
            <Button 
              variant="link" 
              className="h-auto p-0 text-green-700 font-bold underline"
              onClick={() => router.push(`/assessment/${assessmentId}/objective`)}
            >
              View all objectives
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search risks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading risks...</div>
          ) : filteredRisks.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">No risks found.</p>
              <Button 
                variant="link" 
                onClick={() => router.push(`/assessment/${assessmentId}/risk/create`)}
                className="mt-2"
              >
                Create your first risk
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRisks.map(risk => {
                const { level, color } = getRiskLevel(risk.data.impact, risk.data.likelihood);
                const scoreClass = getScoreClass(risk.data.impact, risk.data.likelihood);
                const riskScore = getRiskScore(risk.data.impact, risk.data.likelihood);
                
                return (
                  <Card key={risk.id} className="group relative hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{risk.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {getAssessmentTitle(risk.assessmentId || assessmentId)}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${color} hover:${color}`}>
                            {level} Risk
                          </Badge>
                          <span className={`text-xs ${scoreClass.text} font-medium`}>
                            Score: {riskScore}/100
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {risk.description || 'No description provided.'}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-sm">
                          <span className="font-medium">Impact:</span> {risk.data.impact}/5
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Likelihood:</span> {risk.data.likelihood}/5
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm font-medium">Risk Score:</span>
                        <span className={`text-sm ${scoreClass.text}`}>{riskScore}/100</span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {risk.data.notes && (
                          <span>Notes: {risk.data.notes.substring(0, 50)}...</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditRisk(risk)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePromoteToObjective(risk)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          disabled={promotingRisk === risk.id}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          {promotingRisk === risk.id ? 'Promoting...' : 'Promote'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(risk.id!)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Risk Overview</CardTitle>
              <CardDescription>Summary of current risk posture</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskMatrixOverview risks={filteredRisks} />
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Risk Distribution</h3>
                  {!loading && (
                    <div className="space-y-2">
                      {[
                        { name: 'Critical', threshold: 30, class: scoreClasses.critical },
                        { name: 'High', threshold: 50, class: scoreClasses.high },
                        { name: 'Medium', threshold: 70, class: scoreClasses.medium },
                        { name: 'Low', threshold: 101, class: scoreClasses.low }
                      ].map(category => {
                        const prevThreshold = category.name === 'Critical' ? 0 : 
                          category.name === 'High' ? 30 :
                          category.name === 'Medium' ? 50 : 70;
                        
                        const count = filteredRisks.filter(risk => {
                          const score = getRiskScore(risk.data.impact, risk.data.likelihood);
                          return score >= prevThreshold && score < category.threshold;
                        }).length;
                        
                        const percentage = filteredRisks.length > 0 
                          ? Math.round((count / filteredRisks.length) * 100) 
                          : 0;
                        
                        return (
                          <div key={category.name} className="flex items-center gap-2">
                            <div className="w-24 font-medium text-sm">{category.name}</div>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                              <div 
                                className={`${category.class.bg} h-2 rounded-full`} 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-10 text-right text-sm">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Risk Edit Modal */}
      <RiskEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        risk={currentRisk}
        onSave={handleSaveRisk}
        assessments={assessments}
      />
    </div>
  );
} 