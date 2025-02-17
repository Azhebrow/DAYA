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

  if (task.type === TaskType.TIME) {
    const value = task.value || 0;
    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    // Определяем базовые стили для полей ввода
    const baseInputStyles = {
      width: '100%',
      height: '36px',
      backgroundColor: value > 0 ? categoryColor : 'rgb(39 39 42)',
      border: 'none',
      textAlign: 'center' as const,
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      color: value > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
      borderRadius: '6px',
      padding: '0 12px',
      outline: 'none',
    };

    const handleHoursInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Math.min(9, Math.max(0, parseInt(e.target.value.replace(/\D/g, '')) || 0));
      const totalMinutes = numValue * 60 + minutes;
      handleChange(totalMinutes);
    };

    const handleMinutesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMinutes = Math.min(59, Math.max(0, parseInt(e.target.value.replace(/\D/g, '')) || 0));
      const totalMinutes = hours * 60 + newMinutes;
      handleChange(totalMinutes);
    };

    return (
      <div className="flex gap-2 w-full">
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={hours > 0 ? `${hours}ч` : ''}
            onChange={handleHoursInput}
            placeholder="0ч"
            style={baseInputStyles}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={minutes > 0 ? `${minutes}м` : ''}
            onChange={handleMinutesInput}
            placeholder="0м"
            style={baseInputStyles}
          />
        </div>
      </div>
    );
  }

  if (task.type === TaskType.CHECKBOX) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleChange(!task.completed)}
        style={{
          width: '100%',
          height: '36px',
          backgroundColor: task.completed ? categoryColor : 'rgb(39 39 42)',
          color: task.completed ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
          border: 'none',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
      >
        {task.completed ? 'Выполнено' : 'Отметить'}
      </Button>
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
          style={{
            backgroundColor: value > 0 ? categoryColor : 'rgb(39 39 42)',
            color: value > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            border: 'none',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
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
        style={{
          backgroundColor: value > 0 ? categoryColor : 'rgb(39 39 42)',
          color: value > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
          border: 'none',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
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