import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../constants';
import InventoryList from '../components/pantry/InventoryList';
import GroceryList from '../components/pantry/GroceryList';
import GIAuditCard from '../components/pantry/GIAuditCard';
import { PantryItem, GroceryItem } from '../types';
import { getPantryItems, addPantryItem, deletePantryItem } from '../services/pantryService';
import { getMealPlan } from '../services/mealPlanService';
import { getSavedRecipes } from '../services/authService';
import { generateGroceryList } from '../services/geminiService';

const Pantry: React.FC = () => {
  const [plannedMeals, setPlannedMeals] = useState<{ name: string; category: string; quantity: string; isHighGI: boolean }[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingGrocery, setIsGeneratingGrocery] = useState(true);
  const [checkedGroceryIds, setCheckedGroceryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getPantryItems();
      setPantryItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    
    // Independently load the dynamic grocery list
    try {
      const plan = await getMealPlan().catch(() => ({}));
      const saved = await getSavedRecipes();
      const generatedList = await generateGroceryList(plan, saved);
      setPlannedMeals(generatedList);
    } catch (err) {
      console.error('Failed to generate smart grocery list', err);
    } finally {
      setIsGeneratingGrocery(false);
    }
  };

  const handleAddItem = async (item: Omit<PantryItem, 'id'>) => {
    try {
      const newItem = await addPantryItem(item);
      setPantryItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deletePantryItem(id);
      setPantryItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Smart Auto-Generation Logic
  const groceryList: GroceryItem[] = useMemo(() => {
    return plannedMeals
      .filter(req => !pantryItems.some(pantry => pantry.name.toLowerCase() === req.name.toLowerCase()))
      .map((req, idx) => {
        const id = `groc-${req.name.toLowerCase().replace(/\s/g, '-')}`;
        return {
          id,
          name: req.name,
          category: req.category,
          quantity: req.quantity,
          isHighGI: req.isHighGI,
          isChecked: checkedGroceryIds.has(id)
        };
      });
  }, [pantryItems, checkedGroceryIds, plannedMeals]);

  const handleToggleGrocery = (id: string) => {
    setCheckedGroceryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSwapIngredient = (id: string, newName: string) => {
    setPlannedMeals(prev => prev.map(meal => {
        const mealId = `groc-${meal.name.toLowerCase().replace(/\s/g, '-')}`;
        if (mealId === id) {
           return { ...meal, name: newName, isHighGI: false };
        }
        return meal;
    }));
  };

  const handleRestockPantry = async () => {
    try {
      const itemsToAdd = groceryList.filter(i => i.isChecked);
      const addedItems = await Promise.all(itemsToAdd.map(i => addPantryItem({
        name: i.name,
        category: i.category,
        quantity: i.quantity
      })));
      setPantryItems(prev => [...prev, ...addedItems]);
      setCheckedGroceryIds(new Set());
    } catch (err) {
      console.error('Failed to restock items', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in-up">
      {/* Left Panel: Inventory Management */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icons.Leaf /> My Pantry
          </h2>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <InventoryList 
            items={pantryItems} 
            onAdd={handleAddItem} 
            onDelete={handleDeleteItem} 
          />
        </div>
      </div>

      {/* Right Panel: Smart Grocery List */}
      <div className="w-full lg:w-96 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icons.Check /> Smart Grocery List
          </h2>
        </div>
        <div className="flex-1 p-6 overflow-hidden">
           {isGeneratingGrocery ? (
             <div className="h-full flex flex-col items-center justify-center text-center">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">AI is reading your Meal Plan<br/>and evaluating ingredients...</p>
             </div>
           ) : (
             <GroceryList 
               items={groceryList}
               onToggleCheck={handleToggleGrocery}
               onClearChecked={handleRestockPantry}
             />
           )}
        </div>
        <GIAuditCard 
           highGIItems={groceryList.filter(i => i.isHighGI && !i.isChecked)} 
           onSwap={handleSwapIngredient} 
        />
      </div>
    </div>
  );
};

export default Pantry;
