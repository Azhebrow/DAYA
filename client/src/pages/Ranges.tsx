import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { DayEntry, CategoryType, TaskType } from '@shared/schema';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { calculateDayScore } from '@/lib/utils';
import { ActivitySquare, Flame, Clock, LineChart, DollarSign, BarChart as BarChartIcon } from 'lucide-react';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Разум': '#6B7280',    // Серый
  'Время': '#10B981',    // Зеленый
  'Спорт': '#EF4444',    // Красный для трекера
  'Привычки': '#8B5CF6',  // Фиолетовый
  'Расходы': '#F97316'    // Оранжевый
};

export default function Ranges() {
  const [data, setData] = useState<DayEntry[]>([]);
  const [dateRangeText, setDateRangeText] = useState('');

  useEffect(() => {
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(endDate, 11));

    setDateRangeText(`${format(startDate, 'MMMM yyyy')} - ${format(endDate, 'MMMM yyyy')}`);

    const days: DayEntry[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const entry = storage.getDayEntry(format(currentDate, 'yyyy-MM-dd'));
      if (entry) {
        days.push(entry);
      }
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    setData(days);
  }, []);

  const aggregateDataByMonth = () => {
    if (!data.length) return [];

    const months: { [key: string]: DayEntry[] } = {};

    data.forEach(day => {
      const monthKey = format(new Date(day.date), 'MMMM yyyy');
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(day);
    });

    return Object.entries(months).map(([month, days]) => {
      let totalTime = 0;
      let totalCalories = 0;
      let totalExpenses = 0;
      let daysWithData = 0;
      let daysWithCalories = 0;
      let totalScore = 0;

      days.forEach(day => {
        totalScore += calculateDayScore(day);
        daysWithData++;

        day.categories.forEach(category => {
          category.tasks.forEach(task => {
            if (task.type === TaskType.TIME && typeof task.value === 'number') {
              totalTime += task.value;
            }
            if (task.type === TaskType.CALORIE && typeof task.value === 'number' && task.value > 0) {
              totalCalories += task.value;
              daysWithCalories++;
            }
            if (task.type === TaskType.EXPENSE && typeof task.value === 'number') {
              totalExpenses += task.value;
            }
          });
        });
      });

      return {
        date: month,
        score: Math.round(totalScore / daysWithData),
        calories: daysWithCalories > 0 ? Math.round(totalCalories / daysWithCalories) : 0,
        time: totalTime,
        expenses: totalExpenses
      };
    });
  };

  const calculateTaskSuccessByMonth = () => {
    if (!data.length) return { periods: [], categories: [] };

    const months: { [key: string]: DayEntry[] } = {};
    data.forEach(day => {
      const monthKey = format(new Date(day.date), 'MMMM yyyy');
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(day);
    });

    const taskData: {
      categoryName: string;
      categoryColor: string;
      taskName: string;
      type: TaskType;
      periods: { period: string; value: number }[];
    }[] = [];

    const firstDay = data[0];
    if (firstDay && Array.isArray(firstDay.categories)) {
      firstDay.categories.slice(0, 4).forEach(category => {
        if (Array.isArray(category.tasks)) {
          category.tasks.forEach(task => {
            taskData.push({
              categoryName: category.name,
              categoryColor: CATEGORY_COLORS[category.name] || '#8884d8',
              taskName: task.name,
              type: task.type,
              periods: []
            });
          });
        }
      });
    }

    Object.entries(months).forEach(([month, days]) => {
      taskData.forEach(taskItem => {
        let total = 0;
        let completed = 0;
        let timeSum = 0;
        let calorieSum = 0;
        let daysWithCalories = 0;

        days.forEach(day => {
          const category = day.categories.find(c => c.name === taskItem.categoryName);
          if (category) {
            const task = category.tasks.find(t => t.name === taskItem.taskName);
            if (task) {
              if (task.type === TaskType.CHECKBOX) {
                total++;
                if (task.completed) completed++;
              } else if (task.type === TaskType.TIME && typeof task.value === 'number') {
                timeSum += task.value;
              } else if (task.type === TaskType.CALORIE && typeof task.value === 'number') {
                if (task.value > 0) {
                  calorieSum += task.value;
                  daysWithCalories++;
                }
              }
            }
          }
        });

        let value = 0;
        if (taskItem.type === TaskType.CHECKBOX) {
          value = total > 0 ? Math.round((completed / total) * 100) : 0;
        } else if (taskItem.type === TaskType.TIME) {
          value = timeSum;
        } else if (taskItem.type === TaskType.CALORIE) {
          value = daysWithCalories > 0 ? Math.round(calorieSum / daysWithCalories) : 0;
        }

        taskItem.periods.push({
          period: month,
          value
        });
      });
    });

    return {
      periods: Object.keys(months),
      categories: taskData
    };
  };

  const calculateExpensesByMonth = () => {
    if (!data.length) return { periods: [], categories: [] };

    const months: { [key: string]: DayEntry[] } = {};
    const expenseCategories = new Set<string>();

    data.forEach(day => {
      const monthKey = format(new Date(day.date), 'MMMM yyyy');
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(day);

      day.categories.forEach(category => {
        if (category.type === CategoryType.EXPENSE) {
          expenseCategories.add(category.name);
        }
      });
    });

    const expenseData = Array.from(expenseCategories).map(categoryName => {
      const monthlyValues = Object.entries(months).map(([month, days]) => {
        let total = 0;
        days.forEach(day => {
          const category = day.categories.find(c => c.name === categoryName);
          if (category) {
            category.tasks.forEach(task => {
              if (task.type === TaskType.EXPENSE && typeof task.value === 'number') {
                total += task.value;
              }
            });
          }
        });

        return {
          period: month,
          value: total
        };
      });

      return {
        categoryName,
        periods: monthlyValues
      };
    });

    return {
      periods: Object.keys(months),
      categories: expenseData
    };
  };

  const monthlyData = aggregateDataByMonth();
  const taskSuccess = calculateTaskSuccessByMonth();
  const expenseData = calculateExpensesByMonth();

  const getSuccessRateColor = (rate: number) => {
    if (rate <= 50) {
      const g = Math.floor((rate / 50) * 255);
      return `rgba(255, ${g}, 0, 0.5)`;
    } else {
      const r = Math.floor(((100 - rate) / 50) * 255);
      return `rgba(${r}, 255, 0, 0.5)`;
    }
  };

  const tasksByCategory = taskSuccess.categories.reduce((acc, task) => {
    if (!acc[task.categoryName]) {
      acc[task.categoryName] = {
        color: task.categoryColor,
        tasks: []
      };
    }
    acc[task.categoryName].tasks.push(task);
    return acc;
  }, {} as { [key: string]: { color: string; tasks: typeof taskSuccess.categories } });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Диапазоны</h1>
          <p className="text-sm text-muted-foreground">{dateRangeText}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-category-mind" />
              Показатель успеха по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Успех"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-category-sport" />
              Калории по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke={CATEGORY_COLORS['Спорт']}
                  fill={CATEGORY_COLORS['Спорт']}
                  name="Калории"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-category-time" />
              Время по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="time"
                  stroke={CATEGORY_COLORS['Время']}
                  fill={CATEGORY_COLORS['Время']}
                  name="Время"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-category-expenses" />
              Расходы по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke={CATEGORY_COLORS['Расходы']}
                  fill={CATEGORY_COLORS['Расходы']}
                  name="Расходы"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-primary" />
            Успешность задач по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Период</th>
                  {Object.entries(tasksByCategory).map(([categoryName, category]) => (
                    <th
                      key={categoryName}
                      colSpan={category.tasks.length}
                      className="py-2 px-4 text-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {categoryName}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4"></th>
                  {Object.values(tasksByCategory).map(category =>
                    category.tasks.map(task => (
                      <th
                        key={task.taskName}
                        className="py-2 px-4 text-center text-sm font-medium"
                        style={{ backgroundColor: `${task.categoryColor}10` }}
                      >
                        {task.taskName}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {taskSuccess.periods.map((period, idx) => (
                  <tr key={period} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                    <td className="py-2 px-4 font-medium">{period}</td>
                    {Object.values(tasksByCategory).map(category =>
                      category.tasks.map(task => {
                        const value = task.periods[idx]?.value || 0;
                        return (
                          <td
                            key={`${task.taskName}-${period}`}
                            className="py-2 px-4 text-center"
                            style={{
                              backgroundColor: task.type === TaskType.CHECKBOX
                                ? getSuccessRateColor(value)
                                : `${task.categoryColor}20`
                            }}
                          >
                            {task.type === TaskType.CHECKBOX ? `${value}%` :
                              task.type === TaskType.TIME ? `${value}m` :
                                task.type === TaskType.CALORIE ? value : value}
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                  <th className="py-2 px-4 text-left">Период</th>
                  <th className="py-2 px-4 text-center font-bold">Итого</th>
                  {expenseData.categories.map(category => {
                    const matchingCategory = data.find(day =>
                      day.categories.find(c => c.name === category.categoryName)
                    )?.categories.find(c => c.name === category.categoryName);

                    return (
                      <th
                        key={category.categoryName}
                        className="py-2 px-4 text-center"
                        style={{ backgroundColor: `${CATEGORY_COLORS[category.categoryName] || '#8884d8'}20` }}
                      >
                        {matchingCategory?.emoji || '📝'} {category.categoryName}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {expenseData.periods.map((period, idx) => {
                  const rowTotal = expenseData.categories.reduce((sum, category) => {
                    return sum + (category.periods[idx]?.value || 0);
                  }, 0);

                  return (
                    <tr key={period} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="py-2 px-4 font-medium">{period}</td>
                      <td className="py-2 px-4 text-center font-bold">{rowTotal} zł</td>
                      {expenseData.categories.map(category => {
                        const value = category.periods[idx]?.value || 0;
                        return (
                          <td
                            key={`${category.categoryName}-${period}`}
                            className="py-2 px-4 text-center"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[category.categoryName] || '#8884d8'}20`
                            }}
                          >
                            {value} zł
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}