import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DayEntry, CategoryType, TaskType } from '@shared/schema';
import { format, isToday, isSameDay, getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { calculateDayScore } from '@/lib/utils';

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

  const getSuccessColor = (score: number) => {
    if (score === 0) return 'bg-red-500/70';
    if (score <= 30) return 'bg-red-400/70';
    if (score <= 50) return 'bg-yellow-500/70';
    if (score <= 70) return 'bg-yellow-400/70';
    if (score <= 90) return 'bg-green-400/70';
    return 'bg-green-500/70';
  };

  const getExpenseColor = (expense: number, maxExpense: number) => {
    if (maxExpense === 0) return 'bg-orange-100/10';
    const ratio = expense / maxExpense;
    if (ratio === 0) return 'bg-orange-100/10';
    if (ratio <= 0.3) return 'bg-orange-300/30';
    if (ratio <= 0.6) return 'bg-orange-400/50';
    if (ratio <= 0.8) return 'bg-orange-500/70';
    return 'bg-orange-600/90';
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
        const weekNumber = getWeek(date);
        const weekStart = format(startOfWeek(date), 'dd.MM');
        const weekEnd = format(endOfWeek(date), 'dd.MM');
        const weekTitle = `Неделя ${weekNumber} (${weekStart}-${weekEnd})`;

        if (currentGroupTitle !== weekTitle) {
          if (currentGroup.length > 0) {
            groups.push({ title: currentGroupTitle, days: currentGroup });
          }
          currentGroup = [];
          currentGroupTitle = weekTitle;
        }
      } else { // monthly
        const monthTitle = format(date, 'LLLL yyyy');

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

        return (
          <div key={group.title} className="space-y-2">
            {group.title && (
              <h3 className="text-lg font-semibold text-primary ml-2">{group.title}</h3>
            )}
            <div className="grid grid-cols-7 gap-0.5">
              {group.days.map((day) => {
                const isCurrentDay = isToday(new Date(day.date));
                const isSelected = selectedDate && isSameDay(new Date(day.date), selectedDate);
                const hasData = day.categories && day.categories.length > 0;
                const score = hasData ? calculateDayScore(day) : 0;
                const expenses = calculateDayExpenses(day);

                return (
                  <Card 
                    key={day.date}
                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-zinc-900/50
                      ${isCurrentDay ? 'border-primary/40' : ''}
                      ${isSelected ? 'border-accent/40' : ''}`}
                    onClick={() => onDayClick(day.date)}
                  >
                    <CardContent className="p-0.5">
                      <div className="text-[10px] text-gray-500 text-center mb-0.5">
                        {format(new Date(day.date), 'dd.MM')}
                      </div>
                      <div className="grid grid-rows-2 h-[40px] rounded-sm overflow-hidden">
                        <div className={`flex items-center justify-center ${getSuccessColor(score)}`}>
                          <span className="text-sm font-bold text-white">
                            {hasData ? `${score}%` : '?'}
                          </span>
                        </div>
                        <div className={`flex items-center justify-center ${getExpenseColor(expenses, maxExpenseInGroup)}`}>
                          <span className="text-sm font-bold text-white">
                            {hasData ? expenses : '?'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}