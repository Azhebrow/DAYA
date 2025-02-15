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
  categoryColor?: string;
}

const TaskInput = React.memo(({ task, onChange, isExpenseCard = false, categoryColor = 'bg-primary' }: TaskInputProps) => {
  const handleChange = useCallback((value: number | boolean | string) => {
    onChange(value);
  }, [onChange]);

  if (task.type === TaskType.TIME) {
    const value = task.value || 0;
    return (
      <Select
        value={String(value)}
        onValueChange={(value) => handleChange(parseInt(value))}
      >
        <SelectTrigger className={`w-full h-9 ${value > 0 ? categoryColor : 'bg-zinc-800'} hover:bg-opacity-80 border-gray-700 font-medium text-center`}>
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
    const value = task.value || 0;
    return (
      <Select
        value={String(value)}
        onValueChange={(value) => handleChange(parseInt(value))}
      >
        <SelectTrigger className={`w-full h-9 ${value > 0 ? categoryColor : 'bg-zinc-800'} hover:bg-opacity-80 border-gray-700 font-medium text-center`}>
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
        className={`w-full h-9 text-base font-medium ${
          task.completed ? categoryColor : 'bg-zinc-800'
        } hover:bg-opacity-80 border-gray-700`}
      >
        {task.completed ? 'Выполнено' : 'Отметить'}
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
          className={`w-full h-9 ${task.value ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-white'} 
            border-0 text-center pr-8 text-base font-medium transition-colors
            focus:ring-1 focus:ring-orange-400 hover:bg-opacity-80`}
          placeholder="0"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-black">
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
        className="w-full h-9 bg-zinc-800 border-gray-700 text-base text-center font-medium"
        placeholder="Описание..."
        maxLength={255}
      />
    );
  }

  return null;
});

TaskInput.displayName = 'TaskInput';

export default TaskInput;