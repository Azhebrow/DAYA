import React, { useCallback } from 'react';
import { Task, TaskType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Constants
const TIME_OPTIONS = Array.from({ length: 19 }, (_, i) => ({
  value: (i + 1) * 20,
  label: `${Math.floor((i + 1) * 20 / 60) > 0 ? Math.floor((i + 1) * 20 / 60) + ' ч ' : ''}${(i + 1) * 20 % 60 > 0 ? (i + 1) * 20 % 60 + ' мин' : ''}`
}));

const CALORIE_OPTIONS = Array.from({ length: 19 }, (_, i) => ({
  value: (i + 1) * 200,
  label: `${(i + 1) * 200} ккал`
}));

interface TaskInputProps {
  task: Task;
  onChange: (value: number | boolean | string) => void;
  isExpenseCard?: boolean;
  categoryName?: string;
}

const TaskInput = React.memo(({ task, onChange, isExpenseCard = false, categoryName }: TaskInputProps) => {
  const handleChange = useCallback((value: number | boolean | string) => {
    onChange(value);
  }, [onChange]);

  const renderInput = () => {
    if (task.type === TaskType.TIME) {
      return (
        <Select
          value={String(task.value || 0)}
          onValueChange={(value) => handleChange(parseInt(value))}
        >
          <SelectTrigger className="h-8 w-full bg-zinc-800 hover:bg-zinc-700 border-gray-700">
            <SelectValue placeholder="Время" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (task.type === TaskType.CALORIE) {
      return (
        <Select
          value={String(task.value || 0)}
          onValueChange={(value) => handleChange(parseInt(value))}
        >
          <SelectTrigger className="h-8 w-full bg-zinc-800 hover:bg-zinc-700 border-gray-700">
            <SelectValue placeholder="Калории" />
          </SelectTrigger>
          <SelectContent>
            {CALORIE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (task.type === TaskType.CHECKBOX) {
      return (
        <Button
          variant={task.completed ? "default" : "outline"}
          size="sm"
          onClick={() => handleChange(!task.completed)}
          className={`w-full h-8 ${
            task.completed ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-800 hover:bg-zinc-700'
          } border-gray-700`}
        >
          <span className="text-sm text-gray-300">
            {task.completed ? 'Выполнено' : 'Отметить'}
          </span>
        </Button>
      );
    }

    if (task.type === TaskType.EXPENSE) {
      return (
        <div className="relative w-full">
          <Input
            type="number"
            value={task.value || ''}
            onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
            className="w-full h-8 bg-zinc-800 border-gray-700 pr-8 text-right"
            placeholder="0"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            zł
          </span>
        </div>
      );
    }

    if (task.type === TaskType.EXPENSE_NOTE) {
      return (
        <Input
          type="text"
          value={task.textValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-8 bg-zinc-800 border-gray-700"
          placeholder="Описание..."
          maxLength={255}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-1">
      {!isExpenseCard && (
        <span className="text-xs text-gray-400 mb-1">{task.name}</span>
      )}
      {renderInput()}
    </div>
  );
});

TaskInput.displayName = 'TaskInput';

export default TaskInput;