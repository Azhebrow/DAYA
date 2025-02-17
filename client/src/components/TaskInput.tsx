import React, { useCallback } from 'react';
import { Task, TaskType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    backgroundColor: value > 0 ? `var(${categoryColor})` : 'rgb(39 39 42)',
    color: value > 0 ? 'white' : 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    fontWeight: 'bold',
    padding: '0 1rem',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1.2em',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  });

  const getInputStyle = (hasValue: boolean) => ({
    width: '100%',
    height: '2.25rem',
    backgroundColor: hasValue ? `var(${categoryColor})` : 'rgb(39 39 42)',
    color: hasValue ? 'white' : 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    paddingLeft: '2rem',
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
    return (
      <select
        value={value}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        style={getSelectStyle(value)}
        className="focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        <option value="0">Время</option>
        {TIME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (task.type === TaskType.CALORIE) {
    const value = task.value || 0;
    return (
      <select
        value={value}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        style={getSelectStyle(value)}
        className="focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        <option value="0">Калории</option>
        {CALORIE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
          left: '0.5rem',
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