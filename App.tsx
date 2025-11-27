import React, { useState, useEffect } from 'react';
import { DailyPlanState, TodoItem } from './types';
import { PlannerSheet } from './components/PlannerSheet';
import { generatePlanFromGoal } from './services/geminiService';

const INITIAL_TODOS: TodoItem[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `todo-${i}`,
  text: '',
  completed: false
}));

const INITIAL_STATE: DailyPlanState = {
  date: new Date().toISOString().split('T')[0],
  selectedDay: new Date().getDay(),
  priorities: ['', '', ''],
  progress: 0,
  schedule: {},
  scheduleColors: {},
  todos: INITIAL_TODOS,
  notes: ''
};

function App() {
  const [plannerState, setPlannerState] = useState<DailyPlanState>(INITIAL_STATE);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zenith_planner_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migration logic for old data format (mainGoal -> priorities)
        if (parsed.mainGoal && (!parsed.priorities || parsed.priorities.length === 0)) {
          parsed.priorities = [parsed.mainGoal, '', ''];
        }
        
        // Ensure priorities array exists and has length 3
        if (!parsed.priorities || !Array.isArray(parsed.priorities)) {
           parsed.priorities = ['', '', ''];
        } else {
           while(parsed.priorities.length < 3) parsed.priorities.push('');
        }

        setPlannerState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('zenith_planner_state', JSON.stringify(plannerState));
  }, [plannerState]);

  const updateState = (updates: Partial<DailyPlanState>) => {
    setPlannerState(prev => ({ ...prev, ...updates }));
  };

  const handleAIPlanning = async () => {
    // Check if at least one priority is set
    if (plannerState.priorities.every(p => !p.trim())) return;

    setIsGenerating(true);
    try {
      const result = await generatePlanFromGoal(plannerState.priorities);
      
      if (result) {
        const newSchedule = { ...plannerState.schedule };
        // Map string keys to numbers for the schedule
        Object.entries(result.schedule).forEach(([key, val]) => {
          const hour = parseInt(key);
          if (!isNaN(hour)) {
            newSchedule[hour] = val;
          }
        });

        // Merge generated todos with existing structure
        const newTodos = [...plannerState.todos];
        if (result.todos && Array.isArray(result.todos)) {
            result.todos.forEach((text, index) => {
                if (index < newTodos.length) {
                    newTodos[index].text = text;
                    newTodos[index].completed = false;
                }
            });
        }

        updateState({
          schedule: newSchedule,
          todos: newTodos,
          notes: plannerState.notes ? plannerState.notes + "\n\n" + result.notes : result.notes
        });
      }
    } catch (error) {
      console.error("Failed to generate plan", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetPlanner = () => {
    if (confirm("정말로 계획표를 초기화하시겠습니까?")) {
        setPlannerState(INITIAL_STATE);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <PlannerSheet 
        state={plannerState} 
        onUpdate={updateState} 
        onGenerateAI={handleAIPlanning}
        isGenerating={isGenerating}
        onReset={resetPlanner}
      />
    </div>
  );
}

export default App;