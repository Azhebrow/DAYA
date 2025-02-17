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

  const getInputStyle = (hasValue: boolean) => ({
    width: '100%',
    height: '2.25rem',
    backgroundColor: hasValue ? categoryColor : 'rgb(39 39 42)',
    color: hasValue ? 'white' : 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    textAlign: 'center' as const,
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
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
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    const hasValue = value > 0; 

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Math.min(9, Math.max(0, parseInt(e.target.value) || 0));
      const totalMinutes = numValue * 60 + minutes;
      handleChange(totalMinutes);
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMinutes = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
      const totalMinutes = hours * 60 + newMinutes;
      handleChange(totalMinutes);
    };

    const inputStyle = {
      backgroundColor: hasValue ? categoryColor : 'rgb(39 39 42)',
      color: hasValue ? 'white' : 'rgba(255, 255, 255, 0.6)',
      fontSize: '1rem',
      fontWeight: 'bold',
      transition: 'all 0.2s',
    };

    return (
      <div className="flex gap-2 w-full">
        <div className="flex-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={hours > 0 ? `${hours}ч` : ''}
            onChange={(e) => {
              const numValue = parseInt(e.target.value.replace(/\D/g, ''));
              handleHoursChange({ target: { value: String(numValue) } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className="w-full h-9 text-center bg-zinc-800 border-0"
            placeholder="0ч"
            style={inputStyle}
          />
        </div>
        <div className="flex-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={minutes > 0 ? `${minutes}м` : ''}
            onChange={(e) => {
              const numValue = parseInt(e.target.value.replace(/\D/g, ''));
              handleMinutesChange({ target: { value: String(numValue) } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className="w-full h-9 text-center bg-zinc-800 border-0"
            placeholder="0м"
            style={inputStyle}
          />
        </div>
      </div>
    );
  }

  if (task.type === TaskType.CALORIE) {
    const value = task.value || 0;
    return (
      <Select
        value={String(value)}
        onValueChange={(value) => handleChange(parseInt(value))}
      >
        <SelectTrigger style={getInputStyle(value > 0)}>
          <SelectValue placeholder="Калории" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 19 }, (_, i) => ({
            value: (i + 1) * 200,
            label: `${(i + 1) * 200} ккал`
          })).map((option) => (
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
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value > 0 ? `${value}zł` : ''}
        onChange={(e) => {
          const numValue = parseInt(e.target.value.replace(/\D/g, ''));
          handleChange(numValue || 0);
        }}
        style={getInputStyle(value > 0)}
        placeholder="0zł"
        className="text-center"
      />
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