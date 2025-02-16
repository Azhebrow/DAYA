import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Category, CategoryType, settingsSchema } from '@shared/schema';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';
import { Brain, Clock, Dumbbell, Sparkles } from 'lucide-react';

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

  // Get category icon
  const getCategoryIcon = () => {
    switch (category.name) {
      case 'Разум':
        return <Brain className="w-6 h-6" />;
      case 'Время':
        return <Clock className="w-6 h-6" />;
      case 'Спорт':
        return <Dumbbell className="w-6 h-6" />;
      case 'Привычки':
        return <Sparkles className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getCategoryColor = () => {
    const colorMap = {
      'Разум': 'purple',
      'Время': 'green',
      'Спорт': 'red',
      'Привычки': 'orange',
      'default': 'zinc'
    };

    const baseName = colorMap[category.name] || colorMap.default;
    return `${baseName}-500`;
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
                  className="h-2.5"
                  style={{
                    backgroundColor: 'rgb(39, 39, 42)'
                  }}
                  className={`bg-zinc-800 [&>div]:bg-${categoryColor}`}
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

TaskCard.displayName = 'TaskCard';

export default TaskCard;