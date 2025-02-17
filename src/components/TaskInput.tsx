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

// Checkbox Task Component
const CheckboxTask = React.memo(({ task, onChange }: { task: Task; onChange: (value: boolean) => void }) => (
  <div className="flex items-center justify-between px-4">
    <span className="text-sm text-gray-300">{task.name}</span>
    <Button
      variant={task.completed ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(!task.completed)}
      className={`w-[180px] h-8 ${task.completed ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-800 hover:bg-zinc-700'} border-gray-700`}
    >
      <span className="text-sm text-gray-300">Выполнено</span>
    </Button>
  </div>
));

// Time Task Component
const TimeTask = React.memo(({ task, onChange }: { task: Task; onChange: (value: number) => void }) => (
  <div className="flex items-center justify-between px-4">
    <span className="text-sm text-gray-300">{task.name}</span>
    <Select
      value={String(task.value || 0)}
      onValueChange={(value) => onChange(parseInt(value))}
    >
      <SelectTrigger className="w-[180px] h-8 bg-zinc-800 hover:bg-zinc-700 border-gray-700">
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
));

// Calorie Task Component
const CalorieTask = React.memo(({ task, onChange }: { task: Task; onChange: (value: number) => void }) => (
  <div className="flex items-center justify-between px-4">
    <span className="text-sm text-gray-300">{task.name}</span>
    <Select
      value={String(task.value || 0)}
      onValueChange={(value) => onChange(parseInt(value))}
    >
      <SelectTrigger className="w-[180px] h-8 bg-zinc-800 hover:bg-zinc-700 border-gray-700">
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
));

// Expense Task Component
const ExpenseTask = React.memo(({ task, onChange, isExpenseCard = false }: { 
  task: Task; 
  onChange: (value: number) => void;
  isExpenseCard?: boolean;
}) => (
  <div className="flex items-center justify-between px-4">
    {!isExpenseCard && <span className="text-sm text-gray-300">{task.name}</span>}
    <div className={`relative ${isExpenseCard ? 'w-full' : 'w-[180px]'}`}>
      <Input
        type="number"
        value={task.value || 0}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full h-8 bg-zinc-800 border-gray-700 px-2 pr-8 text-right focus:outline-none focus:ring-0"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        zł
      </span>
    </div>
  </div>
));

// Expense Note Task Component
const ExpenseNoteTask = React.memo(({ task, onChange, isExpenseCard = false }: {
  task: Task;
  onChange: (value: string) => void;
  isExpenseCard?: boolean;
}) => (
  <div className="flex items-center justify-between px-4">
    {!isExpenseCard && <span className="text-sm text-gray-300">{task.name}</span>}
    <Input
      type="text"
      value={task.textValue || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 bg-zinc-800 border-gray-700 px-2 focus:outline-none focus:ring-0 ${isExpenseCard ? 'w-full' : 'w-[180px]'}`}
      placeholder="Введите описание..."
      maxLength={255}
    />
  </div>
));

interface TaskInputProps {
  task: Task;
  onChange: (value: number | boolean | string) => void;
  isExpenseCard?: boolean;
}

const TaskInput = React.memo(({ task, onChange, isExpenseCard = false }: TaskInputProps) => {
  const handleChange = useCallback((value: number | boolean | string) => {
    onChange(value);
  }, [onChange]);

  switch (task.type) {
    case TaskType.CHECKBOX:
      return <CheckboxTask task={task} onChange={handleChange as (value: boolean) => void} />;
    case TaskType.TIME:
      return <TimeTask task={task} onChange={handleChange as (value: number) => void} />;
    case TaskType.CALORIE:
      return <CalorieTask task={task} onChange={handleChange as (value: number) => void} />;
    case TaskType.EXPENSE:
      return <ExpenseTask task={task} onChange={handleChange as (value: number) => void} isExpenseCard={isExpenseCard} />;
    case TaskType.EXPENSE_NOTE:
      return <ExpenseNoteTask task={task} onChange={handleChange as (value: string) => void} isExpenseCard={isExpenseCard} />;
    default:
      return null;
  }
});

TaskInput.displayName = 'TaskInput';

export default TaskInput;