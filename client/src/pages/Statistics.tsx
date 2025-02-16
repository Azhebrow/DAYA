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
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameWeek, isSameMonth } from "date-fns";
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
    const endDate = startOfDay(new Date());
    const daysToSubtract = parseInt(timeRange);
    const startDate = subDays(endDate, daysToSubtract - 1);

    setDateRangeText(
      `${format(startDate, "dd.MM.yyyy")} - ${format(endDate, "dd.MM.yyyy")}`,
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
  }, [timeRange]);

  const aggregateDataByPeriod = () => {
    if (!data.length) return [];

    if (displayType === "days") {
      return data.map((day) => ({
        date: format(new Date(day.date), "dd.MM"),
        totalTime: calculateTotalTime(day),
        calories: calculateTotalCalories(day),
        expenses: calculateTotalExpenses(day),
        score: calculateDayScore(day)
      }));
    }

    const aggregatedData: { [key: string]: any } = {};

    data.forEach((day) => {
      const date = new Date(day.date);
      let periodKey: string;

      if (displayType === "weeks") {
        const weekStart = format(startOfWeek(date, { locale: ru }), "dd.MM");
        const weekEnd = format(endOfWeek(date, { locale: ru }), "dd.MM");
        periodKey = `${weekStart}-${weekEnd}`;
      } else {
        periodKey = format(date, "MMMM yyyy", { locale: ru });
      }

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

  const aggregatedData = aggregateDataByPeriod();
  const timeDistribution = calculateTimeDistribution();
  const expenseDistribution = calculateExpenseDistribution();

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
                      <th scope="col" className="px-4 py-2 text-left text-sm font-semibold min-w-[90px]">Дата</th>
                      <th scope="col" className="px-4 py-2 text-center text-sm font-semibold font-bold min-w-[90px]">Итого</th>
                      {data[0]?.categories
                        .filter((category) => category.type === CategoryType.EXPENSE)
                        .map((category) => (
                          <th
                            key={category.name}
                            className="py-2 px-4 text-center text-sm font-semibold min-w-[90px]"
                            style={{ backgroundColor: hexToRGBA(getCssVar(settings.colors.expenses), 0.2) }}
                          >
                            {category.emoji} {category.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {data.map((day) => {
                      const expenseCategories = day.categories.filter(
                        (category) => category.type === CategoryType.EXPENSE
                      );

                      const dayTotal = expenseCategories.reduce(
                        (sum, category) =>
                          sum +
                          category.tasks.reduce(
                            (catSum, task) =>
                              catSum +
                              (task.type === TaskType.EXPENSE ? task.value || 0 : 0),
                            0
                          ),
                        0
                      );

                      const maxExpense = Math.max(
                        ...data.map((d) =>
                          d.categories
                            .filter((c) => c.type === CategoryType.EXPENSE)
                            .reduce(
                              (sum, c) =>
                                sum +
                                c.tasks.reduce(
                                  (tSum, t) =>
                                    tSum +
                                    (t.type === TaskType.EXPENSE ? t.value || 0 : 0),
                                  0
                                ),
                              0
                            )
                        )
                      );

                      return (
                        <tr key={day.date} className="border-b border-border/10">
                          <td className="px-4 py-2 text-sm font-medium whitespace-nowrap">
                            {format(new Date(day.date), "dd.MM.yyyy")}
                          </td>
                          <td
                            className="px-4 py-2 text-center text-sm font-medium"
                            style={{
                              backgroundColor: hexToRGBA(
                                getCssVar(settings.colors.expenses),
                                Math.min((dayTotal / maxExpense) * 0.4 + 0.1, 0.5)
                              ),
                            }}
                          >
                            {dayTotal} zł
                          </td>
                          {expenseCategories.map((category) => {
                            const categoryTotal = category.tasks.reduce(
                              (sum, task) =>
                                sum +
                                (task.type === TaskType.EXPENSE ? task.value || 0 : 0),
                              0
                            );

                            return (
                              <td
                                key={category.name}
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
                      );
                    })}
                    <tr className="border-t-2 border-border font-bold">
                      <td className="px-4 py-2 text-sm font-semibold">Итого</td>
                      {(() => {
                        const grandTotal = data.reduce(
                          (total, day) =>
                            total +
                            day.categories
                              .filter((c) => c.type === CategoryType.EXPENSE)
                              .reduce(
                                (catSum, category) =>
                                  catSum +
                                  category.tasks.reduce(
                                    (taskSum, task) =>
                                      taskSum +
                                      (task.type === TaskType.EXPENSE ? task.value || 0 : 0),
                                    0
                                  ),
                                0
                              ),
                          0
                        );

                        const maxExpense = Math.max(
                          ...data.map((d) =>
                            d.categories
                              .filter((c) => c.type === CategoryType.EXPENSE)
                              .reduce(
                                (sum, c) =>
                                  sum +
                                  c.tasks.reduce(
                                    (tSum, t) =>
                                      tSum + (t.type === TaskType.EXPENSE ? t.value || 0 : 0),
                                    0
                                  ),
                                0
                              )
                          )
                        );

                        return (
                          <td
                            className="px-4 py-2 text-center text-sm font-semibold min-w-[90px]"
                            style={{
                              backgroundColor: hexToRGBA(
                                getCssVar(settings.colors.expenses),
                                Math.min((grandTotal / maxExpense) * 0.4 + 0.1, 0.5)
                              ),
                            }}
                          >
                            {grandTotal} zł
                          </td>
                        );
                      })()}
                      {data[0]?.categories
                        .filter((category) => category.type === CategoryType.EXPENSE)
                        .map((category) => {
                          const categoryTotal = data.reduce((sum, day) => {
                            const cat = day.categories.find((c) => c.name === category.name);
                            return (
                              sum +
                              (cat?.tasks.reduce(
                                (taskSum, task) =>
                                  taskSum + (task.type === TaskType.EXPENSE ? task.value || 0 : 0),
                                0
                              ) || 0)
                            );
                          }, 0);

                          const maxExpenseInCategory = Math.max(
                            ...data.map((d) => {
                              const cat = d.categories.find((c) => c.name === category.name);
                              return (
                                cat?.tasks.reduce(
                                  (taskSum, task) =>
                                    taskSum + (task.type === TaskType.EXPENSE ? task.value || 0 : 0),
                                  0
                                ) || 0
                              );
                            })
                          );

                          return (
                            <td
                              key={`total-${category.name}`}
                              className="py-2 px-4 text-center text-sm font-semibold min-w-[90px]"
                              style={{
                                backgroundColor: hexToRGBA(
                                  getCssVar(settings.colors.expenses),
                                  Math.min((categoryTotal / maxExpenseInCategory) * 0.4 + 0.1, 0.5)
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
            Успешность задач по дням
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden">
            <div className="w-full inline-block align-middle">
              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-border relative">
                  <thead className="bg-background z-10">
                    <tr className="border-b border-border/20">
                      <th className="bg-background py-2 px-4 text-left text-sm font-semibold w-[100px]">Дата</th>
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
                              backgroundColor: CATEGORY_HEADER_COLORS[category.name]?.bg || 'transparent',
                              color: CATEGORY_HEADER_COLORS[category.name]?.text || '#ffffff'
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
                    {data.map((day) => (
                      <tr key={day.date} className="border-b border-border/10">
                        <td className="bg-background px-4 py-2 font-medium">
                          {format(new Date(day.date), "dd.MM")}
                        </td>
                        <td
                          className="bg-background px-4 py-2 text-center text-sm font-medium"
                          style={{
                            backgroundColor: hexToRGBA(getCssVar(settings.colors.daySuccess), Math.min((calculateDayScore(day) / 100) * 0.5 + 0.1, 0.6))
                          }}
                        >
                          {calculateDayScore(day)}%
                        </td>
                        {day.categories
                          .filter(
                            (category) => category.type !== CategoryType.EXPENSE,
                          )
                          .sort(
                            (a, b) =>
                              CATEGORY_ORDER.indexOf(a.name) -
                              CATEGORY_ORDER.indexOf(b.name),
                          )
                          .flatMap((category) =>
                            category.tasks.map((task) => {
                              let displayValue = "";
                              let bgColor = "transparent";

                              if (task.type === TaskType.CHECKBOX) {
                                displayValue = task.completed ? "✓" : "✗";
                                bgColor = task.completed
                                  ? hexToRGBA(getCssVar(CATEGORY_COLORS[category.name]), 0.3)
                                  : "transparent";
                              } else if (task.type === TaskType.TIME) {
                                if (typeof task.value === "number" && task.value > 0) {
                                  const hours = Math.floor(task.value / 60);
                                  displayValue = `${hours}`;
                                  bgColor = hexToRGBA(
                                    getCssVar(CATEGORY_COLORS[category.name]),
                                    0.3
                                  );
                                } else {
                                  displayValue = "✗";
                                }
                              } else if (task.type === TaskType.CALORIE) {
                                if (typeof task.value === "number" && task.value > 0) {
                                  displayValue = task.value.toString();
                                  bgColor = hexToRGBA(
                                    getCssVar(CATEGORY_COLORS[category.name]),
                                    0.3
                                  );
                                } else {
                                  displayValue = "✗";
                                }
                              }

                              return (
                                <td
                                  key={`${category.name}-${task.name}`}
                                  className="px-4 py-2 text-center whitespace-nowrap"
                                  style={{ backgroundColor: bgColor }}
                                >
                                  {displayValue}
                                  {task.type === TaskType.TIME && 'ч'}
                                  {task.type === TaskType.CALORIE && 'ккал'}
                                </td>
                              );
                            })
                          )}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border font-bold">
                      <td className="bg-background px-4 py-2 text-sm font-semibold">Итого</td>
                      <td
                        className="bg-background px-4 py-2 text-center text-sm font-semibold"
                        style={{
                          backgroundColor: hexToRGBA(
                            getCssVar(settings.colors.daySuccess),
                            Math.min((data.reduce((sum, day) => sum + calculateDayScore(day), 0) / (data.length * 100)) * 0.4 + 0.1, 0.5)
                          )
                        }}
                      >
                        {Math.round(data.reduce((sum, day) => sum + calculateDayScore(day), 0) / data.length)}%
                      </td>
                      {data[0]?.categories
                        .filter((category) => category.type !== CategoryType.EXPENSE)
                        .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name))
                        .flatMap((category) =>
                          category.tasks.map((task) => {
                            let totalValue = "";
                            let bgColor = "transparent";

                            if (task.type === TaskType.CHECKBOX) {
                              const completedCount = data.reduce(
                                (count, day) => {
                                  const cat = day.categories.find(
                                    (c) => c.name === category.name
                                  );
                                  const t = cat?.tasks.find(
                                    (t) => t.name === task.name
                                  );
                                  return count + (t?.completed ? 1 : 0);
                                },
                                0
                              );
                              const totalPercentage = Math.round((completedCount / data.length) * 100);
                              totalValue = `${totalPercentage}%`;
                              bgColor = hexToRGBA(
                                getCssVar(CATEGORY_COLORS[category.name]),
                                Math.min((totalPercentage / 100) * 0.4 + 0.1, 0.5)
                              );
                            } else if (task.type === TaskType.TIME) {
                              const totalMinutes = data.reduce(
                                (sum, day) => {
                                  const cat = day.categories.find(
                                    (c) => c.name === category.name
                                  );
                                  const t = cat?.tasks.find(
                                    (t) => t.name === task.name
                                  );
                                  return sum + (t?.value || 0);
                                },
                                0
                              );
                              const hours = Math.floor(totalMinutes / 60);
                              totalValue = `${hours}ч`;
                              bgColor = hexToRGBA(
                                getCssVar(CATEGORY_COLORS[category.name]),
                                Math.min((hours / 24) * 0.4 + 0.1, 0.5)
                              );
                            } else if (task.type === TaskType.CALORIE) {
                              const totalCalories = data.reduce(
                                (sum, day) => {
                                  const cat = day.categories.find(
                                    (c) => c.name === category.name
                                  );
                                  const t = cat?.tasks.find(
                                    (t) => t.name === task.name
                                  );
                                  return sum + (t?.value || 0);
                                },
                                0
                              );
                              totalValue = `${totalCalories}ккал`;
                              bgColor = hexToRGBA(
                                getCssVar(CATEGORY_COLORS[category.name]),
                                Math.min((totalCalories / 1000) * 0.4 + 0.1, 0.5)
                              );
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