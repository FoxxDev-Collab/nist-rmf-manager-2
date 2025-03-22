"use client";

import { useState, useEffect } from 'react';
import apiService, { Risk, Assessment } from '@/services/api';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RiskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: Risk | null;
  onSave: (updatedRisk: Risk) => void;
  assessments: Assessment[];
}

export default function RiskEditModal({ isOpen, onClose, risk, onSave, assessments }: RiskEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState(3);
  const [likelihood, setLikelihood] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate risk score
  const baseScore = impact * likelihood;
  const riskScore = 100 - ((baseScore / 25) * 100);

  // Get risk level based on score
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Critical', color: 'text-red-600' };
    if (score < 50) return { level: 'High', color: 'text-orange-500' };
    if (score < 70) return { level: 'Medium', color: 'text-yellow-500' };
    return { level: 'Low', color: 'text-green-500' };
  };

  const { level, color } = getRiskLevel(riskScore);

  // Set form values when risk changes
  useEffect(() => {
    if (risk) {
      setTitle(risk.title);
      setDescription(risk.description || '');
      setImpact(risk.data.impact);
      setLikelihood(risk.data.likelihood);
      setNotes(risk.data.notes || '');
    }
  }, [risk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Risk title is required');
      return;
    }
    
    if (!risk) {
      setError('Risk data is missing');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update the risk with our changes
      const updatedRisk = await apiService.risks.update(risk.id!, {
        title,
        description,
        data: {
          impact,
          likelihood,
          risk_score: riskScore,
          notes
        }
      });
      
      // Notify parent component
      onSave(updatedRisk);
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error updating risk:', err);
      setError('Failed to update risk. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find assessment title by ID
  const getAssessmentTitle = (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    return assessment ? assessment.title : 'Unknown Assessment';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Risk</DialogTitle>
          <DialogDescription>
            {risk && `Editing risk for ${getAssessmentTitle(risk.assessmentId)}`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk in detail"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimal</span>
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Severe</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Rare</span>
                <span>Unlikely</span>
                <span>Possible</span>
                <span>Likely</span>
                <span>Certain</span>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <div className="text-sm font-medium mb-1">Risk Score:</div>
            <div className="flex items-center">
              <div className={`text-2xl font-bold ${color}`}>
                {Math.round(riskScore)}/100
              </div>
              <div className={`ml-2 ${color}`}>
                ({level})
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or context about this risk"
              rows={2}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 