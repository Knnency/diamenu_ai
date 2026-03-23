import React from 'react';
import { Icons } from '../../constants';
import { GroceryItem } from '../../types';

interface GIAuditCardProps {
  highGIItems: GroceryItem[];
  onSwap: (id: string, newName: string) => void;
}

const GIAuditCard: React.FC<GIAuditCardProps> = ({ highGIItems, onSwap }) => {
  if (highGIItems.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-orange-200 dark:border-orange-900/50 p-4 animate-fade-in-up z-10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-400">
           <Icons.Alert />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Glycemic Audit Alert
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            We found {highGIItems.length} item(s) on your list that may cause rapid blood sugar spikes.
          </p>
          <div className="space-y-2">
            {highGIItems.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                  {item.name} <span className="text-orange-500 font-bold ml-1">(High GI)</span>
                </span>
                <button 
                  onClick={() => onSwap(item.id, item.name === 'White Rice' ? 'Quinoa' : 'Cauliflower')}
                  className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors whitespace-nowrap"
                >
                  Swap to {item.name === 'White Rice' ? 'Quinoa' : 'Cauliflower'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GIAuditCard;
