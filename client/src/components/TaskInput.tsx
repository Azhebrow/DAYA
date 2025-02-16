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
  categoryColor: string;
}

const TaskInput = React.memo(({ task, onChange, isExpenseCard = false, categoryColor }: TaskInputProps) => {
  const handleChange = useCallback((value: number | boolean | string) => {
    onChange(value);
  }, [onChange]);

  const getButtonStyle = (completed: boolean) => ({
    width: '100%',
    height: '2.25rem',
    fontSize: '1rem',
    backgroundColor: completed ? categoryColor : 'rgb(39 39 42)',
    color: completed ? 'white' : 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  });

  const getSelectStyle = (value: number) => ({
    width: '100%',
    height: '2.25rem',
    backgroundColor: value > 0 ? categoryColor : 'rgb(39 39 42)',
    color: value > 0 ? 'white' : 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    fontWeight: 'bold',
  });

  if (task.type === TaskType.CHECKBOX) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleChange(!task.completed)}
        style={getButtonStyle(Boolean(task.completed))}
      >
        {task.completed ? 'Выполнено' : 'Отметить'}
      </Button>
    );
  }

  if (task.type === TaskType.TIME) {
    const value = task.value || 0;
    return (
      <Select
        value={value > 0 ? String(value) : undefined}
        onValueChange={(newValue) => handleChange(parseInt(newValue) || 0)}
      >
        <SelectTrigger style={getSelectStyle(value)}>
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
        value={value > 0 ? String(value) : undefined}
        onValueChange={(newValue) => handleChange(parseInt(newValue) || 0)}
      >
        <SelectTrigger style={getSelectStyle(value)}>
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

  if (task.type === TaskType.EXPENSE) {
    const value = task.value || 0;
    return (
      <div className="relative w-full">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          style={{
            width: '100%',
            height: '2.25rem',
            backgroundColor: value > 0 ? categoryColor : 'rgb(39 39 42)',
            color: value > 0 ? 'white' : 'rgba(255, 255, 255, 0.6)',
            border: 'none',
            paddingLeft: '2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
          placeholder="0"
        />
        <span style={{
          position: 'absolute',
          left: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: value > 0 ? 'white' : 'rgba(255, 255, 255, 0.6)'
        }}>
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
        className="w-full h-9 bg-zinc-800 border-0 text-base text-white/90 font-medium"
        placeholder="Описание..."
        maxLength={255}
      />
    );
  }

  return null;
});

TaskInput.displayName = 'TaskInput';

export default TaskInput;