import React from 'react';
import { AuditResult } from '../types';
import { Icons } from '../constants';

interface AuditReportProps {
  result: AuditResult;
  onReset: () => void;
}

const AuditReport: React.FC<AuditReportProps> = ({ result, onReset }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 border-yellow-600 bg-yellow-50';
    return 'text-red-600 border-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Verdict */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Audit Complete</h2>
            <p className="text-gray-500">Here is the breakdown from our digital care team.</p>
        </div>
        <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreColor(result.safetyScore)}`}>
            <span className="text-2xl font-bold">{result.safetyScore}</span>
            <span className="text-xs uppercase font-semibold">Safety</span>
        </div>
      </div>

      {/* Food Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Food Details</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Estimated Portion Weight</p>
            <p className="font-semibold text-gray-900 bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-200">
              {result.portionWeight || "Not specified"}
            </p>
          </div>
          <div className="flex-[2]">
            <p className="text-sm text-gray-500 mb-2">Identified Ingredients</p>
            <div className="flex flex-wrap gap-2">
              {result.ingredientsList && result.ingredientsList.length > 0 ? (
                result.ingredientsList.map((ingredient, idx) => (
                  <span key={idx} className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">
                    {ingredient}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No specific ingredients identified.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor's Report */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
            <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm">
                    <Icons.Doctor />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">The Doctor's Analysis</h3>
                    <p className="text-xs text-blue-600">Endocrinologist Perspective</p>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Verdict</span>
                    <span className="font-bold text-gray-900">{result.doctorAnalysis.verdict}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Est. Glycemic Index</span>
                    <span className={`font-bold px-2 py-1 rounded text-xs ${result.doctorAnalysis.glycemicIndexEstimate.includes('High') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {result.doctorAnalysis.glycemicIndexEstimate}
                    </span>
                </div>
                
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Primary Concerns:</h4>
                    <ul className="space-y-2">
                        {result.doctorAnalysis.concerns.map((concern, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-red-500 mt-0.5"><Icons.Alert /></span>
                                {concern}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-4 border-t border-gray-100">
                    <div>
                        <div className="text-xs text-gray-500">Cals</div>
                        <div className="font-semibold">{result.nutritionalInfo.calories}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Carbs</div>
                        <div className="font-semibold text-orange-600">{result.nutritionalInfo.carbs}g</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Protein</div>
                        <div className="font-semibold">{result.nutritionalInfo.protein}g</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Fat</div>
                        <div className="font-semibold">{result.nutritionalInfo.fat}g</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Chef's Swaps */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 overflow-hidden">
            <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-orange-600 shadow-sm">
                    <Icons.Chef />
                </div>
                <div>
                    <h3 className="font-bold text-orange-900">The Chef's Smart Swaps</h3>
                    <p className="text-xs text-orange-600">Filipino Kitchen Context</p>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {result.chefSwaps.length === 0 ? (
                    <p className="text-gray-500 text-center italic">No swaps needed! Good job.</p>
                ) : (
                    result.chefSwaps.map((swap, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-red-400 line-through text-sm">{swap.originalIngredient}</span>
                                <span className="text-gray-400 text-xs">→</span>
                                <span className="text-green-600 font-bold text-lg">{swap.suggestedSwap}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{swap.reason}</p>
                            <div className="bg-orange-50 text-orange-800 text-xs px-2 py-1 rounded inline-block">
                                🛒 {swap.localContext}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <button 
            onClick={onReset}
            className="px-6 py-3 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-gray-900 transition flex items-center gap-2"
        >
            Audit Another Recipe
        </button>
      </div>
    </div>
  );
};

export default AuditReport;