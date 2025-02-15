import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, Play, Pause, RotateCcw, Coffee } from 'lucide-react';

interface PomodoroTimerProps {
  onComplete?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onComplete }) => {
  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const BREAK_TIME = 5 * 60; // 5 minutes in seconds

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [progress, setProgress] = useState(100);

  const totalTime = isBreak ? BREAK_TIME : WORK_TIME;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setProgress((newTime / totalTime) * 100);
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // Period completed
      if (onComplete) {
        onComplete();
      }
      // Switch between work and break
      setIsBreak((prev) => !prev);
      setTimeLeft(isBreak ? WORK_TIME : BREAK_TIME);
      setProgress(100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, isBreak, totalTime, onComplete]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
    setProgress(100);
  }, [WORK_TIME]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-zinc-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <Coffee className="h-5 w-5 text-orange-500" />
          ) : (
            <Timer className="h-5 w-5 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {isBreak ? 'Перерыв' : 'Фокус'}
          </span>
        </div>
        <span className="text-2xl font-bold font-mono">
          {formatTime(timeLeft)}
        </span>
      </div>

      <Progress 
        value={progress} 
        className="h-2 mb-4"
        indicatorClassName={isBreak ? 'bg-orange-500' : 'bg-green-500'}
      />

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTimer}
          className="w-24"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Пауза
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Старт
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetTimer}
          className="w-24"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Сброс
        </Button>
      </div>
    </div>
  );
};
