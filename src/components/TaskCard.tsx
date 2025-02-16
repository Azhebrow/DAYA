import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Category } from '@shared/schema';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { storage } from '@/lib/storage';

interface TaskCardProps {
  category: Category;
  onTaskUpdate: (taskId: string, value: number | boolean | string) => void;
  isExpenseCard?: boolean;
  expenseIndex?: number;
}

export const TaskCard = React.memo(({ 
  category, 
  onTaskUpdate, 
  isExpenseCard = false,
  expenseIndex 
}: TaskCardProps) => {
  const progress = React.useMemo(() => 
    calculateCategoryProgress(category.tasks, category.type),
    [category.tasks, category.type]
  );

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => storage.getSettings()
  });

  const handleTaskUpdate = useCallback((taskId: string, value: number | boolean | string) => {
    onTaskUpdate(taskId, value);
  }, [onTaskUpdate]);

  // If this is an expense card, update the name and emoji from settings
  React.useEffect(() => {
    if (isExpenseCard && settings?.subcategories?.expenses && typeof expenseIndex === 'number') {
      const expenseCategory = settings.subcategories.expenses[expenseIndex];
      if (expenseCategory) {
        // Используем полное имя с эмодзи
        category.name = expenseCategory.name;
        category.emoji = expenseCategory.emoji;
        // Также обновляем имя задачи
        if (category.tasks[0]) {
          category.tasks[0].name = expenseCategory.name;
        }
      }
    }
  }, [settings, category, isExpenseCard, expenseIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="bg-zinc-900/50 border-gray-800">
        <div className="flex items-center p-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={category.name}>
              {category.emoji}
            </span>
            <span className="text-sm font-medium text-gray-200">
              {category.name}
            </span>
          </div>
          {!isExpenseCard && (
            <div className="ml-4 flex-grow">
              <Progress 
                value={progress} 
                className="h-2 bg-gray-800"
                aria-label={`Progress for ${category.name}`}
              />
            </div>
          )}
        </div>
        <CardContent className="space-y-3 p-4 pt-2">
          {category.tasks.map((task) => (
            <TaskInput
              key={task.id}
              task={task}
              onChange={(value) => handleTaskUpdate(task.id, value)}
              isExpenseCard={isExpenseCard}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

TaskCard.displayName = 'TaskCard';