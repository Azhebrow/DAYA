import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { storage } from "@/lib/storage";
import {
  DayEntry,
  CategoryType,
  TaskType,
  settingsSchema,
  Settings as SettingsType,
} from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameWeek, isSameMonth, differenceInDays, startOfYear } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { calculateDayScore } from "@/lib/utils";
import {
  ActivitySquare,
  Flame,
  Clock,
  LineChart,
  DollarSign,
  FileText,
  BarChartIcon,
  CheckIcon,
  X,
  Brain,
  Dumbbell,
  Ban,
} from "lucide-react";

const CATEGORY_ORDER = ["Разум", "Привычки", "Спорт", "Время"];

const getCssVar = (varName: string): string => {
  if (typeof document === 'undefined') return '#000000';
  if (!varName) return '#000000';

  try {
    const cssVar = varName.startsWith('--') ? varName : `--${varName}`;
    return getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim() || '#000000';
  } catch (error) {
    console.error('Error getting CSS variable:', error);
    return '#000000';
  }
};

function hexToRGBA(hex: string, alpha: number): string {
  try {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`;

    if (hex.startsWith('var(')) {
      const varName = hex.slice(4, -1);
      hex = getCssVar(varName);
    }

    if (hex.startsWith('rgb')) {
      return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    }

    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    if (cleanHex.length !== 6) return `rgba(0, 0, 0, ${alpha})`;

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    console.error('Error converting color to RGBA:', error);
    return `rgba(0, 0, 0, ${alpha})`;
  }
}

function Statistics() {
  const [settings, setSettings] = useState<SettingsType>(() => {
    try {
      const stored = localStorage.getItem("day_success_tracker_settings");
      if (!stored) return settingsSchema.parse({});
      const parsedSettings = settingsSchema.parse(JSON.parse(stored));
      return parsedSettings;
    } catch (error) {
      console.error("Error parsing settings:", error);
      return settingsSchema.parse({});
    }
  });

  const getVarColor = (varName: string): string => {
    if (!varName) return '#000000';
    try {
      return `var(${varName})`;
    } catch (error) {
      console.error('Error getting var color:', error);
      return '#000000';
    }
  };

  const CATEGORY_COLORS: { [key: string]: string } = {
    'Разум': getVarColor(settings.colors.mind),
    'Время': getVarColor(settings.colors.time),
    'Спорт': getVarColor(settings.colors.sport),
    'Привычки': getVarColor(settings.colors.habits),
    'Траты': getVarColor(settings.colors.expenses),
    'Успех': getVarColor(settings.colors.daySuccess)
  };

  const CATEGORY_HEADER_COLORS: { [key: string]: { bg: string; text: string } } = {
    'Разум': {
      bg: hexToRGBA(getCssVar(settings.colors.mind), 0.2),
      text: "#ffffff"
    },
    'Время': {
      bg: hexToRGBA(getCssVar(settings.colors.time), 0.2),
      text: "#ffffff"
    },
    'Спорт': {
      bg: hexToRGBA(getCssVar(settings.colors.sport), 0.2),
      text: "#ffffff"
    },
    'Привычки': {
      bg: hexToRGBA(getCssVar(settings.colors.habits), 0.2),
      text: "#ffffff"
    }
  };

  const [timeRange, setTimeRange] = useState<"7" | "14" | "30">("7");
  const [displayType, setDisplayType] = useState<"days" | "weeks" | "months">("days");
  const [data, setData] = useState<DayEntry[]>([]);
  const [dateRangeText, setDateRangeText] = useState("");

  useEffect(() => {
    if (displayType === "days") {
      const endDate = startOfDay(new Date());
      const daysToSubtract = parseInt(timeRange);
      const startDate = subDays(endDate, daysToSubtract - 1);

      setDateRangeText(
        `${format(startDate, "dd.MM")} - ${format(endDate, "dd.MM")}`,
      );

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const days: DayEntry[] = [];

      dateRange.forEach((date) => {
        const entry = storage.getDayEntry(format(date, "yyyy-MM-dd"));
        if (entry) {
          days.push(entry);
        }
      });

      setData(days);
    } else if (displayType === "weeks") {
      const endDate = startOfDay(new Date());
      const startDate = subDays(endDate, 30); // Always show last 30 days for weeks view

      setDateRangeText(
        `${format(startDate, "MMMM", { locale: ru })} - ${format(endDate, "MMMM", { locale: ru })}`,
      );

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const days: DayEntry[] = [];

      dateRange.forEach((date) => {
        const entry = storage.getDayEntry(format(date, "yyyy-MM-dd"));
        if (entry) {
          days.push(entry);
        }
      });

      setData(days);
    } else if (displayType === "months") {
      const endDate = startOfDay(new Date());
      const startDate = subDays(endDate, 90); // Show last 3 months for months view

      setDateRangeText(
        `${format(startDate, "MMMM yyyy", { locale: ru })} - ${format(endDate, "MMMM yyyy", { locale: ru })}`,
      );

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const days: DayEntry[] = [];

      dateRange.forEach((date) => {
        const entry = storage.getDayEntry(format(date, "yyyy-MM-dd"));
        if (entry) {
          days.push(entry);
        }
      });

      setData(days);
    }
  }, [timeRange, displayType]);

  const aggregateTaskData = (days: DayEntry[], periodKey: string) => {
    const taskData: {
      [key: string]: {
        completedCount: number;
        totalCount: number;
        totalTime: number;
        totalCalories: number;
      };
    } = {};

    days.forEach(day => {
      day.categories
        .filter(category => category.type !== CategoryType.EXPENSE)
        .forEach(category => {
          category.tasks.forEach(task => {
            const key = `${category.name}-${task.name}`;
            if (!taskData[key]) {
              taskData[key] = {
                completedCount: 0,
                totalCount: 0,
                totalTime: 0,
                totalCalories: 0
              };
            }

            if (task.type === TaskType.CHECKBOX) {
              taskData[key].totalCount++;
              if (task.completed) taskData[key].completedCount++;
            } else if (task.type === TaskType.TIME && typeof task.value === 'number') {
              taskData[key].totalTime += task.value;
            } else if (task.type === TaskType.CALORIE && typeof task.value === 'number') {
              taskData[key].totalCalories += task.value;
            }
          });
        });
    });

    return taskData;
  };

  const getDateRangeKey = (date: Date, displayType: "days" | "weeks" | "months"): string => {
    if (displayType === "days") {
      return format(date, "dd.MM");
    } else if (displayType === "weeks") {
      const weekNum = Math.ceil(differenceInDays(date, startOfYear(date)) / 7);
      return `${weekNum} нед`;
    } else {
      return format(date, "LLL", { locale: ru }); // Возвращает сокращенное название месяца
    }
  };

  const aggregateExpensesByPeriod = (days: DayEntry[], displayType: "days" | "weeks" | "months") => {
    const periodData: { [key: string]: { [category: string]: number } } = {};

    days.forEach(day => {
      const date = new Date(day.date);
      const periodKey = getDateRangeKey(date, displayType);

      if (!periodData[periodKey]) {
        periodData[periodKey] = {};
      }

      day.categories
        .filter(category => category.type === CategoryType.EXPENSE)
        .forEach(category => {
          if (!periodData[periodKey][category.name]) {
            periodData[periodKey][category.name] = 0;
          }

          category.tasks.forEach(task => {
            if (task.type === TaskType.EXPENSE && typeof task.value === 'number') {
              periodData[periodKey][category.name] += task.value;
            }
          });
        });
    });

    return periodData;
  };


  const calculateTotalTime = (day: DayEntry): number => {
    return day.categories.reduce((sum, category) => {
      if (category.type !== CategoryType.TIME) return sum;
      return sum + category.tasks.reduce((taskSum, task) => {
        if (task.type !== TaskType.TIME) return taskSum;
        return taskSum + (task.value || 0);
      }, 0);
    }, 0);
  };

  const calculateTotalCalories = (day: DayEntry): number => {
    return day.categories.reduce((sum, category) => {
      return sum + category.tasks.reduce((taskSum, task) => {
        if (task.type !== TaskType.CALORIE) return taskSum;
        return taskSum + (task.value || 0);
      }, 0);
    }, 0);
  };

  const calculateTotalExpenses = (day: DayEntry): number => {
    return day.categories.reduce((sum, category) => {
      if (category.type !== CategoryType.EXPENSE) return sum;
      return sum + category.tasks.reduce((taskSum, task) => {
        if (task.type !== TaskType.EXPENSE) return taskSum;
        return taskSum + (task.value || 0);
      }, 0);
    }, 0);
  };

  const calculateTimeDistribution = () => {
    const timeByActivity: { [key: string]: { minutes: number; name: string } } = {};
    let totalMinutes = 0;

    data.forEach((day) => {
      const date = new Date(day.date);
      day.categories.forEach((category) => {
        if (category.type !== CategoryType.TIME) return;

        category.tasks.forEach((task) => {
          if (task.type !== TaskType.TIME || typeof task.value !== 'number') return;

          if (displayType === 'days' ||
            (displayType === 'weeks' && isSameWeek(date, new Date(), { locale: ru })) ||
            (displayType === 'months' && isSameMonth(date, new Date()))) {
            const key = task.name;
            if (!timeByActivity[key]) {
              timeByActivity[key] = { minutes: 0, name: task.name };
            }
            timeByActivity[key].minutes += task.value;
            totalMinutes += task.value;
          }
        });
      });
    });

    const distribution = Object.values(timeByActivity)
      .sort((a, b) => b.minutes - a.minutes);

    return { distribution, totalMinutes };
  };

  const calculateExpenseDistribution = () => {
    const expensesByCategory: { [key: string]: { amount: number; name: string } } = {};
    let totalExpenses = 0;

    data.forEach((day) => {
      const date = new Date(day.date);
      day.categories.forEach((category) => {
        if (category.type !== CategoryType.EXPENSE) return;

        category.tasks.forEach((task) => {
          if (task.type !== TaskType.EXPENSE || typeof task.value !== 'number') return;

          if (displayType === 'days' ||
            (displayType === 'weeks' && isSameWeek(date, new Date(), { locale: ru })) ||
            (displayType === 'months' && isSameMonth(date, new Date()))) {
            const key = category.name;
            if (!expensesByCategory[key]) {
              expensesByCategory[key] = { amount: 0, name: `${category.emoji} ${category.name}` };
            }
            expensesByCategory[key].amount += task.value;
            totalExpenses += task.value;
          }
        });
      });
    });

    const distribution = Object.values(expensesByCategory)
      .sort((a, b) => b.amount - a.amount);

    return { distribution, totalExpenses };
  };

  const handleTimeRangeChange = (value: "7" | "14" | "30") => {
    setTimeRange(value);
    const updatedSettings = { ...settings, timeRange: value };
    setSettings(updatedSettings);
    localStorage.setItem(
      "day_success_tracker_settings",
      JSON.stringify(updatedSettings),
    );
  };

  const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
    'Разум': <Brain className="h-4 w-4 inline-block mr-2" />,
    'Время': <Clock className="h-4 w-4 inline-block mr-2" />,
    'Спорт': <Dumbbell className="h-4 w-4 inline-block mr-2" />,
    'Привычки': <Ban className="h-4 w-4 inline-block mr-2" />,
    'Траты': <DollarSign className="h-4 w-4 inline-block mr-2" />,
  };

  const formatTimeTotal = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const aggregateDataByPeriod = () => {
    if (!data.length) return [];

    const aggregatedData: { [key: string]: any } = {};

    data.forEach((day) => {
      const date = new Date(day.date);
      const periodKey = getDateRangeKey(date, displayType);

      if (!aggregatedData[periodKey]) {
        aggregatedData[periodKey] = {
          date: periodKey,
          totalTime: 0,
          calories: 0,
          expenses: 0,
          score: 0,
          count: 0
        };
      }

      aggregatedData[periodKey].totalTime += calculateTotalTime(day);
      aggregatedData[periodKey].calories += calculateTotalCalories(day);
      aggregatedData[periodKey].expenses += calculateTotalExpenses(day);
      aggregatedData[periodKey].score += calculateDayScore(day);
      aggregatedData[periodKey].count += 1;
    });

    return Object.values(aggregatedData).map((period: any) => ({
      ...period,
      score: Math.round(period.score / period.count),
      totalTime: Math.round(period.totalTime),
      calories: Math.round(period.calories),
      expenses: Math.round(period.expenses)
    }));
  };

  const aggregateTasksByPeriod = () => {
    const periodData: { [key: string]: { tasks: { [key: string]: any }; avgScore: number } } = {};

    data.forEach(day => {
      const periodKey = getDateRangeKey(new Date(day.date), displayType);
      const taskData = aggregateTaskData([day], periodKey);

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          tasks: {},
          avgScore: 0,
        };
      }
      Object.assign(periodData[periodKey].tasks, taskData);
      periodData[periodKey].avgScore += calculateDayScore(day);
    });


    for (const periodKey in periodData) {
      periodData[periodKey].avgScore /= data.filter(day => getDateRangeKey(new Date(day.date), displayType) === periodKey).length;
    }

    return periodData;
  };

  const aggregatedData = aggregateDataByPeriod();
  const timeDistribution = calculateTimeDistribution();
  const expenseDistribution = calculateExpenseDistribution();

  const avgDayScore = Math.round(data.reduce((sum, day) => sum + calculateDayScore(day), 0) / data.length);

  const expensesByPeriod = aggregateExpensesByPeriod(data, displayType);
  const uniqueCategories = Array.from(
    new Set(
      data.flatMap(day =>
        day.categories
          .filter(category => category.type === CategoryType.EXPENSE)
          .map(category => category.name)
      )
    )
  );

  // Вычисляем максимальные расходы для всех периодов
  const maxExpense = Object.values(expensesByPeriod).reduce((max, period) =>
    Math.max(max, Object.values(period).reduce((sum, value) => sum + value, 0)), 0);

  const aggregateTasksData = aggregateTasksByPeriod();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Статистика</h1>
          <p className="text-sm text-muted-foreground">{dateRangeText}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={displayType} onValueChange={(value: "days" | "weeks" | "months") => setDisplayType(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Тип отображения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">По дням</SelectItem>
              <SelectItem value="weeks">По неделям</SelectItem>
              <SelectItem value="months">По месяцам</SelectItem>
            </SelectContent>
          </Select>
          {displayType === "days" && (
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Выберите период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 дней</SelectItem>
                <SelectItem value="14">14 дней</SelectItem>
                <SelectItem value="30">30 дней</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <LineChart className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Успех }} />
              Показатель успеха
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={CATEGORY_COLORS.Успех}
                  fill={CATEGORY_COLORS.Успех}
                  name="Успех"
                  dot={{ r: 4 }}
                  label={{ position: "top", fill: CATEGORY_COLORS.Успех }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Время }} />
              Общее время
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                  formatter={(value: any) => formatTimeTotal(value as number)}
                />
                <Area
                  type="monotone"
                  dataKey="totalTime"
                  stroke={CATEGORY_COLORS.Время}
                  fill={CATEGORY_COLORS.Время}
                  name="Время"
                  dot={{ r: 4 }}
                  label={{
                    position: "top",
                    fill: CATEGORY_COLORS.Время,
                    formatter: (value: any) => formatTimeTotal(value as number)
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Спорт }} />
              Калории
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke={CATEGORY_COLORS.Спорт}
                  fill={CATEGORY_COLORS.Спорт}
                  name="Калории"
                  dot={{ r: 4 }}
                  label={{ position: "top", fill: CATEGORY_COLORS.Спорт }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Траты }} />
              Расходы
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke={CATEGORY_COLORS.Траты}
                  fill={CATEGORY_COLORS.Траты}
                  name="Расходы"
                  dot={{ r: 4 }}
                  label={{ position: "top", fill: CATEGORY_COLORS.Траты }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Таблица расходов по категориям */}
      <Card>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Траты }} />
            Расходы по категориям
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-auto">
            <div className="w-full inline-block align-middle min-w-full">
              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th scope="col" className="px-4 py-2 text-left text-sm font-semibold min-w-[90px]">Период</th>
                      <th scope="col" className="px-4 py-2 text-center text-sm font-semibold font-bold min-w-[90px]">Итого</th>
                      {uniqueCategories.map((category) => (
                        <th
                          key={category}
                          className="py-2 px-4 text-center text-sm font-semibold min-w-[90px]"
                          style={{ backgroundColor: hexToRGBA(getCssVar(settings.colors.expenses), 0.2) }}
                        >
                          {category}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {Object.entries(expensesByPeriod).map(([periodKey, categoryTotals]) => {
                      const periodTotal = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

                      return (
                        <tr key={periodKey} className="border-b border-border/10">
                          <td className="px-4 py-2 text-sm font-medium whitespace-nowrap">
                            {periodKey}
                          </td>
                          <td
                            className="px-4 py-2 text-center text-sm font-medium"
                            style={{
                              backgroundColor: hexToRGBA(
                                getCssVar(settings.colors.expenses),
                                Math.min((periodTotal / maxExpense) * 0.4 + 0.1, 0.5)
                              ),
                            }}
                          >
                            {periodTotal} zł
                          </td>
                          {uniqueCategories.map(categoryName => (
                            <td
                              key={categoryName}
                              className="py-2 px-4 text-center text-sm font-semibold min-w-[90px]"
                              style={{
                                backgroundColor: hexToRGBA(
                                  getCssVar(settings.colors.expenses),
                                  Math.min(((categoryTotals[categoryName] || 0) / maxExpense) * 0.4 + 0.1, 0.5)
                                ),
                              }}
                            >
                              {categoryTotals[categoryName] || 0} zł
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-border font-bold">
                      <td className="px-4 py-2 text-sm font-semibold">Итого</td>
                      <td
                        className="px-4 py-2 text-center text-sm font-semibold"
                        style={{
                          backgroundColor: hexToRGBA(
                            getCssVar(settings.colors.expenses),
                            Math.min((Object.values(expensesByPeriod).reduce((sum, categoryTotals) =>
                              sum + Object.values(categoryTotals).reduce((a, b) => a + b, 0), 0) / maxExpense) * 0.4 + 0.1, 0.5)
                          ),
                        }}
                      >
                        {Object.values(expensesByPeriod).reduce((sum, categoryTotals) =>
                          sum + Object.values(categoryTotals).reduce((a, b) => a + b, 0), 0)} zł
                      </td>
                      {uniqueCategories.map(categoryName => {
                        const categoryTotal = Object.values(expensesByPeriod).reduce((sum, period) =>
                          sum + (period[categoryName] || 0), 0);
                        return (
                          <td
                            key={`total-${categoryName}`}
                            className="py-2 px-4 text-center text-sm font-semibold min-w-[90px]"
                            style={{
                              backgroundColor: hexToRGBA(
                                getCssVar(settings.colors.expenses),
                                Math.min((categoryTotal / maxExpense) * 0.4 + 0.1, 0.5)
                              ),
                            }}
                          >
                            {categoryTotal} zł
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица успешности задач по дням */}
      <Card>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChartIcon className="h-4 w-4 sm:h-5 sm:w5" style={{ color: CATEGORY_COLORS.Успех }} />
            Успешность задач по {displayType === "days" ? "дням" : displayType === "weeks" ? "неделям" : "месяцам"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden">
            <div className="w-full inline-block align-middle">
              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-border relative">
                  <thead className="bg-background z-10">
                    <tr className="border-b border-border/20">
                      <th className="bg-background py-2 px-4 text-left text-sm font-semibold w-[100px]">Период</th>
                      <th className="bg-background py-2 px-4 text-center text-sm font-semibold w-[80px]">Успех</th>
                      {data[0]?.categories
                        .filter((category) => category.type !== CategoryType.EXPENSE)
                        .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name))
                        .map((category) => (
                          <th
                            key={category.name}
                            colSpan={category.tasks.length}
                            className="py-2 px-4 text-center text-sm font-semibold"
                            style={{
                              backgroundColor: CATEGORY_HEADER_COLORS[category.name]?.bg || 'transparent',                              color: CATEGORY_HEADER_COLORS[category.name]?.text || '#ffffff'
                            }}
                          >
                            {CATEGORY_ICONS[category.name]}
                            {category.name}
                          </th>
                        ))}
                    </tr>
                    <tr className="border-b border-border/20">
                      <th className="bg-background"></th>
                      <th className="bg-background"></th>
                      {data[0]?.categories
                        .filter((category) => category.type !== CategoryType.EXPENSE)
                        .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name))
                        .flatMap((category) =>
                          category.tasks.map((task) => (
                            <th
                              key={`${category.name}-${task.name}`}
                              className="py-2 px-4 text-center text-xs sm:text-sm font-medium whitespace-nowrap"
                              style={{
                                backgroundColor: CATEGORY_HEADER_COLORS[category.name]?.bg || 'transparent',
                                color: CATEGORY_HEADER_COLORS[category.name]?.text || '#ffffff',
                                opacity: 0.8,
                                minWidth: "80px",
                              }}
                            >
                              {task.name}
                            </th>
                          ))
                        )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {(displayType === "days" ? data : Object.entries(aggregateTasksData)).map((entry) => {
                      const [periodKey, taskData] = displayType === "days"
                        ? [format(new Date(entry.date), "dd.MM"), entry]
                        : entry;

                      return (
                        <tr key={periodKey} className="border-b border-border/10">
                          <td className="bg-background px-4 py-2 font-medium">
                            {periodKey}
                          </td>
                          <td
                            className="px-4 py-2 text-center text-sm font-medium"
                            style={{
                              backgroundColor: hexToRGBA(
                                getCssVar(settings.colors.daySuccess),
                                Math.min((displayType === "days"
                                  ? calculateDayScore(entry as DayEntry)
                                  : (taskData as any).avgScore) / 100 * 0.4 + 0.1, 0.5)
                              )
                            }}
                          >
                            {displayType === "days"
                              ? calculateDayScore(entry as DayEntry)
                              : Math.round((taskData as any).avgScore)}%
                          </td>
                          {data[0]?.categories
                            .filter((category) => category.type !== CategoryType.EXPENSE)
                            .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name))
                            .flatMap((category) =>
                              category.tasks.map((task) => {
                                let displayValue = "";
                                let bgColor = "transparent";
                                let textColor = "inherit";

                                if (displayType === "days") {
                                  const dayEntry = entry as DayEntry;
                                  const categoryInDay = dayEntry.categories.find(c => c.name === category.name);
                                  const taskInDay = categoryInDay?.tasks.find(t => t.name === task.name);

                                  if (task.type === TaskType.CHECKBOX) {
                                    const isCompleted = taskInDay?.completed || false;
                                    displayValue = isCompleted ? "✓" : "×";
                                    if (isCompleted) {
                                      textColor = getCssVar(settings.colors.daySuccess);
                                    }
                                  } else if (task.type === TaskType.TIME) {
                                    const hours = Math.floor((taskInDay?.value || 0) / 60);
                                    displayValue = `${hours}ч`;
                                  } else if (task.type === TaskType.CALORIE) {
                                    displayValue = `${taskInDay?.value || 0}ккал`;
                                  }
                                } else {
                                  const key = `${category.name}-${task.name}`;
                                  const taskStats = (taskData as any).tasks[key] || {
                                    completedCount: 0,
                                    totalCount: 0,
                                    totalTime: 0,
                                    totalCalories: 0
                                  };

                                  if (task.type === TaskType.CHECKBOX) {
                                    const completionRate = taskStats.totalCount > 0
                                      ? Math.round((taskStats.completedCount / taskStats.totalCount) * 100)
                                      : 0;
                                    displayValue = `${completionRate}%`;
                                    bgColor = hexToRGBA(
                                      getCssVar(settings.colors.daySuccess),
                                      Math.min((completionRate / 100) * 0.4 + 0.1, 0.5)
                                    );
                                  } else if (task.type === TaskType.TIME) {
                                    const totalHours = Math.floor(taskStats.totalTime / 60);
                                    displayValue = `${totalHours}ч`;
                                  } else if (task.type === TaskType.CALORIE) {
                                    displayValue = `${taskStats.totalCalories}ккал`;
                                  }
                                }

                                return (
                                  <td
                                    key={`${periodKey}-${category.name}-${task.name}`}
                                    className="px-4 py-2 text-center whitespace-nowrap"
                                    style={{
                                      backgroundColor: bgColor,
                                      color: textColor
                                    }}
                                  >
                                    {displayValue}
                                  </td>
                                );
                              })
                            )}
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-border font-bold">
                      <td className="px-4 py-2 text-sm font-semibold">Итого</td>
                      <td
                        className="px-4 py-2 text-center text-sm font-semibold"
                        style={{
                          backgroundColor: hexToRGBA(
                            getCssVar(settings.colors.daySuccess),
                            Math.min((avgDayScore / 100) * 0.4 + 0.1, 0.5)
                          ),
                        }}
                      >
                        {avgDayScore}%
                      </td>
                      {data[0]?.categories
                        .filter((category) => category.type !== CategoryType.EXPENSE)
                        .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name))
                        .flatMap((category) =>
                          category.tasks.map((task) => {
                            let totalValue = "";
                            let bgColor = "transparent";

                            const taskStats = data.reduce((acc, day) => {
                              const cat = day.categories.find(c => c.name === category.name);
                              const t = cat?.tasks.find(t => t.name === task.name);

                              if (task.type === TaskType.CHECKBOX) {
                                acc.completed = (acc.completed || 0) + (t?.completed ? 1 : 0);
                                acc.total = (acc.total || 0) + 1;
                              } else if (task.type === TaskType.TIME) {
                                acc.totalTime = (acc.totalTime || 0) + (t?.value || 0);
                              } else if (task.type === TaskType.CALORIE) {
                                acc.totalCalories = (acc.totalCalories || 0) + (t?.value || 0);
                              }

                              return acc;
                            }, {} as any);

                            if (task.type === TaskType.CHECKBOX) {
                              const percentage = Math.round((taskStats.completed / taskStats.total) * 100);
                              totalValue = `${percentage}%`;
                              bgColor = hexToRGBA(
                                getCssVar(settings.colors.daySuccess),
                                Math.min((percentage / 100) * 0.4 + 0.1, 0.5)
                              );
                            } else if (task.type === TaskType.TIME) {
                              const hours = Math.floor(taskStats.totalTime / 60);
                              totalValue = `${hours}ч`;
                            } else if (task.type === TaskType.CALORIE) {
                              totalValue = `${taskStats.totalCalories}ккал`;
                            }

                            return (
                              <td
                                key={`total-${category.name}-${task.name}`}
                                className="px-4 py-2 text-center whitespace-nowrap"
                                style={{ backgroundColor: bgColor }}
                              >
                                {totalValue}
                              </td>
                            );
                          })
                        )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Графики распределения */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Время }} />
              Распределение времени: {formatTimeTotal(timeDistribution.totalMinutes)}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeDistribution.distribution.map((entry) => ({
                    ...entry,
                    minutes: Math.round(entry.minutes / 60),
                  }))}
                  dataKey="minutes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) =>
                    `${entry.name}: ${Math.round(entry.minutes)}ч`
                  }
                >
                  {timeDistribution.distribution.map((entry, index) => {
                    const opacity = Math.min((entry.minutes / timeDistribution.totalMinutes) * 0.8 + 0.2, 1);
                    return (
                      <Cell
                        key={entry.name}
                        fill={hexToRGBA(getCssVar(settings.colors.time), opacity)}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                  formatter={(value) => `${Math.round(Number(value))}ч`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: CATEGORY_COLORS.Траты }} />
              Распределение расходов: {expenseDistribution.totalExpenses}zł
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistribution.distribution}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.amount}zł`}
                >
                  {expenseDistribution.distribution.map((entry, index) => {
                    const opacity = Math.min((entry.amount / expenseDistribution.totalExpenses) * 0.8 + 0.2, 1);
                    return (
                      <Cell
                        key={entry.name}
                        fill={hexToRGBA(getCssVar(settings.colors.expenses), opacity)}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                  formatter={(value) => `${value}zł`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Statistics;