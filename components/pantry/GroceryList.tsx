import React from 'react';
import { Icons } from '../../constants';
import { GroceryItem } from '../../types';

interface GroceryListProps {
  items: GroceryItem[];
  onToggleCheck: (id: string) => void;
  onClearChecked: () => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ items, onToggleCheck, onClearChecked }) => {
  const uncheckedItems = items.filter(i => !i.isChecked);
  const checkedItems = items.filter(i => i.isChecked);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="mb-4 flex flex-col gap-2 relative">
        <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Generated from Meal Plan
            </p>
            <button 
                onClick={onClearChecked}
                disabled={checkedItems.length === 0}
                className="text-xs text-primary disabled:text-gray-400 font-medium hover:underline focus:outline-none transition-colors"
                title="Puts checked items into your Pantry"
            >
                Restock Pantry
            </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Items required for dinner that you don't have.</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-green-500">
              <Icons.Check />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">You have everything you need!<br/>No groceries to buy today.</p>
          </div>
        ) : (
          <>
            {/* Unchecked Items */}
            <div className="space-y-2">
              {uncheckedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary/40 dark:hover:border-accent/40 transition-colors shadow-sm group">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onToggleCheck(item.id)}
                      className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center group-hover:border-primary dark:group-hover:border-accent transition-colors focus:outline-none"
                    >
                    </button>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} • {item.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">In Cart</h4>
                {checkedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-transparent rounded-xl opacity-60">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleCheck(item.id)}
                        className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400 capitalize text-sm line-through">{item.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
