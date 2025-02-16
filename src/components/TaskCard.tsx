import React from 'react';
import { Category } from '@shared/schema';
import TaskInput from './TaskInput';

interface TaskCardProps {
  category: Category;
  onTaskUpdate: (taskId: string, value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  category, 
  onTaskUpdate, 
  isExpenseCard = false 
}) => {
  // Простой расчёт прогресса для чекбоксов
  const progress = React.useMemo(() => {
    const completed = category.tasks.filter(t => t.completed).length;
    return category.tasks.length > 0 ? (completed / category.tasks.length) * 100 : 0;
  }, [category.tasks]);

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{category.emoji}</span>
            <span className="text-base font-medium text-gray-200">
              {category.name}
            </span>
          </div>
          {!isExpenseCard && (
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {category.tasks.map((task) => (
          <div key={task.id} className="p-4 flex items-center">
            {!isExpenseCard && (
              <div className="w-1/2 text-gray-400">{task.name}</div>
            )}
            <div className={isExpenseCard ? "w-full" : "w-1/2"}>
              <TaskInput
                task={task}
                onChange={(value) => onTaskUpdate(task.id, value)}
                isExpenseCard={isExpenseCard}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskCard;