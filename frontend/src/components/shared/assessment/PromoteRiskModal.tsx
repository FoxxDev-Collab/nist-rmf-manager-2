import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

interface ControlStatus {
  status: string
  notes?: string
}

interface Control {
  id: string
  family: string
  status: ControlStatus
}

interface PromoteRiskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedControl: Control | null;
  onSubmit: (data: RiskFormData) => Promise<void>;
  isSubmitting: boolean;
}

interface RiskFormData {
  title: string;
  description: string;
  impact: number;
  likelihood: number;
}

export function PromoteRiskModal({
  open,
  onOpenChange,
  selectedControl,
  onSubmit,
  isSubmitting
}: PromoteRiskModalProps) {
  const [riskTitle, setRiskTitle] = useState('')
  const [riskDescription, setRiskDescription] = useState('')
  const [riskImpact, setRiskImpact] = useState(3)
  const [riskLikelihood, setRiskLikelihood] = useState(3)
  
  // Reset form when dialog opens with a new control
  useState(() => {
    if (selectedControl) {
      setRiskTitle(`${selectedControl.family}-${selectedControl.id.split('-')[1]} Risk`)
      setRiskDescription(`Risk identified from ${selectedControl.family}-${selectedControl.id.split('-')[1]} control with status: ${selectedControl.status.status}`)
      
      // Set default impact and likelihood based on control status
      const statusLower = selectedControl.status.status.toLowerCase();
      if (statusLower.includes('not')) {
        setRiskImpact(4)
        setRiskLikelihood(4)
      } else if (statusLower.includes('partial')) {
        setRiskImpact(3)
        setRiskLikelihood(3)
      } else if (statusLower === 'planned') {
        setRiskImpact(2)
        setRiskLikelihood(3)
      }
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedControl) return
    
    await onSubmit({
      title: riskTitle,
      description: riskDescription,
      impact: riskImpact,
      likelihood: riskLikelihood
    });
  }
  
  // Get risk level based on impact and likelihood
  const getRiskLevel = (impact: number, likelihood: number) => {
    const score = impact * likelihood;
    if (score >= 15) return { level: 'Critical', color: 'bg-red-600' };
    if (score >= 10) return { level: 'High', color: 'bg-orange-500' };
    if (score >= 5) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-green-500' };
  };
  
  const riskLevel = getRiskLevel(riskImpact, riskLikelihood);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Promote to Risk</DialogTitle>
          <DialogDescription>
            Create a risk item based on the control&apos;s implementation status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk-title">Risk Title</Label>
            <Input
              id="risk-title"
              value={riskTitle}
              onChange={(e) => setRiskTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-description">Description</Label>
            <Input
              id="risk-description"
              value={riskDescription}
              onChange={(e) => setRiskDescription(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Impact (1-5)</Label>
              <span className="text-sm font-medium px-2 py-0.5 bg-muted rounded-md">{riskImpact}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Low</span>
              <Slider
                value={[riskImpact]}
                onValueChange={([value]) => setRiskImpact(value)}
                min={1}
                max={5}
                step={1}
                disabled={isSubmitting}
                className="flex-1"
              />
              <span className="text-xs">High</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Likelihood (1-5)</Label>
              <span className="text-sm font-medium px-2 py-0.5 bg-muted rounded-md">{riskLikelihood}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Low</span>
              <Slider
                value={[riskLikelihood]}
                onValueChange={([value]) => setRiskLikelihood(value)}
                min={1}
                max={5}
                step={1}
                disabled={isSubmitting}
                className="flex-1"
              />
              <span className="text-xs">High</span>
            </div>
          </div>
          
          <div className="p-3 border rounded-md bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="font-medium">Risk Score:</span>
              <Badge className={`ml-auto text-white ${riskLevel.color}`}>
                {riskImpact * riskLikelihood} - {riskLevel.level}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Calculated as Impact × Likelihood
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Risk...' : 'Create Risk'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 