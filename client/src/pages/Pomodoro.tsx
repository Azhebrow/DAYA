import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Play, Pause, RotateCcw, Save, Settings2, Volume2, VolumeX, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TaskType, PomodoroPhase } from '@shared/schema';
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

interface PomodoroSession {
  id: number;
  date: string;
  duration: number;
  type: PomodoroPhase;
  task: string;
}

interface SessionHistory extends PomodoroSession {}


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

  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingSession, setEditingSession] = useState<PomodoroSession | null>(null);


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
    const loadHistory = async () => {
      const sessions = await storage.getPomodoroSessions(format(selectedDate, 'yyyy-MM-dd'));
      setHistory(sessions);
    }
    loadHistory();
  }, [selectedDate]);

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
    const newSession: PomodoroSession = {
      id: Date.now(), //Simple ID generation, replace with a proper ID generation if needed.
      date: new Date().toISOString(),
      duration: timerState.currentPhase === 'work' ? settings.workDuration :
        (timerState.currentPhase === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration),
      type: timerState.currentPhase,
      task: timerState.currentTask
    };
    storage.savePomodoroSession(newSession);

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

  const handleEditSession = (session: PomodoroSession) => {
    setEditingSession(session);
  };

  const handleUpdateSession = async () => {
    if (!editingSession?.id) return;

    await storage.updatePomodoroSession(editingSession.id, editingSession);
    setEditingSession(null);
    // Обновляем историю
    const sessions = await storage.getPomodoroSessions(format(selectedDate, 'yyyy-MM-dd'));
    setHistory(sessions);
  };

  const handleDeleteSession = async (id: number) => {
    await storage.deletePomodoroSession(id);
    // Обновляем историю
    const sessions = await storage.getPomodoroSessions(format(selectedDate, 'yyyy-MM-dd'));
    setHistory(sessions);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="timer">
          <Card>
            <CardHeader className="relative">
              <div className="absolute right-4 top-4 flex items-center gap-2">
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
                      <SheetTitle>Timer Settings</SheetTitle>
                      <SheetDescription>
                        Customize your work and break durations
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
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getPhaseColor()}`} />
                {timerState.currentPhase === 'work' ? 'Work Time' :
                  timerState.currentPhase === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <Select value={timerState.currentTask} onValueChange={handleTaskChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">💼 Work</SelectItem>
                    <SelectItem value="study">📚 Study</SelectItem>
                    <SelectItem value="project">🎯 Project</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl font-bold font-mono">
                      {formatTime(timerState.timeLeft)}
                    </span>
                  </div>
                  <svg className="w-full h-64" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - calculateProgress() / 100)}`}
                      className={`${getPhaseColor()} transition-all duration-1000`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>

                <div className="text-center text-sm text-gray-500">
                  Session {timerState.completedSessions + 1} of {settings.sessionsUntilLongBreak}
                </div>

                <div className="flex justify-center gap-4">
                  {!timerState.isRunning ? (
                    <Button onClick={handleStart} size="lg" className="w-32">
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={handlePause} size="lg" variant="secondary" className="w-32">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={handleReset} size="lg" variant="outline" className="w-32">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {timerState.totalTimeTracked > 0 && (
                  <Button onClick={saveTimeToTracker} className="w-full" variant="default">
                    <Save className="w-4 h-4 mr-2" />
                    Save {Math.round(timerState.totalTimeTracked / 60)} minutes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(session.date), 'dd.MM.yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            session.type === 'work' ? 'bg-red-500' :
                              session.type === 'shortBreak' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          {session.type === 'work' ? 'Work' :
                            session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.task === 'work' ? '💼 Work' :
                          session.task === 'study' ? '📚 Study' : '🎯 Project'}
                      </TableCell>
                      <TableCell>{session.duration} min</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Session</DialogTitle>
                                <DialogDescription>
                                  Update the session details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="duration" className="text-right">
                                    Duration (min)
                                  </Label>
                                  <Input
                                    id="duration"
                                    type="number"
                                    value={editingSession?.duration || session.duration}
                                    onChange={(e) => setEditingSession(prev => ({
                                      ...session,
                                      duration: parseInt(e.target.value)
                                    }))}
                                    className="col-span-3"
                                  />
                                </div>
                                {/* Add more fields as needed */}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setEditingSession(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateSession}>
                                  Save Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => session.id && handleDeleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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