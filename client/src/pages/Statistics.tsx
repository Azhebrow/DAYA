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
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
const CATEGORY_COLORS: { [key: string]: string } = {
  Разум: "#8B5CF6", // Фиолетовый
  Время: "#10B981", // Зеленый
  Спорт: "#EF4444", // Красный
  Привычки: "#F59E0B", // Оранжевый
};

const CATEGORY_ORDER = ["Разум", "Привычки", "Спорт", "Время"];

const CATEGORY_HEADER_COLORS: {
  [key: string]: { bg: string; text: string };
} = {
  Разум: { bg: "#8B5CF620", text: "#ffffff" },
  Время: { bg: "#10B98120", text: "#ffffff" },
  Спорт: { bg: "#EF444420", text: "#ffffff" },
  Привычки: { bg: "#F59E0B20", text: "#ffffff" },
};

type TimeRangeType = "7" | "14" | "30";

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<TimeRangeType>(() => {
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
  const [settings, setSettings] = useState<SettingsType>(() => {
    try {
      const stored = localStorage.getItem("day_success_tracker_settings");
      if (!stored) return settingsSchema.parse({});
      return settingsSchema.parse(JSON.parse(stored));
    } catch (error) {
      console.error("Error parsing settings:", error);
      return settingsSchema.parse({});
    }
  });

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
            totalTime += Math.round(task.value / 60); // Convert minutes to hours
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
        color: "#6B7280", // Нейтральный цвет для всех категорий
      }))
      .sort((a, b) => b.amount - a.amount);

    return { distribution, totalExpenses };
  };

  const dailyStats = aggregateDataByPeriod();
  const timeDistribution = calculateTimeDistribution();
  const expenseDistribution = calculateExpenseDistribution();

  // Format time total function
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

  const handleTimeRangeChange = (value: TimeRangeType) => {
    setTimeRange(value);
    const updatedSettings = { ...settings, timeRange: value };
    setSettings(updatedSettings);
    localStorage.setItem(
      "day_success_tracker_settings",
      JSON.stringify(updatedSettings),
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Статистика</h1>
          <p className="text-sm text-muted-foreground">{dateRangeText}</p>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="14">14 дней</SelectItem>
            <SelectItem value="30">30 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-category-mind" />
              Показатель успеха
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  stroke="#6B7280"
                  fill="#6B7280"
                  name="Успех"
                  dot={{ r: 4 }}
                  label={{ position: "top", fill: "#6B7280" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-category-sport" />
              Калории
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  stroke="#EF4444"
                  fill="#EF4444"
                  name="Калории"
                  dot={{ r: 4 }}
                  label={{ position: "top", fill: "#EF4444" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-category-time" />
              Время
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  dataKey="totalTime"
                  stroke={CATEGORY_COLORS["Время"]}
                  fill={CATEGORY_COLORS["Время"]}
                  name="Часы"
                  dot={{ r: 4 }}
                  label={{ position: "top", fill: CATEGORY_COLORS["Время"] }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Распределение времени:{" "}
              {formatTimeTotal(timeDistribution.totalMinutes)}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  {timeDistribution.distribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Распределение расходов: {expenseDistribution.totalExpenses}zł
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  {expenseDistribution.distribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ежедневный отчет
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Дата</th>
                  <th className="py-2 px-4">Отчет</th>
                  <th className="py-2 px-4 text-right">Разное (zł)</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .map((day) => {
                    const reportCategory = day.categories.find(
                      (c) => c.name === "Отчет",
                    );
                    const reportTask = reportCategory?.tasks.find(
                      (t) => t.type === TaskType.EXPENSE_NOTE,
                    );
                    const miscExpenses = day.categories
                      .filter((c) => c.type === CategoryType.EXPENSE)
                      .reduce((sum, category) => {
                        return (
                          sum +
                          category.tasks
                            .filter((t) => t.type === TaskType.EXPENSE)
                            .reduce(
                              (taskSum, task) => taskSum + (task.value || 0),
                              0,
                            )
                        );
                      }, 0);

                    if (!reportTask?.textValue) return null;

                    return (
                      <tr key={day.date} className="border-b border-border/10">
                        <td className="py-2 px-4 font-medium">
                          {format(new Date(day.date), "dd.MM.yyyy")}
                        </td>
                        <td className="py-2 px-4 whitespace-pre-wrap">
                          {reportTask.textValue}
                        </td>
                        <td className="py-2 px-4 text-right fontmedium">
                          {miscExpenses} zł
                        </td>
                      </tr>
                    );
                  })
                  .filter(Boolean)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Task Success Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-primary" />
            Успешность задач по дням
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left w-[120px]">Дата</th>
                  <th className="py-2 px-4 text-center w-[100px]">Успех</th>
                  {data[0]?.categories
                    .filter(
                      (category) => category.type !== CategoryType.EXPENSE,
                    )
                    .sort(
                      (a, b) =>
                        CATEGORY_ORDER.indexOf(a.name) -
                        CATEGORY_ORDER.indexOf(b.name),
                    )
                    .map((category) => (
                      <th
                        key={category.name}
                        colSpan={category.tasks.length}
                        className="py-2 px-4 text-center"
                        style={{
                          backgroundColor:
                            CATEGORY_HEADER_COLORS[category.name]?.bg ||
                            "#6B728020",
                          color:
                            CATEGORY_HEADER_COLORS[category.name]?.text ||
                            "#ffffff",
                        }}
                      >
                        {category.name}
                      </th>
                    ))}
                </tr>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4"></th>
                  <th className="py-2 px-4"></th>
                  {data[0]?.categories
                    .filter(
                      (category) => category.type !== CategoryType.EXPENSE,
                    )
                    .sort(
                      (a, b) =>
                        CATEGORY_ORDER.indexOf(a.name) -
                        CATEGORY_ORDER.indexOf(b.name),
                    )
                    .flatMap((category) =>
                      category.tasks.map((task) => (
                        <th
                          key={`${category.name}-${task.name}`}
                          className="py-2 px-4 text-center text-sm font-medium min-w-[80px]"
                          style={{
                            backgroundColor:
                              CATEGORY_HEADER_COLORS[category.name]?.bg ||
                              "#6B728020",
                            color:
                              CATEGORY_HEADER_COLORS[category.name]?.text ||
                              "#ffffff",
                            opacity: 0.8,
                          }}
                        >
                          {task.name}
                        </th>
                      )),
                    )}
                </tr>
              </thead>
              <tbody>
                {data.map((day) => {
                  const dayScore = calculateDayScore(day);
                  const maxScore = 100;

                  return (
                    <tr key={day.date} className="border-b border-border/10">
                      <td className="py-2 px-4 font-medium w-[120px]">
                        {format(new Date(day.date), "dd.MM")}
                      </td>
                      <td
                        className="py-2 px-4 text-center w-[100px]"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${0.1 + (dayScore / maxScore) * 0.4})`,
                        }}
                      >
                        {dayScore}%
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
                              const value = task.completed ? 100 : 0;
                              bgColor = `rgba(16, 185, 129, ${0.1 + (value / 100) * 0.4})`;
                              displayValue = task.completed ? "100%" : "0%";
                            } else if (task.type === TaskType.TIME) {
                              displayValue = formatTimeTotal(task.value || 0);
                              bgColor = "#6B728020";
                            } else if (task.type === TaskType.CALORIE) {
                              displayValue = `${task.value || 0}`;
                              bgColor = "#6B728020";
                            }

                            return (
                              <td
                                key={`${category.name}-${task.name}`}
                                className="py-2 px-4 text-center min-w-[80px]"
                                style={{ backgroundColor: bgColor }}
                              >
                                {displayValue}
                              </td>
                            );
                          }),
                        )}
                    </tr>
                  );
                })}
                {/* Add totals row */}
                <tr className="border-t-2 border-border font-bold">
                  <td className="py-2 px-4">Итого</td>
                  <td className="py-2 px-4 text-center w-[100px]">
                    {Math.round(
                      data.reduce(
                        (sum, day) => sum + calculateDayScore(day),
                        0,
                      ) / data.length,
                    )}
                    %
                  </td>
                  {data[0]?.categories
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
                        let totalValue = "";
                        let bgColor = "transparent";

                        if (task.type === TaskType.CHECKBOX) {
                          const completedCount = data.reduce((sum, day) => {
                            const cat = day.categories.find(
                              (c) => c.name === category.name,
                            );
                            const t = cat?.tasks.find(
                              (t) => t.name === task.name,
                            );
                            return sum + (t?.completed ? 1 : 0);
                          }, 0);
                          const percentage = Math.round(
                            (completedCount / data.length) * 100,
                          );
                          bgColor = `rgba(16, 185, 129, ${0.1 + (percentage / 100) * 0.4})`;
                          totalValue = `${percentage}%`;
                        } else if (task.type === TaskType.TIME) {
                          const totalMinutes = data.reduce((sum, day) => {
                            const cat = day.categories.find(
                              (c) => c.name === category.name,
                            );
                            const t = cat?.tasks.find(
                              (t) => t.name === task.name,
                            );
                            return sum + (t?.value || 0);
                          }, 0);
                          totalValue = formatTimeTotal(totalMinutes);
                          bgColor = "#6B728020";
                        } else if (task.type === TaskType.CALORIE) {
                          const totalCalories = data.reduce((sum, day) => {
                            const cat = day.categories.find(
                              (c) => c.name === category.name,
                            );
                            const t = cat?.tasks.find(
                              (t) => t.name === task.name,
                            );
                            return sum + (t?.value || 0);
                          }, 0);
                          totalValue = `${totalCalories}`;
                          bgColor = "#6B728020";
                        }

                        return (
                          <td
                            key={`total-${category.name}-${task.name}`}
                            className="py-2 px-4 text-center min-w-[80px]"
                            style={{ backgroundColor: bgColor }}
                          >
                            {totalValue}
                          </td>
                        );
                      }),
                    )}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Расходы по категориям
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left min-w-[90px]">Дата</th>
                  <th className="py-2 px-4 text-center font-bold min-w-[90px]">Итого</th>
                  {data[0]?.categories
                    .filter(
                      (category) => category.type === CategoryType.EXPENSE,
                    )
                    .map((category) => (
                      <th
                        key={category.name}
                        className="py-2 px-4 text-center min-w-[90px]"
                        style={{ backgroundColor: "#6B728020" }}
                      >
                        {category.emoji} {category.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data.map((day) => {
                  const expenseCategories = day.categories.filter(
                    (category) => category.type === CategoryType.EXPENSE,
                  );

                  const dayTotal = expenseCategories.reduce(
                    (sum, category) =>
                      sum +
                      category.tasks.reduce(
                        (catSum, task) =>
                          catSum +
                          (task.type === TaskType.EXPENSE
                            ? task.value || 0
                            : 0),
                        0,
                      ),
                    0,
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
                                (t.type === TaskType.EXPENSE
                                  ? t.value || 0
                                  : 0),
                              0,
                            ),
                          0,
                        ),
                    ),
                  );

                  return (
                    <tr key={day.date} className="border-b border-border/10">
                      <td className="py-2 px-4 font-medium min-w-[90px]">
                        {format(new Date(day.date), "dd.MM.yyyy")}
                      </td>
                      <td
                        className="py-2 px-4 text-center font-bold min-w-[90px]"
                        style={{
                          backgroundColor: `rgba(249, 115, 22, ${0.1 + (dayTotal / maxExpense) * 0.4})`,
                        }}
                      >
                        {dayTotal} zł
                      </td>
                      {expenseCategories.map((category) => {
                        const categoryTotal = category.tasks.reduce(
                          (sum, task) =>
                            sum +
                            (task.type === TaskType.EXPENSE
                              ? task.value || 0
                              : 0),
                          0,
                        );

                        return (
                          <td
                            key={category.name}
                            className="py-2 px-4 text-center min-w-[90px]"
                            style={{
                              backgroundColor: `rgba(249, 115, 22, ${0.1 + (categoryTotal / maxExpense) * 0.4})`,
                            }}
                          >
                            {categoryTotal} zł
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Add totals row */}
                <tr className="border-t-2 border-border font-bold">
                  <td className="py-2 px-4 min-w-[90px]">Итого</td>
                  <td className="py-2 px-4 text-center min-w-[90px]">
                    {data.reduce(
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
                                  (task.type === TaskType.EXPENSE
                                    ? task.value || 0
                                    : 0),
                                0,
                              ),
                            0,
                          ),
                      0,
                    )}{" "}
                    zł
                  </td>
                  {data[0]?.categories
                    .filter(
                      (category) => category.type === CategoryType.EXPENSE,
                    )
                    .map((category) => {
                      const categoryTotal = data.reduce((total, day) => {
                        const cat = day.categories.find(
                          (c) => c.name === category.name,
                        );
                        return (
                          total +
                          (cat?.tasks.reduce(
                            (sum, task) =>
                              sum +
                              (task.type === TaskType.EXPENSE
                                ? task.value || 0
                                : 0),
                            0,
                          ) || 0)
                        );
                      }, 0);

                      const maxTotal = Math.max(
                        ...data[0].categories
                          .filter((c) => c.type === CategoryType.EXPENSE)
                          .map((c) =>
                            data.reduce((total, day) => {
                              const cat = day.categories.find(
                                (cat) => cat.name === c.name,
                              );
                              return (
                                total +
                                (cat?.tasks.reduce(
                                  (sum, task) =>
                                    sum +
                                    (task.type === TaskType.EXPENSE
                                      ? task.value || 0
                                      : 0),
                                  0,
                                ) || 0)
                              );
                            }, 0),
                          ),
                      );

                      return (
                        <td
                          key={`total-${category.name}`}
                          className="py-2 px-4 text-center min-w-[90px]"
                          style={{
                            backgroundColor: `rgba(249, 115, 22, ${0.1 + (categoryTotal / maxTotal) * 0.4})`,
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
        </CardContent>
      </Card>
    </div>
  );
}