import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DayEntry, CategoryType, TaskType } from '@shared/schema';
import { format, isToday, isSameDay, getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getScoreColor } from '@/lib/utils';

interface HistoryGridProps {
  days: DayEntry[];
  onDayClick: (date: string) => void;
  startDate: string;
  endDate: string;
  selectedDate?: Date;
  groupingMode: 'normal' | 'weekly' | 'monthly';
}

export default function HistoryGrid({ days, onDayClick, selectedDate, groupingMode }: HistoryGridProps) {
  const calculateDayScore = (day: DayEntry) => {
    if (!day.categories) return null;

    let score = 0;
    let total = 0;

    day.categories.slice(0, 4).forEach(category => {
      if (!category.tasks) return;

      category.tasks.forEach(task => {
        if (task.type === TaskType.CHECKBOX) {
          total += 1;
          if (task.completed) score += 1;
        } else if (task.type === TaskType.TIME || task.type === TaskType.CALORIE) {
          total += 1;
          if (typeof task.value === 'number' && task.value > 0) score += 1;
        }
      });
    });

    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const calculateDayExpenses = (day: DayEntry) => {
    if (!day.categories) return null;

    return day.categories
      .filter(category => category.type === CategoryType.EXPENSE)
      .reduce((total, category) => {
        if (!category.tasks) return total;
        return total + category.tasks.reduce((categoryTotal, task) =>
          categoryTotal + (typeof task.value === 'number' ? task.value : 0), 0);
      }, 0);
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

      // Add the last group
      if (index === days.length - 1) {
        groups.push({ title: currentGroupTitle, days: currentGroup });
      }
    });

    return groups;
  };

  const groupedDays = groupDaysByPeriod();

  return (
    <div className="space-y-6">
      {groupedDays.map((group, groupIndex) => (
        <div key={group.title} className="space-y-2">
          {group.title && (
            <h3 className="text-lg font-semibold text-primary ml-2">{group.title}</h3>
          )}
          <div className="grid grid-cols-7 gap-0.5">
            {group.days.map((day) => {
              const isCurrentDay = isToday(new Date(day.date));
              const isSelected = selectedDate && isSameDay(new Date(day.date), selectedDate);
              const hasData = day.categories && day.categories.length > 0;
              const score = calculateDayScore(day);
              const expenses = calculateDayExpenses(day);

              return (
                <Card 
                  key={day.date}
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-zinc-900/50 border-gray-800
                    ${isCurrentDay ? 'border-primary/40 bg-primary/5' : ''}
                    ${isSelected ? 'border-accent/40 bg-accent/5' : ''}`}
                  onClick={() => onDayClick(day.date)}
                >
                  <CardContent className="p-0.5 h-full flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-gray-500">
                      {format(new Date(day.date), 'dd.MM')}
                    </div>
                    <div className={`text-sm font-bold ${hasData ? getScoreColor(score || 0) : 'text-gray-500'}`}>
                      {hasData ? `${score}%` : '?'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {hasData ? `${expenses}` : '?'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}