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

  // Расчет прогресса для CHECKBOX задач
  if (checkboxTasks.length) {
    const checkboxProgress =
      (checkboxTasks.reduce((sum, task) => sum + (task.completed ? 1 : 0), 0) /
        checkboxTasks.length) *
      100;
    progressParts.push(Math.min(100, checkboxProgress));
  }

  // Расчет прогресса для калорий
  if (calorieTasks.length) {
    const totalCalories = calorieTasks.reduce((sum, task) => sum + (typeof task.value === 'number' ? task.value : 0), 0);
    const calorieProgress = calculateTaskProgress(totalCalories, settings.calorieTarget);
    progressParts.push(Math.min(100, calorieProgress));
  }

  // Расчет прогресса для времени
  if (timeTasks.length && type === CategoryType.TIME) {
    const totalTime = timeTasks.reduce((sum, task) => sum + (typeof task.value === 'number' ? task.value : 0), 0);
    const timeProgress = calculateTaskProgress(totalTime, settings.timeTarget);
    progressParts.push(Math.min(100, timeProgress));
  }

  // Вычисляем средний прогресс
  return progressParts.length
    ? Math.min(100, progressParts.reduce((a, b) => a + b) / progressParts.length)
    : 0;
}

export function calculateDayScore(day: { categories: Category[] } | Category[]): number {
  // Обрабатываем оба варианта входных данных
  const categories = Array.isArray(day) ? day : day.categories;
  if (!Array.isArray(categories) || categories.length === 0) return 0;

  // Учитываем только категории активности (первые 4)
  const activityCategories = categories.slice(0, 4);
  if (!activityCategories.length) return 0;

  // Считаем общий прогресс по всем категориям
  const totalProgress = activityCategories.reduce(
    (sum, category) => sum + calculateCategoryProgress(category.tasks, category.type),
    0
  );

  // Возвращаем среднее значение прогресса, округленное до целых
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