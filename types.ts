export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ScheduleItem {
  hour: number;
  activity: string;
}

export interface DailyPlanState {
  date: string;
  selectedDay: number; // 0-6 (Sun-Sat)
  priorities: string[]; // Array of 3 priority strings
  progress: number; // 0-100
  schedule: Record<number, string>; // hour -> activity
  scheduleColors: Record<number, string>; // hour -> tailwind bg class
  todos: TodoItem[];
  notes: string;
}

export interface AIPlanResponse {
  schedule: Record<string, string>; // We'll map string keys from JSON to number
  todos: string[];
  notes: string;
}