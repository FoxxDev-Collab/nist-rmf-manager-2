"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import apiService, { Assessment } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Create a separate client component for handling search params
function RiskFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAssessmentId = searchParams.get('assessmentId');
  const returnToAssessment = searchParams.get('returnToAssessment') === 'true';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState(3);
  const [likelihood, setLikelihood] = useState(3);
  const [notes, setNotes] = useState('');
  const [assessmentId, setAssessmentId] = useState(preselectedAssessmentId || '');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate risk score
  const riskScore = impact * likelihood;

  // Get risk level based on score
  const getRiskLevel = (score: number) => {
    if (score >= 15) return { level: 'Critical', color: 'text-red-500' };
    if (score >= 10) return { level: 'High', color: 'text-orange-500' };
    if (score >= 5) return { level: 'Medium', color: 'text-yellow-500' };
    return { level: 'Low', color: 'text-green-500' };
  };

  const { level, color } = getRiskLevel(riskScore);

  // Fetch assessments for dropdown
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await apiService.assessments.getAll();
        setAssessments(data);
        if (data.length > 0 && !assessmentId) {
          setAssessmentId(data[0].id!);
        }
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments. Please try again later.');
      }
    };

    fetchAssessments();
  }, [assessmentId]);

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
      const newRisk = {
        id: uuidv4(),
        assessmentId,
        title,
        description,
        data: {
          impact,
          likelihood,
          risk_score: riskScore,
          notes
        },
        created_at: now,
        updated_at: now
      };
      
      await apiService.risks.create(newRisk);
      
      // Navigate to appropriate page after creation
      if (returnToAssessment) {
        router.push(`/assessment/${assessmentId}/risks`);
      } else {
        router.push('/risk');
      }
    } catch (err) {
      console.error('Error creating risk:', err);
      setError('Failed to create risk. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          onClick={() => returnToAssessment 
            ? router.push(`/assessment/${assessmentId}`) 
            : router.push('/risk')
          }
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {returnToAssessment ? 'Back to Assessment' : 'Back to Risks'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Risk</h1>
          <p className="text-muted-foreground mt-1">
            Add a new risk to track and manage
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
      
      {assessments.length === 0 ? (
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
            <Card>
              <CardHeader>
                <CardTitle>Risk Details</CardTitle>
                <CardDescription>
                  Basic information about the risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Risk Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter risk title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assessment">Associated Assessment *</Label>
                  <Select 
                    value={assessmentId} 
                    onValueChange={setAssessmentId}
                    disabled={!!preselectedAssessmentId}
                  >
                    <SelectTrigger>
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
                  {preselectedAssessmentId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assessment pre-selected from context
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the risk in detail"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>
                  Evaluate the risk impact and likelihood
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="impact">Impact</Label>
                      <span className="text-sm font-medium">{impact}/5</span>
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
                      <span className="text-sm font-medium">{likelihood}/5</span>
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
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-sm font-medium mb-2">Risk Score:</div>
                  <div className="flex items-center">
                    <div className={`text-3xl font-bold ${color}`}>
                      {riskScore}
                    </div>
                    <div className={`ml-2 ${color}`}>
                      ({level})
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Score calculated as Impact × Likelihood
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
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <CardFooter className="flex justify-end space-x-4 px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => returnToAssessment 
                ? router.push(`/assessment/${assessmentId}`) 
                : router.push('/risk')
              }
              disabled={loading}
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

// Main component with Suspense boundary
export default function CreateRiskPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <RiskFormContent />
    </Suspense>
  );
} 