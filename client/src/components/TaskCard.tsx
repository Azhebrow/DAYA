import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Brain, Clock, Dumbbell, Ban, DollarSign } from 'lucide-react';
import { storage } from '@/lib/storage';
import TaskInput from './TaskInput';
import { calculateCategoryProgress } from '@/lib/utils';

interface TaskCardProps {
  categoryName: string;
  onTaskUpdate: (taskId: string, value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

export const TaskCard = React.memo(({ 
  categoryName, 
  onTaskUpdate, 
  isExpenseCard = false 
}: TaskCardProps) => {
  const [storedCategory, setStoredCategory] = React.useState(() => {
    const tasks = storage.getTasks();
    return tasks.find(c => c.name === categoryName);
  });

  const settings = storage.getSettings();

  React.useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      const tasks = storage.getTasks();
      setStoredCategory(tasks.find(c => c.name === categoryName));
    });
    return unsubscribe;
  }, [categoryName]);

  if (!storedCategory) {
    return null;
  }

  const progress = calculateCategoryProgress(storedCategory.tasks, storedCategory.type);

  const handleTaskUpdate = useCallback((taskId: string, value: number | boolean | string) => {
    onTaskUpdate(taskId, value);
  }, [onTaskUpdate]);

  const getIconColor = () => {
    const colors = settings.colors;
    switch (categoryName) {
      case 'Разум': return `var(${colors.mind})`;
      case 'Время': return `var(${colors.time})`;
      case 'Здоровье': return `var(${colors.sport})`;
      case 'Пороки': return `var(${colors.habits})`;
      default: return `var(${colors.expenses})`;
    }
  };

  const getCategoryIcon = () => {
    switch (categoryName) {
      case 'Разум': return <Brain className="h-5 w-5" />;
      case 'Время': return <Clock className="h-5 w-5" />;
      case 'Здоровье': return <Dumbbell className="h-5 w-5" />;
      case 'Пороки': return <Ban className="h-5 w-5" />;
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
      <Card className="bg-zinc-900/50 task-card">
        <div className="flex items-center h-14 px-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span style={{ color: iconColor }}>{getCategoryIcon()}</span>
            <span className="text-base font-medium text-gray-200">
              {categoryName}
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
          {storedCategory.tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center h-14 px-4 border-b border-zinc-800 last:border-0"
            >
              {!isExpenseCard && (
                <span className="w-1/2 text-gray-400">
                  {`${task.emoji} ${task.name}`}
                </span>
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