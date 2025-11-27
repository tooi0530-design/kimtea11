import React, { useState, useRef, useEffect } from 'react';
import { DailyPlanState, TodoItem } from '../types';
import { Check, Loader2, Sparkles, RefreshCw, Palette } from 'lucide-react';

interface PlannerSheetProps {
  state: DailyPlanState;
  onUpdate: (updates: Partial<DailyPlanState>) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  onReset: () => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 6 to 24

const COLOR_PALETTE = [
  { name: 'None', class: '' },
  { name: 'Red', class: 'bg-red-100' },
  { name: 'Orange', class: 'bg-orange-100' },
  { name: 'Yellow', class: 'bg-amber-100' },
  { name: 'Green', class: 'bg-green-100' },
  { name: 'Blue', class: 'bg-blue-100' },
  { name: 'Purple', class: 'bg-purple-100' },
  { name: 'Gray', class: 'bg-stone-200' },
];

export const PlannerSheet: React.FC<PlannerSheetProps> = ({ 
  state, 
  onUpdate, 
  onGenerateAI, 
  isGenerating,
  onReset
}) => {
  const [activeColorHour, setActiveColorHour] = useState<number | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setActiveColorHour(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleScheduleChange = (hour: number, value: string) => {
    onUpdate({
      schedule: {
        ...state.schedule,
        [hour]: value
      }
    });
  };

  const handleColorChange = (hour: number, colorClass: string) => {
    onUpdate({
      scheduleColors: {
        ...state.scheduleColors,
        [hour]: colorClass
      }
    });
    setActiveColorHour(null);
  };

  const handleTodoChange = (id: string, text: string) => {
    const newTodos = state.todos.map(t => t.id === id ? { ...t, text } : t);
    onUpdate({ todos: newTodos });
  };

  const toggleTodo = (id: string) => {
    const newTodos = state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    onUpdate({ todos: newTodos });
  };

  const handlePriorityChange = (index: number, value: string) => {
    const newPriorities = [...state.priorities];
    newPriorities[index] = value;
    onUpdate({ priorities: newPriorities });
  };

  // Calculate filled percentage for the progress bar visual
  const progressPercentage = state.progress;
  const hasPriorities = state.priorities.some(p => p.trim() !== '');

  return (
    <div className="w-full max-w-[900px] bg-white aspect-[1/1.414] md:aspect-auto md:min-h-[1100px] shadow-2xl p-6 md:p-12 relative mx-auto my-8 border border-gray-300">
      
      {/* Top Controls (Digital Overlay) */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden">
         <button 
          onClick={onReset}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="계획표 초기화"
        >
          <RefreshCw size={18} />
        </button>
        <button 
          onClick={onGenerateAI}
          disabled={!hasPriorities || isGenerating}
          className={`flex items-center gap-2 px-4 py-2 bg-stone-800 text-white text-xs uppercase tracking-widest hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${!hasPriorities ? 'opacity-0' : 'opacity-100'}`}
        >
          {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
          {isGenerating ? "계획 중..." : "자동 계획"}
        </button>
      </div>

      {/* Main Title */}
      <div className="text-center mb-10 mt-2">
        <h1 className="font-heading text-4xl md:text-6xl text-stone-900 tracking-wider font-bold">일일 계획표</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          
          {/* Header Section: Date & Main Plan */}
          <div className="space-y-6">
            <div className="flex flex-col border-b-2 border-stone-800 pb-2">
              <span className="font-display font-bold text-lg text-stone-800 uppercase tracking-widest mb-1">Daily Planner</span>
              <div className="flex justify-between items-end">
                <input 
                  type="date" 
                  value={state.date}
                  onChange={(e) => onUpdate({ date: e.target.value })}
                  className="font-display text-stone-600 bg-transparent focus:outline-none"
                />
                <div className="flex gap-3 text-xs font-serif">
                  <span className="text-stone-400 mr-2">Date.</span>
                  {DAYS.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdate({ selectedDay: idx })}
                      className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${state.selectedDay === idx ? 'bg-red-400 text-white font-bold' : 'text-stone-500 hover:bg-gray-100'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priorities Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-l-4 border-stone-300 pl-2">
                <span className="font-display font-bold text-stone-500">Priorities.</span>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="font-heading font-bold text-stone-400 text-lg italic w-4">{index + 1}.</span>
                    <input
                      type="text"
                      value={state.priorities[index]}
                      onChange={(e) => handlePriorityChange(index, e.target.value)}
                      placeholder=""
                      className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 focus:outline-none py-1 font-handwriting text-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timetable Section */}
          <div>
             <div className="flex items-center gap-2 mb-4 border-l-4 border-stone-300 pl-2">
                <span className="font-display font-bold text-stone-500">Timetable.</span>
              </div>
              
              <div className="border border-stone-300 relative">
                {HOURS.map((hour) => (
                  <div 
                    key={hour} 
                    className={`flex border-b border-stone-200 last:border-b-0 h-10 group transition-colors ${state.scheduleColors?.[hour] || 'hover:bg-stone-50'}`}
                  >
                    <div className="relative w-12 border-r border-stone-300 flex items-center justify-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColorHour(activeColorHour === hour ? null : hour);
                        }}
                        className="w-full h-full text-stone-500 text-xs font-mono hover:text-stone-800 hover:bg-black/5 flex items-center justify-center transition-colors"
                        title="색상 변경"
                      >
                        {hour}
                      </button>

                      {/* Color Picker Popover */}
                      {activeColorHour === hour && (
                        <div 
                          ref={colorPickerRef}
                          className="absolute left-full top-0 ml-2 z-20 bg-white shadow-xl border border-stone-200 p-2 rounded-md grid grid-cols-4 gap-1 w-[100px]"
                        >
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => handleColorChange(hour, color.class)}
                              className={`w-5 h-5 rounded-full border border-stone-200 ${color.class || 'bg-white relative overflow-hidden'}`}
                              title={color.name}
                            >
                              {color.class === '' && (
                                <div className="absolute inset-0 border-t border-red-400 rotate-45 transform origin-center scale-110 opacity-50"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <input 
                      type="text"
                      value={state.schedule[hour] || ''}
                      onChange={(e) => handleScheduleChange(hour, e.target.value)}
                      className="flex-1 px-3 bg-transparent focus:outline-none text-sm text-stone-700"
                    />
                  </div>
                ))}
              </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8 flex flex-col h-full">
          
          {/* Progress Section */}
          <div>
            <div className="flex items-center gap-2 mb-2 border-l-4 border-stone-300 pl-2">
                <span className="font-display font-bold text-stone-500">Progress[%]</span>
            </div>
            <div className="relative pt-6 pb-2">
              <div className="h-4 border border-stone-300 w-full relative bg-stone-50 cursor-pointer"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const pct = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
                     onUpdate({ progress: pct });
                   }}>
                <div 
                  className="h-full bg-stone-800 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
                {/* Ticks */}
                <div className="absolute top-full mt-1 left-0 text-[10px] text-stone-400">0</div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[10px] text-stone-400">50</div>
                <div className="absolute top-full mt-1 right-0 text-[10px] text-stone-400">100</div>
              </div>
            </div>
          </div>

          {/* Todo List Section */}
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-2 border-l-4 border-stone-300 pl-2">
                <span className="font-display font-bold text-stone-500">Todo List.</span>
            </div>
            <div className="space-y-1">
              {state.todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 border-b border-stone-200 py-2 group hover:bg-stone-50 px-2 transition-colors">
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 border border-stone-300 flex items-center justify-center transition-colors ${todo.completed ? 'bg-stone-800 border-stone-800' : 'bg-white hover:border-stone-400'}`}
                  >
                    {todo.completed && <Check size={14} className="text-white" />}
                  </button>
                  <input 
                    type="text"
                    value={todo.text}
                    onChange={(e) => handleTodoChange(todo.id, e.target.value)}
                    className={`flex-1 bg-transparent focus:outline-none text-sm ${todo.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}
                  />
                </div>
              ))}
              {/* Add empty slots to match the visual if needed, but keeping it dynamic is better for UX */}
            </div>
          </div>

          {/* Note Section */}
          <div className="flex-1 flex flex-col min-h-[250px]">
             <div className="flex items-center gap-2 mb-2 border-l-4 border-stone-300 pl-2">
                <span className="font-display font-bold text-stone-500">Note.</span>
            </div>
            <textarea
              value={state.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              className="flex-1 w-full border border-stone-300 p-4 font-mono text-sm leading-[20px] text-stone-600 focus:outline-none focus:border-stone-400 resize-none graph-paper"
            />
          </div>

        </div>
      </div>
    </div>
  );
};