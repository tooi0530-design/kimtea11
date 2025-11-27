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

  // Helper to load state for a specific date
  const loadStateForDate = (date: string): DailyPlanState => {
    const key = `zenith_planner_${date}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure migration/integrity
        if (!parsed.priorities || !Array.isArray(parsed.priorities)) {
           parsed.priorities = ['', '', ''];
        }
        while(parsed.priorities.length < 3) parsed.priorities.push('');
        
        return { ...parsed, date }; // Ensure date matches key
      } catch (e) {
        console.error("Failed to parse saved state for date", date, e);
      }
    }
    return { ...INITIAL_STATE, date, selectedDay: new Date(date).getDay() };
  };

  // Initialization: Load today's data or migrate legacy data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `zenith_planner_${today}`;
    
    // Check if we have data for today
    if (localStorage.getItem(todayKey)) {
      setPlannerState(loadStateForDate(today));
    } else {
      // Check for legacy single-file data
      const legacySaved = localStorage.getItem('zenith_planner_state');
      if (legacySaved) {
        try {
          const parsed = JSON.parse(legacySaved);
          // Migration logic
          if (parsed.mainGoal && (!parsed.priorities || parsed.priorities.length === 0)) {
            parsed.priorities = [parsed.mainGoal, '', ''];
          }
          if (!parsed.priorities) parsed.priorities = ['', '', ''];
          
          // Use legacy data but update date to today
          const migratedState = { ...parsed, date: today, selectedDay: new Date(today).getDay() };
          setPlannerState(migratedState);
          
          // Save to new format immediately
          localStorage.setItem(todayKey, JSON.stringify(migratedState));
          // Optional: localStorage.removeItem('zenith_planner_state');
        } catch (e) {
          setPlannerState(loadStateForDate(today));
        }
      } else {
        setPlannerState(loadStateForDate(today));
      }
    }
  }, []);

  // Save changes automatically to the key corresponding to the current state's date
  useEffect(() => {
    if (plannerState.date) {
      const key = `zenith_planner_${plannerState.date}`;
      localStorage.setItem(key, JSON.stringify(plannerState));
    }
  }, [plannerState]);

  const updateState = (updates: Partial<DailyPlanState>) => {
    // If date is changing, we need to load the data for the new date
    if (updates.date && updates.date !== plannerState.date) {
      const newDate = updates.date;
      const newState = loadStateForDate(newDate);
      setPlannerState(newState);
    } else {
      setPlannerState(prev => ({ ...prev, ...updates }));
    }
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
        // Resetting only the current date's plan
        setPlannerState({ 
          ...INITIAL_STATE, 
          date: plannerState.date, 
          selectedDay: new Date(plannerState.date).getDay() 
        });
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