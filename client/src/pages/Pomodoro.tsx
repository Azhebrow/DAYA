import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, Play, Pause, RotateCcw, Save, Bell, Settings2, History, Plus } from 'lucide-react';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskType } from '@shared/schema';

interface TimerState {
  timeLeft: number;
  breakTimeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  currentTask: string;
  totalTimeTracked: number;
  startTime?: number;
}

interface TimerPreset {
  id: string;
  name: string;
  workTime: number;
  breakTime: number;
}

interface PomodoroSession {
  id: string;
  date: string;
  taskType: string;
  duration: number;
  wasCompleted: boolean;
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: 'classic', name: 'Классический', workTime: 25, breakTime: 5 },
  { id: 'long', name: 'Длинный', workTime: 50, breakTime: 10 },
  { id: 'ultralong', name: 'Ультра', workTime: 90, breakTime: 15 },
];

const STORAGE_KEY = 'pomodoro_state';
const PRESETS_KEY = 'pomodoro_presets';
const SESSIONS_KEY = 'pomodoro_sessions';

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
      breakTimeLeft: 5 * 60,
      isRunning: false,
      isBreak: false,
      currentTask: 'work',
      totalTimeTracked: 0,
      startTime: undefined
    };
  });

  const [presets, setPresets] = useState<TimerPreset[]>(() => {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PRESETS;
  });

  const [sessions, setSessions] = useState<PomodoroSession[]>(() => {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('classic');
  const [newPreset, setNewPreset] = useState<TimerPreset>({
    id: '',
    name: '',
    workTime: 25,
    breakTime: 5
  });

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...timerState,
      startTime: timerState.isRunning ? Date.now() : undefined
    }));
  }, [timerState]);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && (timerState.timeLeft > 0 || timerState.breakTimeLeft > 0)) {
      interval = setInterval(() => {
        setTimerState(prev => {
          if (prev.isBreak) {
            if (prev.breakTimeLeft <= 1) {
              playNotificationSound();
              toast({
                title: "Перерыв закончен!",
                description: "Пора возвращаться к работе.",
              });
              return {
                ...prev,
                isRunning: false,
                isBreak: false,
                breakTimeLeft: getSelectedPreset().breakTime * 60,
              };
            }
            return {
              ...prev,
              breakTimeLeft: prev.breakTimeLeft - 1
            };
          } else {
            if (prev.timeLeft <= 1) {
              playNotificationSound();
              addSession({
                id: Date.now().toString(),
                date: format(new Date(), 'yyyy-MM-dd'),
                taskType: prev.currentTask,
                duration: getSelectedPreset().workTime,
                wasCompleted: true
              });
              toast({
                title: "Помодоро завершено!",
                description: "Время сделать перерыв.",
              });
              return {
                ...prev,
                isRunning: false,
                isBreak: true,
                timeLeft: getSelectedPreset().workTime * 60,
                totalTimeTracked: prev.totalTimeTracked + 1
              };
            }
            return {
              ...prev,
              timeLeft: prev.timeLeft - 1,
              totalTimeTracked: prev.totalTimeTracked + 1
            };
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft, timerState.isBreak, timerState.breakTimeLeft]);

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMElOq5O+2bRwGPJba8sZ3KwUlecnw4Y5DChRZrufts3UaCEGY3PLEdygFNInN8tODOQYgbr3u45tHDBBQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMElOq5O+2bRwGPJba8sZ3KwUlecnw4Y5DChRZrufts3UaCEGY3PLEdygFNInN8tODOQYgbr3u45tHDBBQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMElOq5O+2bRwGPJba8sZ3KwUlecnw4Y5DChRZrufts3UaCEGY3PLEdygFNInN8tODOQYgbr3u45tHDBBQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMElOq5O+2bRwGPJba8sZ3KwUlecnw4Y5DChRZrufts3UaCEGY3PLEdygFNInN8tODOQYgbr3u45tHDBBQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMElOq5O+2bRwGPJba8sZ3KwUlecnw4Y5DChRZrufts3UaCEGY3PLEdygFNInN8tODOQYgbr3u45tHDBBQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMElOq5O+2bRwGPJba8sZ3KwUlecnw4Y5DChRZrufts3UaCEGY3PLEdygFNInN8tODOQYgbr3u45tHDBBQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hwFwpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77NqGgc+lt3yw3QnBSl+zPDbikAKFlyx6OqkcRgLRJzf8sFuJAU2jtDy0X81BiNywO7gl0IMAA==');
    audio.play().catch(e => console.log('Ошибка воспроизведения звука:', e));
  };

  const getSelectedPreset = () => {
    return presets.find(p => p.id === selectedPreset) || DEFAULT_PRESETS[0];
  };

  const addSession = (session: PomodoroSession) => {
    setSessions(prev => [session, ...prev]);
  };

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
    const preset = getSelectedPreset();
    setTimerState(prev => ({
      ...prev,
      timeLeft: preset.workTime * 60,
      breakTimeLeft: preset.breakTime * 60,
      isRunning: false,
      isBreak: false,
      startTime: undefined
    }));
  };

  const handleTaskChange = (value: string) => {
    setTimerState(prev => ({
      ...prev,
      currentTask: value
    }));
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = presets.find(p => p.id === value) || DEFAULT_PRESETS[0];
    setTimerState(prev => ({
      ...prev,
      timeLeft: preset.workTime * 60,
      breakTimeLeft: preset.breakTime * 60,
      isRunning: false,
      isBreak: false
    }));
  };

  const handleAddPreset = () => {
    if (newPreset.name && newPreset.workTime > 0 && newPreset.breakTime > 0) {
      const preset = {
        ...newPreset,
        id: Date.now().toString()
      };
      setPresets(prev => [...prev, preset]);
      setNewPreset({
        id: '',
        name: '',
        workTime: 25,
        breakTime: 5
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Таймер
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            История
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  {timerState.isBreak ? 'Перерыв' : 'Помодоро таймер'}
                </div>
                {timerState.isBreak && (
                  <Bell className="w-5 h-5 text-yellow-500 animate-bounce" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedPreset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите пресет" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map(preset => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name} ({preset.workTime}/{preset.breakTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                </div>

                <div className="text-center py-8">
                  <span className="text-6xl font-bold">
                    {timerState.isBreak
                      ? formatTime(timerState.breakTimeLeft)
                      : formatTime(timerState.timeLeft)}
                  </span>
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

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>История сессий</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-800"
                  >
                    <div>
                      <div className="font-medium">
                        {session.taskType === 'work' && '💼 Работа'}
                        {session.taskType === 'study' && '📚 Учёба'}
                        {session.taskType === 'project' && '🎯 Проект'}
                      </div>
                      <div className="text-sm text-gray-400">{session.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{session.duration} мин</div>
                      <div className="text-sm text-gray-400">
                        {session.wasCompleted ? '✅ Завершено' : '❌ Прервано'}
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center text-gray-400">
                    История пуста
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Настройки таймера</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Пресеты</h3>
                  <div className="grid gap-4">
                    {presets.map(preset => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-zinc-800"
                      >
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-sm text-gray-400">
                            Работа: {preset.workTime} мин / Перерыв: {preset.breakTime} мин
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить пресет
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить новый пресет</DialogTitle>
                      <DialogDescription>
                        Создайте новый пресет с собственными настройками времени
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="preset-name">Название</Label>
                        <Input
                          id="preset-name"
                          value={newPreset.name}
                          onChange={e => setNewPreset(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Например: Длинная сессия"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work-time">Время работы (минуты)</Label>
                        <Input
                          id="work-time"
                          type="number"
                          value={newPreset.workTime}
                          onChange={e => setNewPreset(prev => ({ ...prev, workTime: parseInt(e.target.value) || 25 }))}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="break-time">Время перерыва (минуты)</Label>
                        <Input
                          id="break-time"
                          type="number"
                          value={newPreset.breakTime}
                          onChange={e => setNewPreset(prev => ({ ...prev, breakTime: parseInt(e.target.value) || 5 }))}
                          min="1"
                        />
                      </div>
                      <Button onClick={handleAddPreset} className="w-full">
                        Добавить пресет
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}