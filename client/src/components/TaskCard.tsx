import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Category } from '@shared/schema';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';
import { Brain, Clock, Dumbbell, Ban, DollarSign } from 'lucide-react';

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

  const getIconColor = () => {
    const stored = localStorage.getItem('day_success_tracker_settings');
    let colors;
    try {
      if (stored) {
        const settings = JSON.parse(stored);
        colors = settings.colors;
      }
    } catch (error) {
      console.error('Error parsing settings:', error);
    }

    if (!colors) {
      colors = {
        mind: '--purple',
        time: '--green',
        sport: '--red',
        habits: '--orange',
        expenses: '--orange'
      };
    }

    switch (category.name) {
      case 'Разум': return `var(${colors.mind})`;
      case 'Время': return `var(${colors.time})`;
      case 'Спорт': return `var(${colors.sport})`;
      case 'Привычки': return `var(${colors.habits})`;
      default: return `var(${colors.expenses})`;
    }
  };

  const getCategoryIcon = () => {
    switch (category.name) {
      case 'Разум': return <Brain className="h-5 w-5" />;
      case 'Время': return <Clock className="h-5 w-5" />;
      case 'Спорт': return <Dumbbell className="h-5 w-5" />;
      case 'Привычки': return <Ban className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const iconColor = getIconColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-zinc-900/50">
        <div className="flex items-center h-14 px-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span style={{ color: iconColor }}>{getCategoryIcon()}</span>
            <span className="text-base font-medium text-gray-200">{category.name}</span>
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