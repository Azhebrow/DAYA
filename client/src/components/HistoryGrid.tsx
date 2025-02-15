import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DayEntry, CategoryType, TaskType } from '@shared/schema';
import { format, isToday, isSameDay, getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { calculateDayScore } from '@/lib/utils';
import { ru } from 'date-fns/locale';
import { LineChart, DollarSign } from 'lucide-react';

interface HistoryGridProps {
  days: DayEntry[];
  onDayClick: (date: string) => void;
  startDate: string;
  endDate: string;
  selectedDate?: Date;
  groupingMode: 'normal' | 'weekly' | 'monthly';
}

export default function HistoryGrid({ days, onDayClick, selectedDate, groupingMode }: HistoryGridProps) {
  const calculateDayExpenses = (day: DayEntry) => {
    if (!day.categories) return 0;

    return day.categories
      .filter(category => category.type === CategoryType.EXPENSE)
      .reduce((total, category) => {
        if (!category.tasks) return total;
        return total + category.tasks.reduce((categoryTotal, task) =>
          categoryTotal + (typeof task.value === 'number' ? task.value : 0), 0);
      }, 0);
  };

  const getSuccessColor = (score: number, hasData: boolean) => {
    if (!hasData) return 'bg-gray-500/50';
    if (score === 0) return 'bg-red-500/70';
    if (score <= 30) return 'bg-red-400/70';
    if (score <= 50) return 'bg-yellow-500/70';
    if (score <= 70) return 'bg-yellow-400/70';
    if (score <= 90) return 'bg-green-400/70';
    return 'bg-green-500/70';
  };

  const getExpenseColor = (expense: number, maxExpense: number) => {
    if (maxExpense === 0) return 'bg-orange-500/10';
    const ratio = expense / maxExpense;
    if (ratio === 0) return 'bg-orange-500/10';
    if (ratio <= 0.3) return 'bg-orange-500/30';
    if (ratio <= 0.6) return 'bg-orange-500/50';
    if (ratio <= 0.8) return 'bg-orange-500/70';
    return 'bg-orange-500/90';
  };

  const calculateGroupStats = (groupDays: DayEntry[]) => {
    const daysWithData = groupDays.filter(day => day.categories && day.categories.length > 0);
    const totalExpenses = daysWithData.reduce((sum, day) => sum + calculateDayExpenses(day), 0);
    const averageSuccess = daysWithData.length > 0
      ? Math.round(daysWithData.reduce((sum, day) => sum + calculateDayScore(day), 0) / daysWithData.length)
      : 0;

    return { totalExpenses, averageSuccess };
  };

  const groupDaysByPeriod = () => {
    if (groupingMode === 'normal') {
      return [{ title: '', days }];
    }

    const groups: { title: string; days: DayEntry[] }[] = [];
    let currentGroup: DayEntry[] = [];
    let currentGroupTitle = '';

    days.forEach((day, index) => {
      const date = new Date(day.date);

      if (groupingMode === 'weekly') {
        const weekNumber = getWeek(date, { weekStartsOn: 1 });
        const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'dd.MM');
        const weekEnd = format(endOfWeek(date, { weekStartsOn: 1 }), 'dd.MM');
        const weekTitle = `Неделя ${weekNumber} (${weekStart}-${weekEnd})`;

        if (currentGroupTitle !== weekTitle) {
          if (currentGroup.length > 0) {
            groups.push({ title: currentGroupTitle, days: currentGroup });
          }
          currentGroup = [];
          currentGroupTitle = weekTitle;
        }
      } else { // monthly
        const monthTitle = format(date, 'LLLL yyyy', { locale: ru })
          .split('')
          .map((char, i) => i === 0 ? char.toUpperCase() : char)
          .join('');

        if (currentGroupTitle !== monthTitle) {
          if (currentGroup.length > 0) {
            groups.push({ title: currentGroupTitle, days: currentGroup });
          }
          currentGroup = [];
          currentGroupTitle = monthTitle;
        }
      }

      currentGroup.push(day);

      if (index === days.length - 1) {
        groups.push({ title: currentGroupTitle, days: currentGroup });
      }
    });

    return groups;
  };

  const groupedDays = groupDaysByPeriod();

  return (
    <div className="space-y-6">
      {groupedDays.map((group, groupIndex) => {
        const maxExpenseInGroup = Math.max(
          ...group.days.map(day => calculateDayExpenses(day))
        );
        const { totalExpenses, averageSuccess } = calculateGroupStats(group.days);

        return (
          <div key={group.title} className="space-y-2">
            {group.title && (
              <div className="flex items-center gap-4 ml-2">
                <h3 className="text-lg font-semibold text-primary">{group.title}</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-md">
                    <LineChart className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-white">{averageSuccess}%</span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-md">
                    <DollarSign className="h-4 w-4 text-[rgb(249,115,22)]" />
                    <span className="text-sm font-medium text-white">{totalExpenses}zł</span>
                  </div>
                </div>
              </div>
            )}
            {/* Show weekday labels only on desktop and when in weekly/monthly mode */}
            <div className="hidden sm:grid sm:grid-cols-7 gap-2 mb-1">
              {(groupingMode === 'weekly' || groupingMode === 'monthly') && (
                ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day} className="text-[10px] text-gray-500 text-center font-medium">
                    {day}
                  </div>
                ))
              )}
            </div>
            {/* Grid container with different columns for mobile and desktop */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {group.days.map((day) => {
                const isCurrentDay = isToday(new Date(day.date));
                const isSelected = selectedDate && isSameDay(new Date(day.date), selectedDate);
                const hasData = day.categories && day.categories.length > 0;
                const score = hasData ? calculateDayScore(day) : 0;
                const expenses = calculateDayExpenses(day);
                const date = new Date(day.date);

                return (
                  <div key={day.date} className="space-y-1">
                    <div className="text-xs text-gray-500 text-center font-medium">
                      {format(date, 'dd.MM')}
                    </div>
                    <Card
                      className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-zinc-900/50
                        ${isCurrentDay ? 'border-primary/40' : ''}
                        ${isSelected ? 'border-accent/40' : ''}`}
                      onClick={() => onDayClick(day.date)}
                    >
                      <CardContent className="p-2 sm:p-0.5">
                        <div className="grid grid-rows-2 h-[70px] sm:h-[50px] rounded-sm overflow-hidden">
                          <div className={`flex items-center justify-center ${getSuccessColor(score, hasData)}`}>
                            <span className="text-base sm:text-sm font-bold text-white">
                              {hasData ? `${score}%` : '?'}
                            </span>
                          </div>
                          <div className={`flex items-center justify-center ${getExpenseColor(expenses, maxExpenseInGroup)}`}>
                            <span className="text-base sm:text-sm font-bold text-white whitespace-nowrap">
                              {hasData ? `${expenses}zł` : '?'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}