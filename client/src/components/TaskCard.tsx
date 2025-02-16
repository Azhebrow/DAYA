import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Category, CategoryType, settingsSchema } from '@shared/schema';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';
import { Brain, Clock, Dumbbell, Sparkles, DollarSign } from 'lucide-react';

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
  const [settings] = useState(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return settingsSchema.parse({});
      return settingsSchema.parse(JSON.parse(stored));
    } catch (error) {
      console.error('Error parsing settings:', error);
      return settingsSchema.parse({});
    }
  });

  const progress = React.useMemo(() => 
    calculateCategoryProgress(category.tasks, category.type),
    [category.tasks, category.type]
  );

  const handleTaskUpdate = useCallback((taskId: string, value: number | boolean | string) => {
    onTaskUpdate(taskId, value);
  }, [onTaskUpdate]);

  // Получение цвета из настроек
  const getCategoryColor = () => {
    switch (category.name) {
      case 'Разум':
        return settings.colors?.mind || 'purple-500';
      case 'Время':
        return settings.colors?.time || 'green-500';
      case 'Спорт':
        return settings.colors?.sport || 'red-500';
      case 'Привычки':
        return settings.colors?.habits || 'orange-500';
      default:
        return settings.colors?.expenses || 'orange-500';
    }
  };

  // Получение иконки для категории
  const getCategoryIcon = () => {
    switch (category.name) {
      case 'Разум':
        return <Brain className="h-5 w-5" />;
      case 'Время':
        return <Clock className="h-5 w-5" />;
      case 'Спорт':
        return <Dumbbell className="h-5 w-5" />;
      case 'Привычки':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const categoryColor = getCategoryColor();

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
              <div className={`text-${categoryColor}`}>
                {getCategoryIcon()}
              </div>
              <span className="text-base font-medium text-gray-200">
                {category.name}
              </span>
            </div>
            <div className="w-1/2 px-4">
              {!isExpenseCard && (
                <Progress 
                  value={progress} 
                  className={`h-2.5 bg-zinc-800`}
                  style={{ ['--progress-background' as any]: `var(--${categoryColor})` }}
                  aria-label={`Progress for ${category.name}`}
                />
              )}
            </div>
          </div>

          {/* Task rows */}
          <div className="divide-y divide-zinc-800">
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
        </div>
      </Card>
    </motion.div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;