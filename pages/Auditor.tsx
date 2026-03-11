import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { UserProfile } from '../types';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

interface RecipeIdea {
  id: string;
  title: string;
  tags: string[];
  description: string;
  ingredients?: string[];
  preparation?: string[];
  instructions?: string[];
}

const Auditor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm Doc Chef, your personal cooking and health assistant. I can help you discover recipes, audit them for your dietary needs, and create meal plans. What would you like today?"
    }
  ]);
  const [recipeIdeas, setRecipeIdeas] = useState<RecipeIdea[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeIdea | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewServings, setPreviewServings] = useState(2);
  const [previewTextSize, setPreviewTextSize] = useState(100);
  const [newIngredientText, setNewIngredientText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock user profile tags
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    age: 30,
    type: 'Type 2',
    dietaryPreferences: ['Gluten-Free', 'Dairy-Free', 'Halal'],
    allergens: ['Peanuts', 'Gluten']
  });

  const [settingsForm, setSettingsForm] = useState({
    servings: '2 people',
    country: 'Philippines',
    dietaryOptions: [...userProfile.dietaryPreferences],
    allergies: [...userProfile.allergens],
    ingredientsToAvoid: [] as string[]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e?: React.FormEvent, predefinedText?: string) => {
    e?.preventDefault();
    const textToSend = predefinedText || inputText;
    if (!textToSend.trim()) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!predefinedText) {
      setInputText('');
    }
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const newBotMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `${newUserMsg.text} is a classic dish. Since your dietary preferences include Halal, I've adapted it to keep it compliant while staying true to the flavors. It's naturally gluten-free, dairy-free, and avoids peanuts. Here's a recipe idea for ${settingsForm.servings}—tap Preview to see full details!`
      };
      setMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false);

      // Populate recipe ideas
      setRecipeIdeas([
        {
          id: 'r1',
          title: `Halal Beef ${newUserMsg.text} (Beef Version)`,
          tags: ['Soup', settingsForm.servings],
          description: `Comforting sour soup featuring tender beef chunks, green beans, radish, eggplant, and kangkong in a flavorful tamarind broth.`,
          ingredients: [
            '500 g Beef chuck',
            '1 medium White onion',
            '6 clove Garlic',
            '3 whole Bay leaves',
            '1 tsp Black peppercorns',
            '60 ml Gluten-free soy sauce (tamari)',
            '60 ml White cane vinegar',
            '120 ml Water',
            '2 tbsp Cooking oil',
            '1 tsp Brown sugar',
            'Salt'
          ],
          preparation: [
            'Cut the beef chuck into 4-5 cm chunks, trimming excess fat as desired.',
            'Peel and slice the white onion into thin rings.',
            'Peel and crush 4 cloves of garlic, then mince the remaining 2 cloves.',
            'Measure out the gluten-free soy sauce (tamari), white cane vinegar, and water into a bowl and mix together to form the adobo marinade.'
          ],
          instructions: [
            'Place the beef chunks in a bowl, pour the adobo marinade over them, and mix well to coat. Cover and marinate for at least 15 minutes at room temperature while you prepare the remaining ingredients.',
            'Heat the cooking oil in a heavy-bottomed pot or kawali over medium-high heat. Add the crushed garlic and sliced onion, and sauté for 2-3 minutes until softened and fragrant.',
            'Add the marinated beef chunks (reserve the marinade) and brown on all sides, about 5-7 minutes.',
            'Pour in the reserved marinade, water, bay leaves, and black peppercorns. Bring to a boil, then reduce heat to low, cover, and simmer for 1.5 to 2 hours, or until the beef is very tender.',
            'Stir in the brown sugar and season with salt to taste. Simmer for another 5 minutes to let the flavors meld.'
          ]
        },
        {
          id: 'r2',
          title: `Fish ${newUserMsg.text} for Variety`,
          tags: ['Soup', settingsForm.servings],
          description: `Light and tangy soup with fresh fish fillets, tomatoes, okra, and string beans simmered in tamarind soup—another Halal option.`,
          ingredients: [
            '500 g White fish fillets (e.g., tilapia or cod)',
            '1 medium Red onion',
            '4 clove Garlic',
            '2 medium Tomatoes',
            '60 ml White cane vinegar',
            '60 ml Water',
            '2 tbsp Cooking oil',
            'Salt and pepper to taste'
          ],
          preparation: [
            'Cut the fish fillets into serving-sized pieces.',
            'Slice the red onion and tomatoes.',
            'Mince the garlic.'
          ],
          instructions: [
            'Heat oil in a pan over medium heat. Sauté garlic, onion, and tomatoes until softened.',
            'Add the fish fillets and cook for 2 minutes per side.',
            'Pour in the vinegar and water. Do not stir immediately; let it boil for 2 minutes to cook off the strong vinegar taste.',
            'Season with salt and pepper. Simmer for another 3-5 minutes until the fish is cooked through.'
          ]
        }
      ]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveSettings = () => {
    setUserProfile(prev => ({
      ...prev,
      dietaryPreferences: settingsForm.dietaryOptions,
      allergens: settingsForm.allergies
    }));
    setIsSettingsOpen(false);
  };

  const handleClearSettings = () => {
    setSettingsForm({
      servings: '1 person',
      country: 'Philippines',
      dietaryOptions: [],
      allergies: [],
      ingredientsToAvoid: []
    });
  };

  const removeDietaryOption = (option: string) => {
    setSettingsForm(prev => ({
      ...prev,
      dietaryOptions: prev.dietaryOptions.filter(o => o !== option)
    }));
  };

  const removeAllergy = (allergy: string) => {
    setSettingsForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const removeIngredientToAvoid = (ingredient: string) => {
    setSettingsForm(prev => ({
      ...prev,
      ingredientsToAvoid: prev.ingredientsToAvoid.filter(i => i !== ingredient)
    }));
  };

  const handleAddIngredient = () => {
    if (newIngredientText.trim() && !settingsForm.ingredientsToAvoid.includes(newIngredientText.trim())) {
      setSettingsForm(prev => ({
        ...prev,
        ingredientsToAvoid: [...prev.ingredientsToAvoid, newIngredientText.trim()]
      }));
    }
    setNewIngredientText('');
    setIsAddIngredientOpen(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in-up relative">
      {/* Left Panel: Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header & Tags */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Icons.Chef />
              </div>
              Doc Chef
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Icons.User /> Settings
              </button>
              <button 
                onClick={() => {
                  setMessages([{ id: '1', sender: 'bot', text: "Hello! I'm Doc Chef, your personal cooking and health assistant. What would you like today?" }]);
                  setRecipeIdeas([]);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5"
              >
                <Icons.Leaf /> New chat
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
              Servings: {settingsForm.servings}
            </span>
            {userProfile.dietaryPreferences.map(diet => (
              <span key={diet} className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                Diet: {diet}
              </span>
            ))}
            {userProfile.allergens.map(allergy => (
              <span key={allergy} className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                Allergy: {allergy}
              </span>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Icons.Chef />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                msg.sender === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Icons.User />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                <Icons.Chef />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the recipe you'd like to create..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none text-sm"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center text-white bg-primary rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Recipe Ideas */}
      <div className="w-full lg:w-96 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icons.Leaf /> Recipe Ideas
          </h2>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
            {recipeIdeas.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {recipeIdeas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Icons.Chart />
              <p className="text-sm text-center">Tell Doc Chef what you're craving to see recipe ideas here.</p>
            </div>
          ) : (
            recipeIdeas.map((recipe) => (
              <div key={recipe.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary/50 transition-colors bg-white shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{recipe.title}</h3>
                <div className="flex gap-2 mb-3">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-md flex items-center gap-1">
                      {tag === 'Soup' ? <Icons.Leaf /> : <Icons.User />} {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {recipe.description}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                    <Icons.Check /> Modify
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setIsPreviewOpen(true);
                    }}
                    className="flex-1 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Icons.Chart /> Preview
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
          <button className="w-full py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Icons.Check /> Bulk Save
          </button>
          <button 
            onClick={() => handleSendMessage(undefined, "Not quite what I had in mind")}
            className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Not quite what I had in mind
          </button>
          <button 
            onClick={() => handleSendMessage(undefined, "Suggest More Recipes")}
            className="w-full py-2.5 text-sm font-medium text-primary hover:text-teal-700 transition-colors flex items-center justify-center gap-2"
          >
            <Icons.Leaf /> Suggest More Recipes
          </button>
        </div>
      </div>

      {/* Settings Modal Overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Recipe Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
                  <Icons.User /> Basic Info
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                    <select 
                      value={settingsForm.servings}
                      onChange={(e) => setSettingsForm({...settingsForm, servings: e.target.value})}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 py-2.5 px-3"
                    >
                      <option>1 person</option>
                      <option>2 people</option>
                      <option>3 people</option>
                      <option>4 people</option>
                      <option>5+ people</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select 
                      value={settingsForm.country}
                      onChange={(e) => setSettingsForm({...settingsForm, country: e.target.value})}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 py-2.5 px-3"
                    >
                      <option>Philippines</option>
                      <option>United States</option>
                      <option>Japan</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Dietary Preferences */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
                  <Icons.Leaf /> Dietary Preferences
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Options</label>
                    <div className="w-full min-h-[42px] border border-gray-300 rounded-lg p-1.5 flex flex-wrap gap-1.5 items-center bg-white">
                      {settingsForm.dietaryOptions.map(option => (
                        <span key={option} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-md flex items-center gap-1">
                          {option}
                          <button onClick={() => removeDietaryOption(option)} className="hover:text-emerald-900 ml-0.5">
                            &times;
                          </button>
                        </span>
                      ))}
                      <select 
                        className="flex-1 min-w-[120px] border-none focus:ring-0 text-sm py-1 px-2 text-gray-500 bg-transparent"
                        onChange={(e) => {
                          if (e.target.value && !settingsForm.dietaryOptions.includes(e.target.value)) {
                            setSettingsForm(prev => ({...prev, dietaryOptions: [...prev.dietaryOptions, e.target.value]}));
                          }
                          e.target.value = ""; // reset
                        }}
                      >
                        <option value="">Add option...</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Keto">Keto</option>
                        <option value="Paleo">Paleo</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                        <option value="Dairy-Free">Dairy-Free</option>
                        <option value="Halal">Halal</option>
                        <option value="Kosher">Kosher</option>
                        <option value="Pescatarian">Pescatarian</option>
                        <option value="Low-FODMAP">Low-FODMAP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies to Avoid</label>
                    <div className="w-full min-h-[42px] border border-gray-300 rounded-lg p-1.5 flex flex-wrap gap-1.5 items-center bg-white">
                      {settingsForm.allergies.map(allergy => (
                        <span key={allergy} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-md flex items-center gap-1">
                          {allergy}
                          <button onClick={() => removeAllergy(allergy)} className="hover:text-emerald-900 ml-0.5">
                            &times;
                          </button>
                        </span>
                      ))}
                      <select 
                        className="flex-1 min-w-[120px] border-none focus:ring-0 text-sm py-1 px-2 text-gray-500 bg-transparent"
                        onChange={(e) => {
                          if (e.target.value && !settingsForm.allergies.includes(e.target.value)) {
                            setSettingsForm(prev => ({...prev, allergies: [...prev.allergies, e.target.value]}));
                          }
                          e.target.value = ""; // reset
                        }}
                      >
                        <option value="">Add allergy...</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Soy">Soy</option>
                        <option value="Tree Nuts">Tree Nuts</option>
                        <option value="Shellfish">Shellfish</option>
                        <option value="Peanuts">Peanuts</option>
                        <option value="Gluten">Gluten</option>
                        <option value="Eggs">Eggs</option>
                        <option value="Fish">Fish</option>
                        <option value="Wheat">Wheat</option>
                        <option value="Sesame">Sesame</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Ingredients to Avoid</label>
                      <button 
                        onClick={() => setIsAddIngredientOpen(true)}
                        className="text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        + Add Ingredient
                      </button>
                    </div>
                    <div className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-sm text-gray-500 min-h-[46px] flex flex-wrap gap-2">
                      {settingsForm.ingredientsToAvoid.length === 0 ? (
                        <span>No ingredients added</span>
                      ) : (
                        settingsForm.ingredientsToAvoid.map(ingredient => (
                          <span key={ingredient} className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md flex items-center gap-1">
                            {ingredient}
                            <button onClick={() => removeIngredientToAvoid(ingredient)} className="hover:text-gray-900 ml-0.5">
                              &times;
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearSettings}
                className="px-5 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear All
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal Overlay */}
      {isAddIngredientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Ingredient to Avoid</h2>
              <button 
                onClick={() => setIsAddIngredientOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Ingredient</label>
                <input 
                  type="text" 
                  value={newIngredientText}
                  onChange={(e) => setNewIngredientText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                  autoFocus
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-20 py-2.5 px-3"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setIsAddIngredientOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddIngredient}
                disabled={!newIngredientText.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal Overlay */}
      {isPreviewOpen && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111] text-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#1a1a1a]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-orange-500 font-medium">
                  <Icons.User /> Servings
                </div>
                <div className="flex items-center bg-black rounded-lg border border-gray-800 overflow-hidden">
                  <button 
                    onClick={() => setPreviewServings(Math.max(1, previewServings - 1))}
                    className="px-3 py-1 hover:bg-gray-800 transition-colors text-gray-400"
                  >-</button>
                  <span className="px-4 py-1 border-x border-gray-800 text-white font-medium">{previewServings}</span>
                  <button 
                    onClick={() => setPreviewServings(previewServings + 1)}
                    className="px-3 py-1 hover:bg-gray-800 transition-colors text-gray-400"
                  >+</button>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors bg-gray-900/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <p className="text-gray-400 text-lg leading-relaxed">
                {selectedRecipe.description}
              </p>

              {/* Ingredients */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Ingredients</h3>
                  <div className="flex items-center bg-black rounded-lg border border-gray-800 overflow-hidden">
                    <span className="px-3 py-1 text-orange-500 font-serif italic">T</span>
                    <button 
                      onClick={() => setPreviewTextSize(Math.max(80, previewTextSize - 10))}
                      className="px-3 py-1 hover:bg-gray-800 transition-colors text-gray-400 border-l border-gray-800"
                    >-</button>
                    <span className="px-3 py-1 border-x border-gray-800 text-gray-300 text-sm">{previewTextSize}%</span>
                    <button 
                      onClick={() => setPreviewTextSize(Math.min(150, previewTextSize + 10))}
                      className="px-3 py-1 hover:bg-gray-800 transition-colors text-gray-400"
                    >+</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8" style={{ fontSize: `${previewTextSize}%` }}>
                  {selectedRecipe.ingredients?.map((ingredient, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500/50 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation */}
              {selectedRecipe.preparation && selectedRecipe.preparation.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Preparation</h3>
                  <div className="space-y-4" style={{ fontSize: `${previewTextSize}%` }}>
                    {selectedRecipe.preparation.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-orange-500 font-bold min-w-[1.5rem]">{idx + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Instructions</h3>
                  <div className="space-y-6" style={{ fontSize: `${previewTextSize}%` }}>
                    {selectedRecipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-orange-500 font-bold min-w-[1.5rem]">{idx + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
              <button 
                onClick={() => {
                  // Add to saved recipes logic would go here
                  setIsPreviewOpen(false);
                }}
                className="w-full py-3.5 text-base font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Icons.Bookmark /> Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditor;