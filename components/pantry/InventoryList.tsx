import React, { useState } from 'react';
import { Icons } from '../../constants';
import { PantryItem } from '../../types';

interface InventoryListProps {
  items: PantryItem[];
  onAdd: (item: Omit<PantryItem, 'id'>) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Spices', 'Other'];

const InventoryList: React.FC<InventoryListProps> = ({ items, onAdd, onDelete }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[3]);
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAdd({
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQuantity.trim() || '1'
    });
    setNewItemName('');
    setNewItemQuantity('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add Item Form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icons.Plus /> Add New Item
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ingredient name..."
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Qty (e.g., 2, 500g)"
            className="w-full sm:w-32 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
          />
          <select
            className="w-full sm:w-36 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
            Add
          </button>
        </div>
      </form>

      {/* Inventory Display */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Icons.Leaf />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Your pantry is empty.<br/>Add ingredients above to start managing your kitchen.</p>
          </div>
        ) : (
          CATEGORIES.map(category => {
            const categoryItems = items.filter(i => i.category === category);
            if (categoryItems.length === 0) return null;
            return (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-colors group shadow-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity}</p>
                      </div>
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 outline-none"
                        aria-label="Delete item"
                      >
                        <Icons.Close />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventoryList;
