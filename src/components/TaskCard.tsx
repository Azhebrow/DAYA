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

const formatTimeValue = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} мин`;
  return `${hours} ч ${mins > 0 ? `${mins} мин` : ''}`;
};

const TimeDisplay = ({ value }: { value: number }) => (
  <div className="flex items-center justify-center w-full h-16 bg-zinc-800/50 rounded-lg">
    <span className="text-xl font-mono font-bold">{formatTimeValue(value)}</span>
  </div>
);

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
            <div key={task.id}>
              {category.type === CategoryType.TIME ? (
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-gray-300">{task.name}</span>
                  <TimeDisplay value={task.value || 0} />
                </div>
              ) : (
                <TaskInput
                  task={task}
                  onChange={(value) => handleTaskUpdate(task.id, value)}
                  isExpenseCard={isExpenseCard}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

TaskCard.displayName = 'TaskCard';