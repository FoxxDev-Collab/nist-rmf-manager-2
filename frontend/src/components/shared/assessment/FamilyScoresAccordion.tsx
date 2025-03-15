import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// Simplified score categories with just color classes
const getScoreColor = (score: number) => {
  if (score < 30) return 'bg-red-600';
  if (score < 50) return 'bg-orange-500';
  if (score < 70) return 'bg-yellow-500';
  if (score < 85) return 'bg-green-500';
  return 'bg-emerald-500';
};

interface FamilyScore {
  familyId: string;
  familyTitle: string;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  plannedControls: number;
  notImplementedControls: number;
  naControls: number;
  averageScore: number;
}

interface FamilyScoresAccordionProps {
  familyScores: FamilyScore[];
}

export function FamilyScoresAccordion({ familyScores }: FamilyScoresAccordionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Scores</CardTitle>
        <CardDescription>Compliance scores by control family</CardDescription>
      </CardHeader>
      <CardContent>
        {familyScores.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No control family data available.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {familyScores.map((family, index) => {
              const scoreColor = getScoreColor(family.averageScore);
              const applicableControls = family.totalControls - family.naControls;
              
              return (
                <AccordionItem key={family.familyId} value={`item-${index}`} className="border rounded-lg px-4 mb-4">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${scoreColor}`}></span>
                        <span className="font-medium">{family.familyTitle}</span>
                      </div>
                      <Badge className={`${scoreColor} text-white`}>
                        Score: {family.averageScore}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4">
                      {/* Status distribution visualization */}
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Control Status Distribution</div>
                        <div className="flex h-6 w-full rounded-md overflow-hidden">
                          {/* Only render segments that have values */}
                          {family.implementedControls > 0 && (
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ 
                                width: `${(family.implementedControls / applicableControls) * 100}%`,
                                minWidth: family.implementedControls > 0 ? '10px' : '0' 
                              }}
                              title={`Implemented: ${family.implementedControls}`}
                            ></div>
                          )}
                          
                          {family.partialControls > 0 && (
                            <div 
                              className="bg-yellow-500 h-full" 
                              style={{ 
                                width: `${(family.partialControls / applicableControls) * 100}%`,
                                minWidth: family.partialControls > 0 ? '10px' : '0'
                              }}
                              title={`Partial: ${family.partialControls}`}
                            ></div>
                          )}
                          
                          {family.plannedControls > 0 && (
                            <div 
                              className="bg-purple-500 h-full" 
                              style={{ 
                                width: `${(family.plannedControls / applicableControls) * 100}%`,
                                minWidth: family.plannedControls > 0 ? '10px' : '0'
                              }}
                              title={`Planned: ${family.plannedControls}`}
                            ></div>
                          )}
                          
                          {family.notImplementedControls > 0 && (
                            <div 
                              className="bg-red-500 h-full" 
                              style={{ 
                                width: `${(family.notImplementedControls / applicableControls) * 100}%`,
                                minWidth: family.notImplementedControls > 0 ? '10px' : '0'
                              }}
                              title={`Not Implemented: ${family.notImplementedControls}`}
                            ></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Legend for the status distribution */}
                      <div className="flex flex-wrap gap-4 text-sm mt-2">
                        <div className="flex items-center">
                          <span className="inline-block h-3 w-3 rounded-full bg-green-500 mr-1"></span>
                          <span>Implemented: </span>
                          <span className="font-medium ml-1">{family.implementedControls}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500 mr-1"></span>
                          <span>Partial: </span>
                          <span className="font-medium ml-1">{family.partialControls}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-block h-3 w-3 rounded-full bg-purple-500 mr-1"></span>
                          <span>Planned: </span>
                          <span className="font-medium ml-1">{family.plannedControls}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-block h-3 w-3 rounded-full bg-red-500 mr-1"></span>
                          <span>Not Implemented: </span>
                          <span className="font-medium ml-1">{family.notImplementedControls}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Total: {applicableControls} applicable controls</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
} 