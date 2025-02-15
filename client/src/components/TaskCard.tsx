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
                  className={`h-2.5 ${categoryColor} bg-white/20`}
                  aria-label={`Progress for ${category.name}`}
                />
              )}
            </div>
          </div>

          {/* Task rows */}
          {category.tasks.map((task, index) => (
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
    return 'bg-orange-500/90';
  }

  switch (name) {
    case 'Разум':
      return 'bg-blue-500/90';
    case 'Время':
      return 'bg-green-500/90';
    case 'Спорт':
      return 'bg-red-500/90';
    case 'Привычки':
      return 'bg-purple-500/90';
    default:
      return 'bg-primary';
  }
};

TaskCard.displayName = 'TaskCard';

export default TaskCard;