import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Play, Pause, RotateCcw, Save, Settings2, Volume2, VolumeX } from 'lucide-react';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TaskType } from '@shared/schema';
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  currentTask: string;
  totalTimeTracked: number;
  startTime?: number;
  currentPhase: 'work' | 'shortBreak' | 'longBreak';
  completedSessions: number;
}

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  soundEnabled: boolean;
}

interface SessionHistory {
  date: string;
  duration: number;
  type: string;
  task: string;
}

const STORAGE_KEY = 'pomodoro_state';
const SETTINGS_KEY = 'pomodoro_settings';
const HISTORY_KEY = 'pomodoro_history';

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  soundEnabled: true
};

export default function Pomodoro() {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
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
      startTime: undefined,
      currentPhase: 'work',
      completedSessions: 0
    };
  });

  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  const [history, setHistory] = useState<SessionHistory[]>(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...timerState,
      startTime: timerState.isRunning ? Date.now() : undefined
    }));
  }, [timerState]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = useCallback(() => {
    if (settings.soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(console.error);
    }
  }, [settings.soundEnabled]);

  const switchPhase = useCallback(() => {
    let nextPhase: 'work' | 'shortBreak' | 'longBreak';
    let nextTimeLeft: number;
    let newCompletedSessions = timerState.completedSessions;

    if (timerState.currentPhase === 'work') {
      newCompletedSessions++;
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        nextPhase = 'longBreak';
        nextTimeLeft = settings.longBreakDuration * 60;
      } else {
        nextPhase = 'shortBreak';
        nextTimeLeft = settings.shortBreakDuration * 60;
      }
    } else {
      nextPhase = 'work';
      nextTimeLeft = settings.workDuration * 60;
    }

    setTimerState(prev => ({
      ...prev,
      timeLeft: nextTimeLeft,
      currentPhase: nextPhase,
      completedSessions: newCompletedSessions,
      isRunning: false
    }));

    // Add to history
    const newSession: SessionHistory = {
      date: new Date().toISOString(),
      duration: timerState.currentPhase === 'work' ? settings.workDuration : 
        (timerState.currentPhase === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration),
      type: timerState.currentPhase,
      task: timerState.currentTask
    };
    setHistory(prev => [newSession, ...prev].slice(0, 100)); // Keep last 100 sessions

    playNotificationSound();
    toast({
      title: "Фаза завершена!",
      description: `Переход к ${nextPhase === 'work' ? 'работе' : 'отдыху'}`,
    });
  }, [timerState, settings, toast, playNotificationSound]);

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
      switchPhase();
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft, switchPhase]);

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
      timeLeft: settings.workDuration * 60,
      isRunning: false,
      startTime: undefined,
      currentPhase: 'work',
      completedSessions: 0
    }));
  };

  const handleTaskChange = (value: string) => {
    setTimerState(prev => ({
      ...prev,
      currentTask: value
    }));
  };

  const handleSettingChange = (key: keyof PomodoroSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const calculateProgress = () => {
    const total = timerState.currentPhase === 'work' 
      ? settings.workDuration * 60 
      : (timerState.currentPhase === 'shortBreak' ? settings.shortBreakDuration * 60 : settings.longBreakDuration * 60);
    return ((total - timerState.timeLeft) / total) * 100;
  };

  const getPhaseColor = () => {
    switch (timerState.currentPhase) {
      case 'work':
        return 'bg-red-500';
      case 'shortBreak':
        return 'bg-green-500';
      case 'longBreak':
        return 'bg-blue-500';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="timer" className="max-w-4xl mx-auto">
        <TabsList className="mb-4">
          <TabsTrigger value="timer">Таймер</TabsTrigger>
          <TabsTrigger value="statistics">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Помодоро таймер - {timerState.currentPhase === 'work' ? 'Работа' : 
                    (timerState.currentPhase === 'shortBreak' ? 'Короткий перерыв' : 'Длинный перерыв')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                  >
                    {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Настройки таймера</SheetTitle>
                        <SheetDescription>
                          Настройте длительность периодов работы и отдыха
                        </SheetDescription>
                      </SheetHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="workDuration" className="text-right">
                            Работа (мин)
                          </Label>
                          <Input
                            id="workDuration"
                            type="number"
                            value={settings.workDuration}
                            onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value))}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="shortBreak" className="text-right">
                            Короткий перерыв
                          </Label>
                          <Input
                            id="shortBreak"
                            type="number"
                            value={settings.shortBreakDuration}
                            onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value))}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="longBreak" className="text-right">
                            Длинный перерыв
                          </Label>
                          <Input
                            id="longBreak"
                            type="number"
                            value={settings.longBreakDuration}
                            onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value))}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sessions" className="text-right">
                            Сессий до перерыва
                          </Label>
                          <Input
                            id="sessions"
                            type="number"
                            value={settings.sessionsUntilLongBreak}
                            onChange={(e) => handleSettingChange('sessionsUntilLongBreak', parseInt(e.target.value))}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
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

                <div className="text-center py-8 space-y-4">
                  <span className="text-6xl font-bold">{formatTime(timerState.timeLeft)}</span>
                  <Progress 
                    value={calculateProgress()} 
                    className={`h-2 ${getPhaseColor()}`} 
                  />
                  <div className="text-sm text-gray-500">
                    Сессия {timerState.completedSessions + 1} из {settings.sessionsUntilLongBreak}
                  </div>
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
        </TabsContent>

        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>История сессий</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Задача</TableHead>
                    <TableHead className="text-right">Длительность</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(session.date), 'dd.MM.yyyy HH:mm')}</TableCell>
                      <TableCell>
                        {session.type === 'work' ? 'Работа' : 
                         session.type === 'shortBreak' ? 'Короткий перерыв' : 'Длинный перерыв'}
                      </TableCell>
                      <TableCell>
                        {session.task === 'work' ? '💼 Работа' :
                         session.task === 'study' ? '📚 Учёба' : '🎯 Проект'}
                      </TableCell>
                      <TableCell className="text-right">{session.duration} мин</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}