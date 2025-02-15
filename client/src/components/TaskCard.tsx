import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
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
        <div className="divide-y divide-zinc-800">
          {/* Header row with category name and progress bar */}
          <div className="flex items-center h-[3.5rem]">
            <div className="w-1/2 px-4 flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label={category.name}>
                {category.emoji}
              </span>
              <span className="text-base font-medium text-gray-200">
                {category.name}
              </span>
            </div>
            <div className="w-1/2 px-4">
              {!isExpenseCard && (
                <Progress 
                  value={progress} 
                  className="h-2.5 bg-white/20"
                  style={{
                    '--progress-background': categoryColor
                  } as React.CSSProperties}
                  aria-label={`Progress for ${category.name}`}
                />
              )}
            </div>
          </div>

          {/* Task rows */}
          {category.tasks.map((task) => (
            <div key={task.id} className="flex items-center h-[3.5rem]">
              {!isExpenseCard && (
                <div className="w-1/2 px-4">
                  <span className="text-base text-gray-400">{task.name}</span>
                </div>
              )}
              <div className={isExpenseCard ? "w-full px-4" : "w-1/2 px-4"}>
                <TaskInput
                  task={task}
                  onChange={(value) => handleTaskUpdate(task.id, value)}
                  isExpenseCard={isExpenseCard}
                  categoryColor={categoryColor}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
});

const getCategoryColor = (name: string, type: CategoryType): string => {
  if (type === CategoryType.EXPENSE) {
    return 'rgba(249, 115, 22, 0.9)'; // Orange color for expenses
  }

  switch (name) {
    case 'Разум':
      return 'rgba(139, 92, 246, 0.9)'; // Purple
    case 'Время':
      return 'rgba(16, 185, 129, 0.9)'; // Green
    case 'Спорт':
      return 'rgba(239, 68, 68, 0.9)'; // Red
    case 'Привычки':
      return 'rgba(245, 158, 11, 0.9)'; // Amber
    default:
      return 'rgba(var(--primary), 0.9)';
  }
};

TaskCard.displayName = 'TaskCard';

export default TaskCard;