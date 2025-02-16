import React, { useCallback } from 'react';
import { Task, TaskType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      <Input
        type="number"
        value={value}
        onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
        style={getInputStyle(value > 0)}
        placeholder="Время (в минутах)"
        min="0"
        step="20"
      />
    );
  }

  if (task.type === TaskType.CALORIE) {
    const value = task.value || 0;
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
        style={getInputStyle(value > 0)}
        placeholder="Калории"
        min="0"
        step="200"
      />
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
          min="0"
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