import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Category } from '@shared/schema';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';
import { Brain, Clock, Dumbbell, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { storage } from '@/lib/storage';

interface TaskCardProps {
  category: Category;
  onTaskUpdate: (taskId: string, value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

export const TaskCard = React.memo(({ 
  category, 
  onTaskUpdate, 
  isExpenseCard = false 
}: TaskCardProps) => {
  const progress = React.useMemo(() => 
    calculateCategoryProgress(category.tasks, category.type),
    [category.tasks, category.type]
  );

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => storage.getSettings(),
  });

  const handleTaskUpdate = useCallback((taskId: string, value: number | boolean | string) => {
    onTaskUpdate(taskId, value);
  }, [onTaskUpdate]);

  const getIconColor = () => {
    if (!settings?.colors) return 'var(--purple)';

    switch (category.name) {
      case 'Разум': return `var(${settings.colors.mind})`;
      case 'Время': return `var(${settings.colors.time})`;
      case 'Спорт': return `var(${settings.colors.sport})`;
      case 'Привычки': 
      case 'Пороки': return `var(${settings.colors.habits})`; 
      default: return `var(${settings.colors.expenses})`;
    }
  };

  const getCategoryIcon = () => {
    switch (category.name) {
      case 'Разум': return <Brain className="h-5 w-5" />;
      case 'Время': return <Clock className="h-5 w-5" />;
      case 'Спорт': return <Dumbbell className="h-5 w-5" />;
      case 'Привычки': 
      case 'Пороки': return <Ban className="h-5 w-5" />;
      default: return null;
    }
  };

  // Обновляем название и эмодзи категории из настроек если это карточка расходов
  React.useEffect(() => {
    if (isExpenseCard && settings?.subcategories?.expenses) {
      const expenseCategory = settings.subcategories.expenses.find(
        cat => category.tasks[0]?.id === `${cat.id}_expense`
      );
      if (expenseCategory) {
        category.name = expenseCategory.name;
        category.emoji = expenseCategory.emoji;
        // Также обновляем имя задачи
        if (category.tasks[0]) {
          category.tasks[0].name = expenseCategory.name;
        }
      }
    }
  }, [settings, category, isExpenseCard]);

  const iconColor = getIconColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-zinc-900/50 task-card">
        <div className="flex items-center h-14 px-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {!isExpenseCard ? (
              <span style={{ color: iconColor }}>{getCategoryIcon()}</span>
            ) : (
              <span className="text-xl" role="img" aria-label={category.name}>
                {category.emoji}
              </span>
            )}
            <span className="text-base font-medium text-gray-200">
              {category.name}
            </span>
          </div>

          {!isExpenseCard && (
            <div className="ml-auto w-1/3">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: iconColor
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          {category.tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center h-14 px-4 border-b border-zinc-800 last:border-0"
            >
              {!isExpenseCard && (
                <span className="w-1/2 text-gray-400">{task.name}</span>
              )}
              <div className={isExpenseCard ? "w-full" : "w-1/2"}>
                <TaskInput
                  task={task}
                  onChange={(value) => handleTaskUpdate(task.id, value)}
                  isExpenseCard={isExpenseCard}
                  categoryColor={iconColor}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;