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
    // Remove spinner buttons
    WebkitAppearance: 'none',
    MozAppearance: 'textfield',
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    }
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

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHours = Math.max(0, parseInt(e.target.value) || 0);
      const totalMinutes = newHours * 60 + minutes;
      handleChange(totalMinutes);
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMinutes = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
      const totalMinutes = hours * 60 + newMinutes;
      handleChange(totalMinutes);
    };

    return (
      <div className="flex items-center justify-center gap-1" style={{ width: '100%' }}>
        <div className="relative" style={{ width: '45%' }}>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm" 
                style={{ color: value > 0 ? 'white' : 'rgba(255, 255, 255, 0.6)' }}>
            ч
          </span>
          <Input
            type="number"
            min="0"
            value={hours || ''}
            onChange={handleHoursChange}
            style={{
              ...getInputStyle(value > 0),
              paddingLeft: '1.5rem' // Add space for the label
            }}
            placeholder="0"
          />
        </div>
        <div className="relative" style={{ width: '45%' }}>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: value > 0 ? 'white' : 'rgba(255, 255, 255, 0.6)' }}>
            мин
          </span>
          <Input
            type="number"
            min="0"
            max="59"
            value={minutes || ''}
            onChange={handleMinutesChange}
            style={{
              ...getInputStyle(value > 0),
              paddingLeft: '2.5rem' // Add more space for "мин" label
            }}
            placeholder="0"
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
    const hasValue = task.value && task.value > 0;
    return (
      <div className="relative w-full">
        <Input
          type="number"
          value={task.value || ''}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          style={getInputStyle(hasValue)}
          placeholder="0"
        />
        <span style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: hasValue ? 'white' : 'rgba(255, 255, 255, 0.6)'
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