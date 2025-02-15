import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskType, CategoryType, type Category } from "@shared/schema";
import { storage } from "./storage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateTaskProgress(value: number, target: number): number {
  // Ensure progress never exceeds 100
  return Math.min(100, (value / target) * 100);
}

export function calculateCategoryProgress(tasks: Category['tasks'], type: CategoryType): number {
  if (!tasks || !tasks.length) return 0;

  switch (type) {
    case CategoryType.ACTIVITY: { // Mind category
      // For mind category, each checkbox task contributes equally
      const checkboxTasks = tasks.filter(task => task.type === TaskType.CHECKBOX);
      if (!checkboxTasks.length) return 0;
      const completed = checkboxTasks.filter(task => task.completed).length;
      return (completed / checkboxTasks.length) * 100;
    }

    case CategoryType.EXERCISE: { // Sport category
      const components = [];

      // Handle checkbox tasks (таблетки, тренировки)
      const checkboxTasks = tasks.filter(task => task.type === TaskType.CHECKBOX);
      if (checkboxTasks.length) {
        const completed = checkboxTasks.filter(task => task.completed).length;
        components.push((completed / checkboxTasks.length) * 100);
      }

      // Handle calorie tasks
      const calorieTasks = tasks.filter(task => task.type === TaskType.CALORIE);
      if (calorieTasks.length) {
        const settings = storage.getSettings();
        const totalCalories = calorieTasks.reduce((sum, task) => 
          sum + (typeof task.value === 'number' ? task.value : 0), 0);
        components.push(calculateTaskProgress(totalCalories, settings.calorieTarget));
      }

      return components.length ? components.reduce((a, b) => a + b) / components.length : 0;
    }

    case CategoryType.TIME: {
      const settings = storage.getSettings();
      const timeTasks = tasks.filter(task => task.type === TaskType.TIME);
      if (!timeTasks.length) return 0;

      const totalTime = timeTasks.reduce((sum, task) => 
        sum + (typeof task.value === 'number' ? task.value : 0), 0);

      return calculateTaskProgress(totalTime, settings.timeTarget);
    }

    case CategoryType.HABIT: { // Habits category
      // For habits, each checkbox task contributes equally
      const checkboxTasks = tasks.filter(task => task.type === TaskType.CHECKBOX);
      if (!checkboxTasks.length) return 0;
      const completed = checkboxTasks.filter(task => task.completed).length;
      return (completed / checkboxTasks.length) * 100;
    }

    default:
      return 0;
  }
}

export function calculateDayScore(day: { categories: Category[] } | Category[]): number {
  // Handle both array of categories and object with categories property
  const categories = Array.isArray(day) ? day : day.categories;
  if (!Array.isArray(categories) || categories.length === 0) return 0;

  // Filter out expense categories and only consider first 4 activity categories
  const activityCategories = categories
    .filter(category => category.type !== CategoryType.EXPENSE)
    .slice(0, 4);

  if (!activityCategories.length) return 0;

  // Calculate progress for each category
  const categoryScores = activityCategories.map(category => 
    calculateCategoryProgress(category.tasks, category.type));

  // Average all category scores for the final day score
  const totalScore = categoryScores.reduce((sum, score) => sum + score, 0);
  return Math.round(totalScore / categoryScores.length);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

export function formatTimeValue(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}