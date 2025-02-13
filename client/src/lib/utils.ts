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
  if (!tasks.length) return 0;

  const checkboxTasks = tasks.filter((task) => task.type === TaskType.CHECKBOX);
  const calorieTasks = tasks.filter((task) => task.type === TaskType.CALORIE);
  const timeTasks = tasks.filter((task) => task.type === TaskType.TIME);
  const settings = storage.getSettings();

  const progressParts = [];

  // Calculate checkbox progress (already maxed at 100%)
  if (checkboxTasks.length) {
    const checkboxProgress =
      (checkboxTasks.reduce((sum, task) => sum + (task.completed ? 1 : 0), 0) /
        checkboxTasks.length) *
      100;
    progressParts.push(Math.min(100, checkboxProgress));
  }

  // Calculate calorie progress
  if (calorieTasks.length) {
    const totalCalories = calorieTasks.reduce((sum, task) => sum + (typeof task.value === 'number' ? task.value : 0), 0);
    const calorieProgress = calculateTaskProgress(totalCalories, settings.calorieTarget);
    progressParts.push(Math.min(100, calorieProgress));
  }

  // Calculate time progress
  if (timeTasks.length && type === CategoryType.TIME) {
    const totalTime = timeTasks.reduce((sum, task) => sum + (typeof task.value === 'number' ? task.value : 0), 0);
    const timeProgress = calculateTaskProgress(totalTime, settings.timeTarget);
    progressParts.push(Math.min(100, timeProgress));
  }

  // Calculate average progress, ensuring it doesn't exceed 100
  return progressParts.length
    ? Math.min(100, progressParts.reduce((a, b) => a + b) / progressParts.length)
    : 0;
}

export function calculateDayScore(day: { categories: Category[] }): number {
  if (!day || !Array.isArray(day.categories) || day.categories.length === 0) return 0;

  const activityCategories = day.categories.slice(0, 4); // Only consider activity tracker categories
  if (!activityCategories.length) return 0;

  const totalProgress = activityCategories.reduce(
    (sum, category) => sum + calculateCategoryProgress(category.tasks, category.type),
    0
  );

  // Ensure the final day score is also capped at 100
  return Math.min(100, Math.round(totalProgress / activityCategories.length));
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