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
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
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

export default function Statistics() {
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

  const [timeRange, setTimeRange] = useState<"7" | "14" | "30">(() => {
    try {
      const stored = localStorage.getItem("day_success_tracker_settings");
      if (!stored) return "7";
      const settings = settingsSchema.parse(JSON.parse(stored));
      return settings.timeRange;
    } catch (error) {
      console.error("Error parsing settings:", error);
      return "7";
    }
  });
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

    return data.map((day) => {
      let totalTime = 0;
      let calories = 0;
      let dailyExpenses = 0;

      day.categories.forEach((category) => {
        category.tasks.forEach((task) => {
          if (task.type === TaskType.TIME && typeof task.value === "number") {
            totalTime += Math.round(task.value / 60);
          }
          if (
            task.type === TaskType.CALORIE &&
            typeof task.value === "number"
          ) {
            calories += task.value;
          }
          if (
            task.type === TaskType.EXPENSE &&
            typeof task.value === "number"
          ) {
            dailyExpenses += task.value;
          }
        });
      });

      return {
        date: format(new Date(day.date), "dd.MM"),
        totalTime,
        calories,
        expenses: dailyExpenses,
      };
    });
  };

  const calculateTimeDistribution = () => {
    const timeByActivity: { [key: string]: number } = {};
    let totalMinutes = 0;

    data.forEach((day) => {
      day.categories.forEach((category) => {
        if (category.type === CategoryType.TIME) {
          category.tasks.forEach((task) => {
            if (typeof task.value === "number" && task.value > 0) {
              if (!timeByActivity[task.name]) {
                timeByActivity[task.name] = 0;
              }
              timeByActivity[task.name] += task.value;
              totalMinutes += task.value;
            }
          });
        }
      });
    });

    const distribution = Object.entries(timeByActivity)
      .map(([name, total]) => ({
        name,
        minutes: total,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return { distribution, totalMinutes };
  };

  const calculateExpenseDistribution = () => {
    const expensesByCategory: {
      [key: string]: { amount: number; emoji: string };
    } = {};
    let totalExpenses = 0;

    data.forEach((day) => {
      day.categories.forEach((category) => {
        category.tasks.forEach((task) => {
          if (
            task.type === TaskType.EXPENSE &&
            typeof task.value === "number" &&
            task.value > 0
          ) {
            if (!expensesByCategory[category.name]) {
              expensesByCategory[category.name] = {
                amount: 0,
                emoji: category.emoji,
              };
            }
            expensesByCategory[category.name].amount += task.value;
            totalExpenses += task.value;
          }
        });
      });
    });

    const distribution = Object.entries(expensesByCategory)
      .map(([name, { amount, emoji }]) => ({
        name: `${emoji} ${name}`,
        amount,
        color: CATEGORY_COLORS.Траты,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { distribution, totalExpenses };
  };

  const dailyStats = aggregateDataByPeriod();
  const timeDistribution = calculateTimeDistribution();
  const expenseDistribution = calculateExpenseDistribution();

  const formatTimeTotal = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const calculateDayScoreFromHistory = (day: DayEntry) => {
    if (!day.categories) return 0;

    let score = 0;
    let total = 0;

    day.categories.slice(0, 4).forEach((category) => {
      if (!category.tasks) return;

      category.tasks.forEach((task) => {
        if (task.type === TaskType.CHECKBOX) {
          total += 1;
          if (task.completed) score += 1;
        } else if (
          task.type === TaskType.TIME ||
          task.type === TaskType.CALORIE
        ) {
          total += 1;
          if (typeof task.value === "number" && task.value > 0) score += 1;
        }
      });
    });

    return total > 0 ? Math.round((score / total) * 100) : 0;
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

  // Add a mapping for category icons
  const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
    'Разум': <Brain className="h-4 w-4 inline-block mr-2" />,
    'Время': <Clock className="h-4 w-4 inline-block mr-2" />,
    'Спорт': <Dumbbell className="h-4 w-4 inline-block mr-2" />,
    'Привычки': <Ban className="h-4 w-4 inline-block mr-2" />,
    'Траты': <DollarSign className="h-4 w-4 inline-block mr-2" />,
  };


  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Статистика</h1>
          <p className="text-sm text-muted-foreground">{dateRangeText}</p>
        </div>
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
              <AreaChart
                data={data.map((day) => ({
                  date: format(new Date(day.date), "dd.MM"),
                  score: calculateDayScoreFromHistory(day),
                }))}
              >
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
              <AreaChart
                data={data.map((day) => ({
                  date: format(new Date(day.date), "dd.MM"),
                  totalTime: day.categories
                    .filter(category => category.type === CategoryType.TIME)
                    .reduce((sum, category) =>
                      sum + category.tasks.reduce((taskSum, task) =>
                        taskSum + (task.type === TaskType.TIME ? task.value || 0 : 0), 0
                      ), 0
                    )
                }))}
              >
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
              <AreaChart data={dailyStats}>
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
              <AreaChart data={dailyStats}>
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
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
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
                  <tbody>
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
                          <td className="py-2 px-4 font-medium text-sm font-semibold min-w-[90px]">
                            {format(new Date(day.date), "dd.MM.yyyy")}
                          </td>
                          <td
                            className="py-2 px-4 text-center text-sm font-semibold font-bold min-w-[90px]"
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
                      <td className="py-2 px-4 text-sm font-semibold">Итого</td>
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
                            className="py-2 px-4 text-center text-sm font-semibold min-w-[90px]"
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
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b border-border/20">
                      <th className="sticky left-0 bg-background py-2 px-4 text-left text-sm font-semibold w-[100px]">Дата</th>
                      <th className="sticky left-[100px] bg-background py-2 px-4 text-center text-sm font-semibold w-[80px]">Успех</th>
                      {data[0]?.categories
                        .filter((category) => category.type !== CategoryType.EXPENSE)
                        .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name))
                        .map((category) => (
                          <th
                            key={category.name}
                            colSpan={category.tasks.length}
                            className="py-2 px4 text-center text-sm font-semibold"
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
                      <th className="sticky left-0 bg-background"></th>
                      <th className="sticky left-[100px] bg-background"></th>
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
                  <tbody>
                    {data.map((day) => (
                      <tr key={day.date} className="border-b border-border/10">
                        <td className="sticky left-0 bg-background py-2 px-4 font-medium">
                          {format(new Date(day.date), "dd.MM")}
                        </td>
                        <td
                          className="sticky left-[100px] bg-background py-2 px-4 text-center text-sm font-medium"
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
                                  ? hexToRGBA(getCssVar(settings.colors[category.name.toLowerCase() as keyof typeof settings.colors]), 0.5)
                                  : "transparent";
                              } else if (task.type === TaskType.TIME) {
                                displayValue = formatTimeTotal(task.value || 0);
                              } else if (task.type === TaskType.CALORIE) {
                                displayValue = `${task.value || 0}`;
                              }

                              return (
                                <td
                                  key={`${category.name}-${task.name}`}
                                  className="py-2 px-4 text-center text-sm font-semibold"
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
                      <td className="sticky left-0 bg-background py-2 px-4 text-sm font-semibold">Итого</td>
                      <td
                        className="sticky left-[100px] bg-background py-2 px-4 text-center text-sm font-semibold"
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
                              const completedCount = data.reduce((sum, day) => {
                                const cat = day.categories.find((c) => c.name === category.name);
                                const t = cat?.tasks.find((t) => t.name === task.name);
                                return t?.completed ? sum + 1 : sum;
                              }, 0);
                              const totalPercentage = Math.round((completedCount / data.length) * 100);
                              totalValue = `${totalPercentage}%`;
                              // Применяем условное форматирование только для процентных значений
                              bgColor = hexToRGBA(
                                getCssVar(settings.colors.daySuccess),
                                Math.min((totalPercentage / 100) * 0.4 + 0.1, 0.5)
                              );
                            } else if (task.type === TaskType.TIME) {
                              const totalMinutes = data.reduce((sum, day) => {
                                const cat = day.categories.find((c) => c.name === category.name);
                                const t = cat?.tasks.find((t) => t.name === task.name);
                                return sum + (t?.value || 0);
                              }, 0);
                              totalValue = formatTimeTotal(totalMinutes);
                            } else if (task.type === TaskType.CALORIE) {
                              const totalCalories = data.reduce((sum, day) => {
                                const cat = day.categories.find((c) => c.name === category.name);
                                const t = cat?.tasks.find((t) => t.name === task.name);
                                return sum + (t?.value || 0);
                              }, 0);
                              totalValue = `${totalCalories}`;
                            }

                            return (
                              <td
                                key={`total-${category.name}-${task.name}`}
                                className="py-2 px-4 text-center text-sm font-semibold"
                                style={{ backgroundColor: bgColor }}
                              >
                                {totalValue}
                                {task.type === TaskType.TIME && 'ч'}
                                {task.type === TaskType.CALORIE && 'ккал'}
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
                    // Calculate opacity based on the proportion of total time
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
                    // Calculate opacity based on the proportion of total expenses
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