import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, Info, Link } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getControlDetails, getBaselineImpactExplanation } from '@/data/controlsCatalog'
import { Separator } from '@/components/ui/separator'

interface ControlStatus {
  status: string
  notes?: string
}

interface Control {
  id: string
  family: string
  status: ControlStatus
}

interface ControlsListProps {
  controls: Record<string, Record<string, ControlStatus>>;
  onPromoteToRisk: (control: Control) => void;
  promotedControls: Set<string>;
}

// Function to get status colors for badge variants
const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('not') || statusLower === 'failed') return 'destructive';
  if (statusLower.includes('partial')) return 'secondary';
  if (statusLower === 'planned') return 'secondary';
  if (statusLower === 'implemented' || statusLower === 'completed') return 'default';
  return 'default';
};

// Function to get the appropriate icon for a status
const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('not') || statusLower === 'failed') return <XCircle className="h-4 w-4" />;
  if (statusLower.includes('partial') || statusLower === 'planned') return <HelpCircle className="h-4 w-4" />;
  if (statusLower === 'implemented' || statusLower === 'completed') return <CheckCircle className="h-4 w-4" />;
  return null;
};

export function ControlsList({ controls, onPromoteToRisk, promotedControls }: ControlsListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedControls, setExpandedControls] = useState<Record<string, boolean>>({});
  const [showBaselineExplanation, setShowBaselineExplanation] = useState(false);
  
  // Toggle expanded state for a control
  const toggleExpandControl = (controlId: string) => {
    setExpandedControls(prev => ({
      ...prev,
      [controlId]: !prev[controlId]
    }));
  };
  
  // Calculate statistics about controls
  const controlStats = (() => {
    if (!controls || Object.keys(controls).length === 0) {
      return { total: 0, implemented: 0, partial: 0, notImplemented: 0, planned: 0, other: 0 };
    }
    
    let total = 0;
    let implemented = 0;
    let partial = 0;
    let notImplemented = 0;
    let planned = 0;
    let other = 0;
    
    Object.values(controls).forEach(familyControls => {
      Object.values(familyControls).forEach(control => {
        const status = typeof control === 'string' ? control : control.status;
        const statusLower = status.toLowerCase();
        
        total++;
        if (statusLower === 'implemented') implemented++;
        else if (statusLower.includes('partial')) partial++;
        else if (statusLower.includes('not')) notImplemented++;
        else if (statusLower === 'planned') planned++;
        else other++;
      });
    });
    
    return { total, implemented, partial, notImplemented, planned, other };
  })();

  // Filter controls based on selected status
  const filteredControls = (() => {
    if (!activeTab || activeTab === 'all') return controls;
    
    const result: Record<string, Record<string, ControlStatus>> = {};
    
    Object.entries(controls).forEach(([family, familyControls]) => {
      const filteredFamilyControls: Record<string, ControlStatus> = {};
      
      Object.entries(familyControls).forEach(([controlKey, control]) => {
        const status = typeof control === 'string' ? control : control.status;
        const statusLower = status.toLowerCase();
        
        if (
          (activeTab === 'all') ||
          (activeTab === 'implemented' && statusLower === 'implemented') ||
          (activeTab === 'partial' && statusLower.includes('partial')) ||
          (activeTab === 'notImplemented' && statusLower.includes('not')) ||
          (activeTab === 'planned' && statusLower === 'planned')
        ) {
          filteredFamilyControls[controlKey] = typeof control === 'string' ? { status: control } : control;
        }
      });
      
      if (Object.keys(filteredFamilyControls).length > 0) {
        result[family] = filteredFamilyControls;
      }
    });
    
    return result;
  })();

  // Determine if any controls are present after filtering
  const hasControls = controls && Object.keys(controls).length > 0;
  const hasFilteredControls = Object.keys(filteredControls).length > 0;

  // Get border class based on status
  const getBorderClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('not') || statusLower === 'failed') 
      return "border-l-4 border-l-destructive";
    if (statusLower.includes('partial')) 
      return "border-l-4 border-l-yellow-500";
    if (statusLower === 'planned') 
      return "border-l-4 border-l-purple-500";
    if (statusLower === 'implemented' || statusLower === 'completed') 
      return "border-l-4 border-l-green-500";
    return "border-l-4 border-l-gray-300";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
        <CardDescription>
          View and manage security controls by status
        </CardDescription>
        <Tabs defaultValue="all" className="mt-2" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All ({controlStats.total})</TabsTrigger>
            <TabsTrigger value="implemented">Implemented ({controlStats.implemented})</TabsTrigger>
            <TabsTrigger value="partial">Partial ({controlStats.partial})</TabsTrigger>
            <TabsTrigger value="notImplemented">Not Implemented ({controlStats.notImplemented})</TabsTrigger>
            <TabsTrigger value="planned">Planned ({controlStats.planned})</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {/* Baseline Impact Explanation */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={() => setShowBaselineExplanation(!showBaselineExplanation)}
          >
            <Info className="h-4 w-4" />
            {showBaselineExplanation ? "Hide" : "Show"} Baseline Impact Explanation
          </Button>
          
          {showBaselineExplanation && (
            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
              <p className="whitespace-pre-line">{getBaselineImpactExplanation()}</p>
            </div>
          )}
        </div>
        
        {!hasControls ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No controls data available for this assessment.</p>
          </div>
        ) : !hasFilteredControls ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No controls match the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredControls).map(([family, familyControls]) => (
              <div key={family} className="space-y-4">
                <h3 className="text-xl font-semibold">{family}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(familyControls).map(([controlKey, control]) => {
                    // Normalize control data structure
                    const controlStatus = typeof control === 'string' 
                      ? { status: control } 
                      : (control as ControlStatus);
                    
                    const statusColor = getStatusColor(controlStatus.status);
                    const statusIcon = getStatusIcon(controlStatus.status);
                    
                    // Get control details from catalog
                    const controlFullId = controlKey;
                    const controlDetails = getControlDetails(family, controlFullId);
                    const isExpanded = expandedControls[`${family}-${controlFullId}`] || false;
                    const isPromoted = promotedControls.has(`${family}-${controlFullId}`);
                    
                    return (
                      <Card key={controlKey} className={getBorderClass(controlStatus.status)}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium flex items-center gap-2">
                                    {controlFullId}
                                    {controlDetails && (
                                      <span className="text-sm font-normal text-muted-foreground">
                                        {controlDetails.title}
                                      </span>
                                    )}
                                    {isPromoted && (
                                      <Badge variant="secondary" className="ml-2">
                                        Promoted to Risk
                                      </Badge>
                                    )}
                                  </h4>
                                  <p className="text-sm flex items-center gap-1 mt-1">
                                    <Badge variant={statusColor} className="flex items-center gap-1">
                                      {statusIcon}
                                      {controlStatus.status}
                                    </Badge>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpandControl(`${family}-${controlFullId}`)}
                                    className="p-1 h-8 w-8"
                                  >
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Control details section (expanded) */}
                              {isExpanded && (
                                <div className="mt-4 border-t pt-4 space-y-4">
                                  {controlDetails ? (
                                    <>
                                      <div>
                                        <h5 className="text-sm font-medium">Description</h5>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {controlDetails.description}
                                        </p>
                                      </div>
                                      
                                      {/* Importance - Why this control matters */}
                                      {controlDetails.importance && (
                                        <div>
                                          <h5 className="text-sm font-medium">Why This Control Matters</h5>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {controlDetails.importance}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Mitigation Suggestions */}
                                      {controlDetails.mitigationSuggestions && controlDetails.mitigationSuggestions.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium">Implementation Suggestions</h5>
                                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                                            {controlDetails.mitigationSuggestions.map((suggestion, index) => (
                                              <li key={index}>{suggestion}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {controlDetails.priority && (
                                          <div>
                                            <h5 className="text-sm font-medium">Priority</h5>
                                            <p className="text-sm text-muted-foreground mt-1">
                                              {controlDetails.priority}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {controlDetails.baseline && controlDetails.baseline.length > 0 && (
                                          <div>
                                            <h5 className="text-sm font-medium">Baseline Impact</h5>
                                            <div className="flex gap-1 mt-1">
                                              {controlDetails.baseline.map(level => (
                                                <Badge key={level} variant="outline">{level}</Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Related Controls */}
                                      {controlDetails.related && controlDetails.related.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium flex items-center gap-1">
                                            <Link className="h-3 w-3" />
                                            Related Controls
                                          </h5>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {controlDetails.related.map(relatedControl => (
                                              <Badge key={relatedControl} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                {relatedControl}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No detailed information available for this control.
                                    </p>
                                  )}
                                  
                                  <Separator />
                                  
                                  {/* Implementation Notes */}
                                  {controlStatus.notes && (
                                    <div>
                                      <h5 className="text-sm font-medium">Implementation Notes</h5>
                                      <p className="text-sm text-muted-foreground mt-1 italic">
                                        &quot;{controlStatus.notes}&quot;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onPromoteToRisk({
                                        id: controlKey,
                                        family,
                                        status: controlStatus
                                      })}
                                      disabled={isPromoted}
                                    >
                                      {isPromoted ? 'Promoted' : 'Promote to Risk'}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {isPromoted 
                                        ? 'This control has already been promoted to a risk'
                                        : 'Create a risk based on this control\'s implementation status'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 