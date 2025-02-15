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

  let totalTasks = 0;
  let completedValue = 0;
  let targetValue = 0;

  // Calculate checkbox tasks progress
  if (checkboxTasks.length) {
    totalTasks += checkboxTasks.length;
    completedValue += checkboxTasks.reduce((sum, task) => sum + (task.completed ? 1 : 0), 0);
    targetValue += checkboxTasks.length;
  }

  // Calculate calorie tasks progress
  if (calorieTasks.length) {
    totalTasks += calorieTasks.length;
    completedValue += calorieTasks.reduce((sum, task) => sum + (typeof task.value === 'number' ? task.value : 0), 0);
    targetValue += settings.calorieTarget;
  }

  // Calculate time tasks progress
  if (timeTasks.length && type === CategoryType.TIME) {
    totalTasks += timeTasks.length;
    completedValue += timeTasks.reduce((sum, task) => sum + (typeof task.value === 'number' ? task.value : 0), 0);
    targetValue += settings.timeTarget;
  }

  // If no tasks with progress to calculate, return 0
  if (totalTasks === 0) return 0;

  // Calculate final progress percentage
  return Math.min(100, (completedValue / targetValue) * 100);
}

export function calculateDayScore(day: { categories: Category[] } | Category[]): number {
  // Handle both array of categories and object with categories property
  const categories = Array.isArray(day) ? day : day.categories;
  if (!Array.isArray(categories) || categories.length === 0) return 0;

  // Only consider activity tracker categories (first 4 categories)
  const activityCategories = categories.slice(0, 4);
  if (!activityCategories.length) return 0;

  // Calculate progress for each category using the same method as calculateCategoryProgress
  const totalProgress = activityCategories.reduce(
    (sum, category) => sum + calculateCategoryProgress(category.tasks, category.type),
    0
  );

  // Calculate average progress across all categories
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