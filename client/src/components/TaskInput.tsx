import React from 'react';
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

const TaskInput = ({ task, onChange, isExpenseCard = false, categoryColor }: TaskInputProps) => {
  // Checkbox component
  if (task.type === TaskType.CHECKBOX) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(!task.completed)}
        className={`w-full h-9 font-bold transition-all ${
          task.completed 
            ? 'text-white' 
            : 'text-white/60 hover:text-white/80'
        }`}
        style={{
          backgroundColor: task.completed ? categoryColor : 'rgb(39 39 42)',
        }}
      >
        {task.completed ? 'Выполнено' : 'Отметить'}
      </Button>
    );
  }

  // Time select component
  if (task.type === TaskType.TIME) {
    return (
      <Select
        defaultValue="0"
        value={String(task.value || 0)}
        onValueChange={(newValue) => onChange(Number(newValue))}
      >
        <SelectTrigger 
          className={`w-full h-9 font-bold border-0 transition-all ${
            task.value 
              ? 'text-white' 
              : 'text-white/60 hover:text-white/80'
          }`}
          style={{
            backgroundColor: task.value ? categoryColor : 'rgb(39 39 42)',
          }}
        >
          <SelectValue placeholder="Время" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Не выбрано</SelectItem>
          {TIME_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={String(option.value)}
              className="cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Calorie select component
  if (task.type === TaskType.CALORIE) {
    return (
      <Select
        defaultValue="0"
        value={String(task.value || 0)}
        onValueChange={(newValue) => onChange(Number(newValue))}
      >
        <SelectTrigger 
          className={`w-full h-9 font-bold border-0 transition-all ${
            task.value 
              ? 'text-white' 
              : 'text-white/60 hover:text-white/80'
          }`}
          style={{
            backgroundColor: task.value ? categoryColor : 'rgb(39 39 42)',
          }}
        >
          <SelectValue placeholder="Калории" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Не выбрано</SelectItem>
          {CALORIE_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={String(option.value)}
              className="cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Expense input component
  if (task.type === TaskType.EXPENSE) {
    return (
      <div className="relative w-full">
        <Input
          type="number"
          value={task.value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full h-9 pl-8 font-bold border-0 transition-all ${
            task.value 
              ? 'text-white' 
              : 'text-white/60'
          }`}
          style={{
            backgroundColor: task.value ? categoryColor : 'rgb(39 39 42)',
          }}
          placeholder="0"
        />
        <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold ${
          task.value 
            ? 'text-white' 
            : 'text-white/60'
        }`}>
          zł
        </span>
      </div>
    );
  }

  // Expense note input component
  if (task.type === TaskType.EXPENSE_NOTE) {
    return (
      <Input
        type="text"
        value={task.textValue || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 bg-zinc-800 border-0 text-base text-white/90 font-medium"
        placeholder="Описание..."
        maxLength={255}
      />
    );
  }

  return null;
};

export default TaskInput;