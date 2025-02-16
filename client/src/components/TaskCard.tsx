import React from 'react';
import { Category } from '@shared/schema';
import TaskInput from './TaskInput';

interface TaskCardProps {
  category: Category;
  onTaskUpdate: (taskId: string, value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

const TaskCard = ({ category, onTaskUpdate, isExpenseCard = false }: TaskCardProps) => {
  const completedTasks = category.tasks.filter(t => t.completed).length;
  const totalTasks = category.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="bg-zinc-900/50 rounded-lg overflow-hidden">
      <div className="flex items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <span className="text-base font-medium text-gray-200">
            {category.name}
          </span>
        </div>

        {!isExpenseCard && (
          <div className="ml-auto w-24">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        {category.tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center p-4 border-b border-zinc-800 last:border-0"
          >
            {!isExpenseCard && (
              <span className="w-1/2 text-gray-400">
                {task.name}
              </span>
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