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

// Обновляем стили для использования цветов
const getButtonStyles = (completed: boolean, categoryColor: string) => `
  w-full h-9 text-base
  ${completed 
    ? `bg-${categoryColor} text-white hover:opacity-90` 
    : 'bg-zinc-800 text-white/60 hover:text-white hover:bg-zinc-700'
  } 
  border-0 font-bold transition-colors duration-200
`;

const getSelectStyles = (value: number, categoryColor: string) => `
  w-full h-9 
  ${value > 0 ? `bg-${categoryColor}` : 'bg-zinc-800'} 
  hover:opacity-90 border-0 font-bold text-center 
  ${value > 0 ? 'text-white' : 'text-white/60'}
`;

const getInputStyles = (hasValue: boolean, categoryColor: string) => `
  w-full h-9 
  ${hasValue ? `bg-${categoryColor}` : 'bg-zinc-800'} 
  border-0 text-left pl-8 text-base font-bold transition-colors
  ${hasValue ? 'text-white' : 'text-white/60'}
  focus:ring-1 focus:ring-${categoryColor} hover:opacity-90
  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
`;

const TaskInput = React.memo(({ task, onChange, isExpenseCard = false, categoryColor = 'zinc-500' }: TaskInputProps) => {
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
        <SelectTrigger 
          className={getSelectStyles(value, categoryColor)}
        >
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
        <SelectTrigger 
          className={getSelectStyles(value, categoryColor)}
        >
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
        variant="ghost"
        size="sm"
        onClick={() => handleChange(!task.completed)}
        className={getButtonStyles(task.completed, categoryColor)}
      >
        {task.completed ? 'Выполнено' : 'Отметить'}
      </Button>
    );
  }

  if (task.type === TaskType.EXPENSE) {
    const hasValue = task.value && task.value > 0;
    return (
      <div className="relative w-full">
        <Input
          type="number"
          value={task.value || ''}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          className={getInputStyles(hasValue, categoryColor)}
          placeholder="0"
        />
        <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold 
          ${hasValue ? 'text-white' : 'text-white/60'}`}>
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
        className={`w-full h-9 bg-zinc-800 border-0 text-base text-white/90 font-medium
          focus:ring-1 focus:ring-${categoryColor}`}
        placeholder="Описание..."
        maxLength={255}
      />
    );
  }

  return null;
});

TaskInput.displayName = 'TaskInput';

export default TaskInput;