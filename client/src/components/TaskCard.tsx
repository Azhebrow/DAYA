import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Category, CategoryType } from '@shared/schema';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';

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

  const handleTaskUpdate = useCallback((taskId: string, value: number | boolean | string) => {
    onTaskUpdate(taskId, value);
  }, [onTaskUpdate]);

  const categoryColor = getCategoryColor(category.name, category.type);

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
              categoryName={category.name}
              categoryColor={categoryColor}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

const getCategoryColor = (name: string, type: CategoryType): string => {
  if (type === CategoryType.EXPENSE) {
    return 'bg-category-expenses';
  }

  switch (name) {
    case 'Разум':
      return 'bg-category-mind';
    case 'Время':
      return 'bg-category-time';
    case 'Спорт':
      return 'bg-category-sport';
    case 'Привычки':
      return 'bg-category-habits';
    default:
      return 'bg-primary';
  }
};

TaskCard.displayName = 'TaskCard';