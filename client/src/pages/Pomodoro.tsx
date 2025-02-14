import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Play, Pause, RotateCcw, Save } from 'lucide-react';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TaskType } from '@shared/schema';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  currentTask: string;
  totalTimeTracked: number;
  startTime?: number;
}

const STORAGE_KEY = 'pomodoro_state';

export default function Pomodoro() {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Если таймер был запущен при закрытии страницы, восстанавливаем время с учетом прошедшего
      if (parsed.isRunning && parsed.startTime) {
        const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
        const newTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
        return {
          ...parsed,
          timeLeft: newTimeLeft,
          totalTimeTracked: parsed.totalTimeTracked + elapsed
        };
      }
      return parsed;
    }
    return {
      timeLeft: 25 * 60,
      isRunning: false,
      currentTask: 'work',
      totalTimeTracked: 0,
      startTime: undefined
    };
  });
  const { toast } = useToast();

  // Сохранение состояния в localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...timerState,
      startTime: timerState.isRunning ? Date.now() : undefined
    }));
  }, [timerState]);

  // Форматирование времени в мм:сс
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Эффект для управления таймером
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
          totalTimeTracked: prev.totalTimeTracked + 1
        }));
      }, 1000);
    } else if (timerState.timeLeft === 0 && timerState.isRunning) {
      // Если время вышло, показываем уведомление
      toast({
        title: "Время вышло!",
        description: "Сессия помодоро завершена.",
      });
      setTimerState(prev => ({ ...prev, isRunning: false }));
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft]);

  // Сохранение времени в трекер дня
  const saveTimeToTracker = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const entry = storage.getDayEntry(today);

    if (entry) {
      const timeCategory = entry.categories.find(c => c.name === 'Время');
      if (timeCategory) {
        const task = timeCategory.tasks.find(t => {
          if (timerState.currentTask === 'work') return t.name === '💼 Работа';
          if (timerState.currentTask === 'study') return t.name === '📚 Учёба';
          if (timerState.currentTask === 'project') return t.name === '🎯 Проект';
          return false;
        });

        if (task) {
          const updatedCategories = entry.categories.map(category => {
            if (category.name === 'Время') {
              return {
                ...category,
                tasks: category.tasks.map(t => {
                  if (t.id === task.id) {
                    return {
                      ...t,
                      value: (t.value || 0) + Math.round(timerState.totalTimeTracked / 60)
                    };
                  }
                  return t;
                })
              };
            }
            return category;
          });

          const updatedEntry = {
            ...entry,
            categories: updatedCategories
          };

          storage.saveDayEntry(updatedEntry);
          toast({
            title: "Сохранено",
            description: `Добавлено ${Math.round(timerState.totalTimeTracked / 60)} минут к задаче ${task.name}`,
          });

          // Сброс накопленного времени после сохранения
          setTimerState(prev => ({ ...prev, totalTimeTracked: 0 }));
        }
      }
    }
  };

  const handleStart = () => {
    setTimerState(prev => ({ 
      ...prev, 
      isRunning: true,
      startTime: Date.now()
    }));
  };

  const handlePause = () => {
    setTimerState(prev => ({ 
      ...prev, 
      isRunning: false,
      startTime: undefined
    }));
  };

  const handleReset = () => {
    setTimerState(prev => ({
      ...prev,
      timeLeft: 25 * 60,
      isRunning: false,
      startTime: undefined
    }));
  };

  const handleTaskChange = (value: string) => {
    setTimerState(prev => ({
      ...prev,
      currentTask: value
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Помодоро таймер
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={timerState.currentTask} onValueChange={handleTaskChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите задачу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">💼 Работа</SelectItem>
                <SelectItem value="study">📚 Учёба</SelectItem>
                <SelectItem value="project">🎯 Проект</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-center py-8">
              <span className="text-6xl font-bold">{formatTime(timerState.timeLeft)}</span>
            </div>

            <div className="flex justify-center gap-2">
              {!timerState.isRunning ? (
                <Button onClick={handleStart} className="w-24">
                  <Play className="w-4 h-4 mr-2" />
                  Старт
                </Button>
              ) : (
                <Button onClick={handlePause} className="w-24" variant="secondary">
                  <Pause className="w-4 h-4 mr-2" />
                  Пауза
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" className="w-24">
                <RotateCcw className="w-4 h-4 mr-2" />
                Сброс
              </Button>
            </div>

            {timerState.totalTimeTracked > 0 && (
              <div className="mt-4">
                <Button onClick={saveTimeToTracker} className="w-full" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить {Math.round(timerState.totalTimeTracked / 60)} минут
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}