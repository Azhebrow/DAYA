import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { DayEntry, CategoryType, TaskType, settingsSchema } from '@shared/schema';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  format, eachMonthOfInterval, eachWeekOfInterval,
  startOfMonth, endOfMonth, subMonths,
  startOfWeek, endOfWeek, subWeeks
} from 'date-fns';
import { ActivitySquare, Flame, Clock, LineChart, DollarSign } from 'lucide-react';
import { calculateDayScore } from '@/utils'; // Assuming utils.ts location

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const CATEGORY_COLORS: { [key: string]: string } = {
  'Разум': '#6B7280',    // Серый
  'Время': '#10B981',    // Зеленый
  'Спорт': '#EF4444',    // Красный (для активности)
  'Привычки': '#8B5CF6'  // Фиолетовый
};

type ViewType = 'weekly' | 'monthly';

export default function MonthlyStats() {
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [data, setData] = useState<DayEntry[]>([]);
  const [dateRangeText, setDateRangeText] = useState('');
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return settingsSchema.parse({});
      return settingsSchema.parse(JSON.parse(stored));
    } catch (error) {
      console.error('Error parsing settings:', error);
      return settingsSchema.parse({});
    }
  });

  useEffect(() => {
    const endDate = new Date();
    let startDate: Date;
    let days: DayEntry[] = [];

    if (viewType === 'monthly') {
      startDate = subMonths(endDate, 12);
      setDateRangeText(`${format(startDate, 'MMMM yyyy')} - ${format(endDate, 'MMMM yyyy')}`);
    } else {
      startDate = subWeeks(endDate, 12);
      setDateRangeText(`${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')}`);
    }

    let currentDate = startDate;
    while (currentDate <= endDate) {
      const entry = storage.getDayEntry(format(currentDate, 'yyyy-MM-dd'));
      if (entry) {
        days.push(entry);
      }
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    setData(days);
  }, [viewType]);

  // Replaced with import
  // const calculateDayScore = (categories: { tasks: { completed: boolean; type: TaskType; value?: number }[] }[]) => {
  //   let totalTasks = 0;
  //   let completedTasks = 0;
  //   categories.forEach(category => {
  //     category.tasks.forEach(task => {
  //       if (task.type === TaskType.CHECKBOX) {
  //         totalTasks++;
  //         if (task.completed) completedTasks++;
  //       }
  //     });
  //   });
  //   return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  // };

  const aggregateDataByPeriod = () => {
    if (!data.length) return [];

    const periods: { [key: string]: DayEntry[] } = {};

    // Группируем дни по периодам
    data.forEach(day => {
      const date = new Date(day.date);
      const periodKey = viewType === 'monthly'
        ? format(date, 'MMMM yyyy')
        : `${format(startOfWeek(date), 'dd.MM')} - ${format(endOfWeek(date), 'dd.MM')}`;

      if (!periods[periodKey]) {
        periods[periodKey] = [];
      }
      periods[periodKey].push(day);
    });

    // Обрабатываем каждый период
    return Object.entries(periods).map(([periodKey, days]) => {
      let totalTime = 0;
      let calories = 0;
      let expenses = 0;
      let scoresSum = 0;
      let daysWithData = 0;

      days.forEach(day => {
        const score = calculateDayScore(day.categories);
        scoresSum += score;
        daysWithData++;

        day.categories.forEach(category => {
          category.tasks.forEach(task => {
            if (task.type === TaskType.TIME && typeof task.value === 'number') {
              totalTime += task.value;
            }
            if (task.type === TaskType.CALORIE && typeof task.value === 'number') {
              calories += task.value;
            }
            if (task.type === TaskType.EXPENSE && typeof task.value === 'number') {
              expenses += task.value;
            }
          });
        });
      });

      return {
        date: periodKey,
        totalTime,
        calories,
        expenses,
        score: Math.round(scoresSum / daysWithData)
      };
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const dailyStats = aggregateDataByPeriod();
  // Placeholder data - replace with actual data fetching and processing
  const monthlyExpenses = {
    categories: [
      { categoryName: 'Продукты', periods: [{ value: 100 }, { value: 120 }, { value: 150 }] },
      { categoryName: 'Транспорт', periods: [{ value: 50 }, { value: 60 }, { value: 70 }] },
      { categoryName: 'Развлечения', periods: [{ value: 30 }, { value: 40 }, { value: 50 }] }
    ],
    periods: ['Январь', 'Февраль', 'Март']
  };


  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Месяцы</h1>
          <p className="text-sm text-muted-foreground">{dateRangeText}</p>
        </div>
        <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Недели</SelectItem>
            <SelectItem value="monthly">Месяцы</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-category-mind" />
              Показатель успеха
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="stepAfter"
                  dataKey="score"
                  stroke={CATEGORY_COLORS['Разум']}
                  fill={CATEGORY_COLORS['Разум']}
                  name="Успех"
                  connectNulls={true}
                  dot={{ r: 4 }}
                  label={{
                    position: 'top',
                    fill: CATEGORY_COLORS['Разум'],
                    formatter: (value: any) => value ? `${value}%` : ''
                  }}
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
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value: any) => formatTime(value as number)}
                />
                <Area
                  type="stepAfter"
                  dataKey="totalTime"
                  stroke={CATEGORY_COLORS['Время']}
                  fill={CATEGORY_COLORS['Время']}
                  name="Время"
                  connectNulls={true}
                  dot={{ r: 4 }}
                  label={{
                    position: 'top',
                    fill: CATEGORY_COLORS['Время'],
                    formatter: (value: any) => value ? formatTime(value as number) : ''
                  }}
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
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="stepAfter"
                  dataKey="calories"
                  stroke={CATEGORY_COLORS['Спорт']}
                  fill={CATEGORY_COLORS['Спорт']}
                  name="Калории"
                  connectNulls={true}
                  dot={{ r: 4 }}
                  label={{
                    position: 'top',
                    fill: CATEGORY_COLORS['Спорт'],
                    formatter: (value: any) => value ? `${value}` : ''
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-category-expenses" />
              Расходы
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="stepAfter"
                  dataKey="expenses"
                  stroke={CATEGORY_COLORS['Спорт']}
                  fill={CATEGORY_COLORS['Спорт']}
                  name="Расходы"
                  connectNulls={true}
                  dot={{ r: 4 }}
                  label={{
                    position: 'top',
                    fill: CATEGORY_COLORS['Спорт'],
                    formatter: (value: any) => value ? `${value}` : ''
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="py-2 px-4 text-center">Период</th>
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
                  {/* Итоговая строка */}
                  <tr className="border-t-2 border-border font-bold">
                    <td className="py-2 px-4">Итого</td>
                    {monthlyExpenses.categories.map(category => {
                      const categoryTotal = category.periods.reduce((sum, period) => {
                        return sum + (period.value || 0);
                      }, 0);
                      return (
                        <td
                          key={`total-${category.categoryName}`}
                          className="py-2 px-4 text-center"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[category.categoryName] || '#8884d8'}20`
                          }}
                        >
                          {categoryTotal} zł
                        </td>
                      );
                    })}
                    <td className="py-2 px-4 text-center">
                      {monthlyExpenses.periods.reduce((total, _, periodIdx) => {
                        const periodTotal = monthlyExpenses.categories.reduce((sum, category) => {
                          return sum + (category.periods[periodIdx]?.value || 0);
                        }, 0);
                        return total + periodTotal;
                      }, 0)} zł
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}