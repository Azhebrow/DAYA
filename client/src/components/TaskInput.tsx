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
  categoryColor?: string;
}

const TaskInput = React.memo(({ task, onChange, isExpenseCard = false, categoryName, categoryColor }: TaskInputProps) => {
  const handleChange = useCallback((value: number | boolean | string) => {
    onChange(value);
  }, [onChange]);

  if (task.type === TaskType.EXPENSE) {
    return (
      <div className={`relative ${isExpenseCard ? 'w-full' : 'w-[180px]'}`}>
        <Input
          type="number"
          value={task.value || ''}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          className={`w-full h-10 ${task.value ? 'bg-orange-500 text-white' : 'bg-zinc-800/50'} 
            border-0 text-right pr-8 text-base font-medium transition-colors
            focus:ring-1 focus:ring-primary/30 focus:bg-orange-500
            placeholder:text-gray-500 hover:bg-orange-500 hover:text-white
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          placeholder="0"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <span className={`text-sm font-medium ${task.value ? 'text-white' : 'text-gray-400'}`}>zł</span>
        </div>
      </div>
    );
  }

  if (task.type === TaskType.EXPENSE_NOTE) {
    return (
      <div className="w-full">
        <Input
          type="text"
          value={task.textValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full h-10 bg-zinc-800/50 border-0 
            text-base font-medium transition-colors
            focus:ring-1 focus:ring-primary/30 focus:bg-zinc-800/80
            placeholder:text-gray-500 hover:bg-zinc-800/80`}
          placeholder="Введите описание..."
          maxLength={255}
        />
      </div>
    );
  }

  if (task.type === TaskType.CHECKBOX) {
    return (
      <div className="flex items-center justify-between px-4">
        <span className="text-sm font-medium text-gray-300">{task.name}</span>
        <Button
          variant={task.completed ? "default" : "outline"}
          size="sm"
          onClick={() => handleChange(!task.completed)}
          className={`w-[180px] h-8 ${task.completed ? categoryColor : 'bg-zinc-800 hover:bg-zinc-700'} border-gray-700`}
        >
          <span className="text-sm text-white font-medium">
            {task.completed ? 'Выполнено' : 'Отметить'}
          </span>
        </Button>
      </div>
    );
  }

  if (task.type === TaskType.TIME) {
    return (
      <div className="flex items-center justify-between px-4">
        <span className="text-sm font-medium text-gray-300">{task.name}</span>
        <Select
          value={String(task.value || 0)}
          onValueChange={(value) => handleChange(parseInt(value))}
        >
          <SelectTrigger
            className={`w-[180px] h-8 ${task.value ? categoryColor : 'bg-zinc-800'} hover:bg-zinc-700 border-gray-700`}
          >
            <SelectValue placeholder="Выберите время" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (task.type === TaskType.CALORIE) {
    return (
      <div className="flex items-center justify-between px-4">
        <span className="text-sm font-medium text-gray-300">{task.name}</span>
        <Select
          value={String(task.value || 0)}
          onValueChange={(value) => handleChange(parseInt(value))}
        >
          <SelectTrigger
            className={`w-[180px] h-8 ${task.value ? categoryColor : 'bg-zinc-800'} hover:bg-zinc-700 border-gray-700`}
          >
            <SelectValue placeholder="Выберите калории" />
          </SelectTrigger>
          <SelectContent>
            {CALORIE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
});

TaskInput.displayName = 'TaskInput';

export default TaskInput;