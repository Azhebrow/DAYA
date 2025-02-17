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
    textAlign: 'center',
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

    // Создаем строку формата для отображения (например, "2ч 30мин")
    const displayValue = `${hours ? hours + 'ч ' : ''}${minutes ? minutes + 'мин' : (hours ? '' : '0мин')}`;

    const handleTimeClick = (e: React.MouseEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      input.select();
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Улучшенное регулярное выражение для парсинга часов и минут
      const matches = input.match(/(\d+)\s*ч?\s*(\d{0,2})\s*м?и?н?/);
      if (matches) {
        const hours = parseInt(matches[1]) || 0;
        const minutes = parseInt(matches[2] || '0');
        // Проверяем, что минуты не превышают 59
        const validMinutes = Math.min(minutes, 59);
        const totalMinutes = hours * 60 + validMinutes;
        handleChange(totalMinutes);
      }
    };

    return (
      <Input
        type="text"
        value={displayValue}
        onChange={handleTimeChange}
        onClick={handleTimeClick}
        style={getInputStyle(value > 0)}
        placeholder="0мин"
      />
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