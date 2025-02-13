import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { DayEntry, CategoryType, TaskType } from '@shared/schema';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Разум': '#FF6B6B',
  'Время': '#4ECDC4',
  'Спорт': '#45B7D1',
  'Привычки': '#96CEB4'
};

type TimeRangeType = 'monthly';

export default function TenDayStats() {
  const [timeRange] = useState<TimeRangeType>('monthly');
  const [data, setData] = useState<DayEntry[]>([]);
  const [periodData, setPeriodData] = useState<Array<{
    period: string;
    totalTime: number;
    totalCalories: number;
    totalExpenses: number;
  }>>([]);

  useEffect(() => {
    let startDate: Date;
    let endDate: Date = new Date();

    startDate = startOfMonth(subMonths(endDate, 11));
    endDate = endOfMonth(endDate);

    const days: DayEntry[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const entry = storage.getDayEntry(dateStr);
      if (entry) {
        days.push(entry);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setData(days);

    const monthlyData: { [key: string]: DayEntry[] } = {};
    days.forEach(day => {
      const monthKey = format(new Date(day.date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(day);
    });

    const periodStats = Object.entries(monthlyData).map(([monthKey, periodDays]) => {
      let totalTime = 0;
      let totalCalories = 0;
      let totalExpenses = 0;
      let daysWithCalories = 0;

      periodDays.forEach(day => {
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
        period: monthKey,
        totalTime: Math.round(totalTime / periodDays.length),
        totalCalories: daysWithCalories > 0 ? Math.round(totalCalories / daysWithCalories) : 0,
        totalExpenses: Math.round(totalExpenses / periodDays.length)
      };
    });

    setPeriodData(periodStats);
  }, [timeRange]);

  const calculateExpensesByPeriod = () => {
    if (!data.length) return { periods: [], categories: [] };

    const expenseCategories = new Set<string>();
    data.forEach(day => {
      day.categories.forEach(category => {
        if (category.type === CategoryType.EXPENSE) {
          expenseCategories.add(category.name);
        }
      });
    });

    const monthlyData: { [key: string]: DayEntry[] } = {};
    data.forEach(day => {
      const monthKey = format(new Date(day.date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(day);
    });

    const expenseData = Array.from(expenseCategories).map(categoryName => {
      const monthlyValues = Object.entries(monthlyData).map(([monthKey, days]) => {
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
          period: monthKey,
          value: Math.round(total / days.length)
        };
      });

      return {
        categoryName,
        periods: monthlyValues
      };
    });

    return {
      periods: Object.keys(monthlyData),
      categories: expenseData
    };
  };

  const monthlyExpenses = calculateExpensesByPeriod();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-2xl font-bold">Месяцы</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔥 Общие калории за период</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                itemStyle={{ color: '#ffffff' }}
                labelStyle={{ color: '#ffffff' }} />
              <Area
                type="monotone"
                dataKey="totalCalories"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Калории"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⏱️ Общее время (в минутах)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="totalTime"
                stroke="#8884d8"
                fill="#8884d8"
                name="Минуты"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💰 Общие расходы за период</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="totalExpenses"
                stroke="#FF8042"
                fill="#FF8042"
                name="Расходы"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💰 Расходы по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Период</th>
                  {monthlyExpenses.categories.map(category => {
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
                  <th className="py-2 px-4 text-center font-bold">Итого</th>
                </tr>
              </thead>
              <tbody>
                {monthlyExpenses.periods.map((period, idx) => {
                  const rowTotal = monthlyExpenses.categories.reduce((sum, category) => {
                    return sum + (category.periods[idx]?.value || 0);
                  }, 0);

                  return (
                    <tr key={period} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="py-2 px-4 font-medium">{period}</td>
                      {monthlyExpenses.categories.map(category => {
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
                      <td className="py-2 px-4 text-center font-bold">{rowTotal} zł</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>✏️ Ежедневный отчет</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Дата</th>
                  <th className="py-2 px-4">Отчет</th>
                </tr>
              </thead>
              <tbody>
                {data.map(day => {
                  const reportCategory = day.categories.find(c => c.name === "Отчет");
                  const reportTask = reportCategory?.tasks.find(t => t.type === TaskType.EXPENSE_NOTE);

                  if (!reportTask?.textValue) return null;

                  return (
                    <tr key={day.date} className="border-b border-border/10">
                      <td className="py-2 px-4 font-medium">
                        {format(new Date(day.date), 'dd.MM.yyyy')}
                      </td>
                      <td className="py-2 px-4 whitespace-pre-wrap">
                        {reportTask.textValue}
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}