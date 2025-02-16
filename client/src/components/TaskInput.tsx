import React from 'react';
import { Task, TaskType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TaskInputProps {
  task: Task;
  onChange: (value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

const TaskInput = ({ task, onChange, isExpenseCard = false }: TaskInputProps) => {
  if (task.type === TaskType.CHECKBOX) {
    return (
      <button 
        onClick={() => onChange(!task.completed)}
        className={`w-full px-4 py-2 rounded ${task.completed ? 'bg-zinc-700' : 'bg-zinc-800'}`}
      >
        {task.completed ? 'Выполнено' : 'Отметить'}
      </button>
    );
  }

  if (task.type === TaskType.TIME) {
    return (
      <input
        type="number"
        min="0"
        max="360"
        step="20"
        value={task.value || ''}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-full px-4 py-2 bg-zinc-800 rounded"
        placeholder="Минуты"
      />
    );
  }

  if (task.type === TaskType.CALORIE) {
    return (
      <input
        type="number"
        min="0"
        max="3800"
        step="200"
        value={task.value || ''}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-full px-4 py-2 bg-zinc-800 rounded"
        placeholder="Калории"
      />
    );
  }

  if (task.type === TaskType.EXPENSE) {
    return (
      <div className="relative">
        <input
          type="number"
          min="0"
          value={task.value || ''}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full pl-8 pr-4 py-2 bg-zinc-800 rounded"
          placeholder="0"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2">zł</span>
      </div>
    );
  }

  if (task.type === TaskType.EXPENSE_NOTE) {
    return (
      <input
        type="text"
        value={task.textValue || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-zinc-800 rounded"
        placeholder="Описание..."
        maxLength={255}
      />
    );
  }

  return null;
};

export default TaskInput;