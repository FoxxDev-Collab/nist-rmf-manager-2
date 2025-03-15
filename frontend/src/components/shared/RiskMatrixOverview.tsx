import React from 'react';

interface RiskData {
  impact: number;
  likelihood: number;
  risk_score: number;
  notes?: string;
}

interface Risk {
  id?: string;
  assessmentId: string;
  title: string;
  description?: string;
  data: RiskData;
  created_at?: string;
  updated_at?: string;
}

interface RiskMatrixImprovedProps {
  risks?: Risk[];
}

const RiskMatrixImproved: React.FC<RiskMatrixImprovedProps> = ({ risks = [] }) => {
  // Sample risks if none provided
  const sampleRisks = risks.length > 0 ? risks : [
    { id: 'risk1', assessmentId: 'sample', title: 'AC-1 Big Risk', data: { impact: 3, likelihood: 3, risk_score: 9 } },
    { id: 'risk2', assessmentId: 'sample', title: 'Getting hacked', data: { impact: 3, likelihood: 3, risk_score: 9 } }
  ];
  
  // Get cell background color based on position
  const getCellColor = (impact: number, likelihood: number): string => {
    const score = impact * likelihood * 4; // Scale to 0-100
    
    if (score < 30) return 'bg-red-100';
    if (score < 50) return 'bg-orange-100';
    if (score < 70) return 'bg-yellow-100';
    if (score < 85) return 'bg-green-100';
    return 'bg-emerald-100';
  };

  // Get dot color for risks
  const getDotColor = (impact: number, likelihood: number): string => {
    const score = impact * likelihood * 4;
    
    if (score < 30) return 'bg-red-500';
    if (score < 50) return 'bg-orange-500';
    if (score < 70) return 'bg-yellow-500';
    if (score < 85) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  // Get risk items for a specific cell
  const getRisksForCell = (impact: number, likelihood: number): Risk[] => {
    return sampleRisks.filter(risk => 
      risk.data.impact === impact && risk.data.likelihood === likelihood
    );
  };

  return (
    <div className="w-full p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Risk Matrix</h3>
      
      <div className="flex flex-col">
        {/* Top likelihood labels */}
        <div className="ml-12 mb-2">
          <div className="text-sm font-medium mb-2 text-center">Likelihood</div>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={`likelihood-${n}`} className="text-sm text-center">
                {n}
              </div>
            ))}
          </div>
        </div>
        
        {/* Matrix grid with impact labels on the left */}
        <div className="flex">
          {/* Left impact label */}
          <div className="w-12 flex flex-col items-center mr-2">
            <div className="h-full flex items-center justify-center">
              <div className="transform -rotate-90 text-sm font-medium whitespace-nowrap">
                Impact
              </div>
            </div>
          </div>
          
          {/* Impact numbers and matrix cells */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(impact => (
              <div key={`row-${impact}`} className="flex mb-1">
                {/* Impact number on the left */}
                <div className="w-8 flex items-center justify-center text-sm font-medium">
                  {impact}
                </div>
                
                {/* Row cells */}
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map(likelihood => {
                    const cellRisks = getRisksForCell(impact, likelihood);
                    const hasRisks = cellRisks.length > 0;
                    
                    return (
                      <div
                        key={`cell-${impact}-${likelihood}`}
                        className={`
                          h-16
                          ${getCellColor(impact, likelihood)} 
                          border rounded flex items-center justify-center
                          ${hasRisks ? 'cursor-pointer hover:opacity-80' : ''}
                        `}
                        title={`Impact: ${impact}, Likelihood: ${likelihood}`}
                      >
                        {hasRisks && (
                          <div className="p-1 text-xs">
                            {cellRisks.length > 1 ? (
                              <div className="flex flex-wrap justify-center">
                                {cellRisks.slice(0, 3).map((risk, idx) => (
                                  <div 
                                    key={`dot-${idx}`}
                                    className={`w-2 h-2 m-0.5 rounded-full ${getDotColor(impact, likelihood)}`}
                                  />
                                ))}
                                {cellRisks.length > 3 && (
                                  <span className="text-xs ml-1">+{cellRisks.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${getDotColor(impact, likelihood)} mb-1`}></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom legend */}
        <div className="flex justify-between mt-4 ml-12">
          <div className="text-xs text-gray-500">Low Risk</div>
          <div className="text-xs text-gray-500">Medium Risk</div>
          <div className="text-xs text-gray-500">High Risk</div>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrixImproved;