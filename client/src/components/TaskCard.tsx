import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Category } from '@shared/schema';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="bg-zinc-900/50 border-gray-800">
        <div className="flex">
          {/* Левая колонка - Информация */}
          <div className="w-1/2 p-4 flex flex-col border-r border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl" role="img" aria-label={category.name}>
                {category.emoji}
              </span>
              <span className="text-sm font-medium text-gray-200">
                {category.name}
              </span>
            </div>

            {!isExpenseCard && (
              <div className="mb-4">
                <Progress 
                  value={progress} 
                  className="h-2 bg-gray-800"
                  aria-label={`Progress for ${category.name}`}
                />
              </div>
            )}

            <div className="space-y-3">
              {category.tasks.map((task) => (
                <div key={task.id} className="text-sm text-gray-400">
                  {task.name}
                </div>
              ))}
            </div>
          </div>

          {/* Правая колонка - Формы */}
          <div className="w-1/2 p-4 space-y-3">
            {category.tasks.map((task) => (
              <TaskInput
                key={task.id}
                task={task}
                onChange={(value) => handleTaskUpdate(task.id, value)}
                isExpenseCard={isExpenseCard}
                hideLabel={true}
              />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

TaskCard.displayName = 'TaskCard';