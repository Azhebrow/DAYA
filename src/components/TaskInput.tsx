import React from 'react';
import { Task, TaskType } from '@shared/schema';

interface TaskInputProps {
  task: Task;
  onChange: (value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

const TaskInput: React.FC<TaskInputProps> = ({ task, onChange, isExpenseCard }) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange(isNaN(value) ? 0 : Math.max(0, value));
  };

  switch (task.type) {
    case TaskType.CHECKBOX:
      return (
        <button
          type="button"
          onClick={() => onChange(!task.completed)}
          className="w-full p-2 text-center rounded bg-zinc-800 hover:bg-zinc-700"
        >
          {task.completed ? 'Выполнено' : 'Отметить'}
        </button>
      );

    case TaskType.TIME:
      return (
        <input
          type="number"
          min="0"
          max="360"
          step="20"
          value={task.value || ''}
          onChange={handleNumberChange}
          className="w-full p-2 rounded bg-zinc-800"
          placeholder="Минуты"
        />
      );

    case TaskType.CALORIE:
      return (
        <input
          type="number"
          min="0"
          max="3800"
          step="200"
          value={task.value || ''}
          onChange={handleNumberChange}
          className="w-full p-2 rounded bg-zinc-800"
          placeholder="Калории"
        />
      );

    case TaskType.EXPENSE:
      return (
        <div className="relative">
          <input
            type="number"
            min="0"
            value={task.value || ''}
            onChange={handleNumberChange}
            className="w-full p-2 pl-8 rounded bg-zinc-800"
            placeholder="0"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2">zł</span>
        </div>
      );

    case TaskType.EXPENSE_NOTE:
      return (
        <input
          type="text"
          value={task.textValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800"
          placeholder="Описание..."
          maxLength={255}
        />
      );

    default:
      return null;
  }
};

export default TaskInput;