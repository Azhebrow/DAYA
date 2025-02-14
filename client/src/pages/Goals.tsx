import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Target, DollarSign, Book, Weight, Video, CodeSquare, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface Goal {
  id: number;
  title: string;
  target: number;
  current: number;
  start?: number;
  unit: string;
  iconName: string;
  color: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  changes: {
    goalId: number;
    previousValue: number;
    newValue: number;
  }[];
}

const getIconByName = (name: string) => {
  switch (name) {
    case 'DollarSign':
      return <DollarSign className="w-6 h-6" />;
    case 'Book':
      return <Book className="w-6 h-6" />;
    case 'Weight':
      return <Weight className="w-6 h-6" />;
    case 'Video':
      return <Video className="w-6 h-6" />;
    case 'CodeSquare':
      return <CodeSquare className="w-6 h-6" />;
    default:
      return <Target className="w-6 h-6" />;
  }
};

const initialGoals: Goal[] = [
  {
    id: 1,
    title: "Накопить",
    target: 5000,
    current: 0,
    unit: "злотых",
    iconName: "DollarSign",
    color: "from-green-500 to-emerald-700"
  },
  {
    id: 2,
    title: "Изучить учебник",
    target: 804,
    current: 0,
    unit: "страниц",
    iconName: "Book",
    color: "from-blue-500 to-indigo-700"
  },
  {
    id: 3,
    title: "Набрать вес",
    target: 82,
    current: 0,
    start: 72,
    unit: "кг",
    iconName: "Weight",
    color: "from-purple-500 to-violet-700"
  },
  {
    id: 4,
    title: "Сделать видео",
    target: 15,
    current: 0,
    unit: "видео",
    iconName: "Video",
    color: "from-red-500 to-rose-700"
  },
  {
    id: 5,
    title: "Заработать на фрилансе",
    target: 1500,
    current: 0,
    unit: "$",
    iconName: "CodeSquare",
    color: "from-yellow-500 to-orange-700"
  }
];

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const stored = localStorage.getItem('goals_data');
    return stored ? JSON.parse(stored) : initialGoals;
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const stored = localStorage.getItem('goals_history');
    return stored ? JSON.parse(stored) : [];
  });

  const [newValues, setNewValues] = useState<{ [key: number]: string }>({});
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // Сохраняем данные целей при их изменении
  useEffect(() => {
    localStorage.setItem('goals_data', JSON.stringify(goals));
  }, [goals]);

  // Сохраняем историю при её изменении
  useEffect(() => {
    localStorage.setItem('goals_history', JSON.stringify(history));
  }, [history]);

  const calculateProgress = (goal: Goal) => {
    if (goal.start !== undefined) {
      const totalRange = goal.target - goal.start;
      const currentProgress = goal.current - goal.start;
      return (currentProgress / totalRange) * 100;
    }
    return (goal.current / goal.target) * 100;
  };

  const calculateTotalProgress = () => {
    return goals.reduce((acc, goal) => acc + calculateProgress(goal), 0) / goals.length;
  };

  const handleInputChange = (goalId: number, value: string) => {
    setNewValues(prev => ({ ...prev, [goalId]: value }));
  };

  const handleUpdate = () => {
    const changes: {
      goalId: number;
      previousValue: number;
      newValue: number;
    }[] = [];

    const updatedGoals = goals.map(goal => {
      const newValue = newValues[goal.id] ? parseFloat(newValues[goal.id]) : goal.current;
      if (newValue !== goal.current) {
        changes.push({
          goalId: goal.id,
          previousValue: goal.current,
          newValue: newValue
        });
      }
      return {
        ...goal,
        current: newValue
      };
    });

    if (changes.length > 0) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('ru-RU'),
        changes
      };
      setHistory(prev => [newEntry, ...prev]);
    }

    setGoals(updatedGoals);
    setNewValues({});
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== entryId));
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Мои Цели</h1>
          <div className="relative h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-xl opacity-20 blur-xl" />
            <div className="relative space-y-2">
              <p className="text-2xl font-semibold">Общий прогресс</p>
              <Progress value={calculateTotalProgress()} className="w-96 h-4" />
              <p className="text-sm text-gray-400">{calculateTotalProgress().toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <Collapsible
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          className="space-y-2"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg bg-black/40 border border-zinc-800 hover:bg-black/60 transition-colors">
            <span className="text-lg font-semibold">Обновить показатели</span>
            {isUpdateOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-6 backdrop-blur-lg bg-black/40 border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => (
                  <div key={`input-${goal.id}`} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${goal.color}`}>
                      {getIconByName(goal.iconName)}
                    </div>
                    <Input
                      type="number"
                      placeholder={`Текущий показатель (${goal.unit})`}
                      value={newValues[goal.id] || ''}
                      onChange={(e) => handleInputChange(goal.id, e.target.value)}
                      className="flex-1"
                      step="0.1"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleUpdate}
                className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Обновить показатели
              </Button>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden p-6 backdrop-blur-lg bg-black/40 border-zinc-800">
                <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-10`} />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${goal.color}`}>
                        {getIconByName(goal.iconName)}
                      </div>
                      <h3 className="text-xl font-semibold">{goal.title}</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {goal.current}/{goal.target}
                      <span className="text-sm ml-1 text-gray-400">{goal.unit}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Progress
                      value={calculateProgress(goal)}
                      className="h-2"
                    />
                    <p className="text-sm text-gray-400 text-right">
                      {calculateProgress(goal).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {history.length > 0 && (
          <Card className="p-6 backdrop-blur-lg bg-black/40 border-zinc-800">
            <h3 className="text-xl font-semibold mb-4">История изменений</h3>
            <div className="space-y-4">
              {history.map((entry) => {
                const changes = entry.changes.map(change => {
                  const goal = goals.find(g => g.id === change.goalId);
                  if (!goal) return null;

                  const difference = change.newValue - change.previousValue;
                  const isPositive = difference > 0;

                  let previousProgress;
                  let newProgress;
                  if (goal.start !== undefined) {
                    const totalRange = goal.target - goal.start;
                    previousProgress = ((change.previousValue - goal.start) / totalRange) * 100;
                    newProgress = ((change.newValue - goal.start) / totalRange) * 100;
                  } else {
                    previousProgress = (change.previousValue / goal.target) * 100;
                    newProgress = (change.newValue / goal.target) * 100;
                  }
                  const progressDifference = newProgress - previousProgress;

                  return {
                    goal,
                    difference,
                    isPositive,
                    progressDifference
                  };
                }).filter(Boolean);

                return (
                  <div key={entry.id} className="relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-medium text-gray-300">{entry.date}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHistoryEntry(entry.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden"
                    >
                      <div className="flex flex-col">
                        {/* Строка с иконками */}
                        <div className="flex items-center justify-around p-4">
                          {changes.map(({ goal }) => (
                            <div
                              key={`icon-${goal.id}`}
                              className={`p-2 rounded-lg bg-gradient-to-br ${goal.color}`}
                            >
                              {getIconByName(goal.iconName)}
                            </div>
                          ))}
                        </div>

                        {/* Строка с процентами изменений */}
                        <div className="grid grid-flow-col auto-cols-fr border-t border-zinc-800">
                          {changes.map(({ progressDifference, isPositive, goal }) => (
                            <div key={`progress-${goal.id}`} className="p-4 flex items-center justify-center">
                              <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {progressDifference > 0 && '+'}{progressDifference.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Строка с абсолютными изменениями */}
                        <div className="grid grid-flow-col auto-cols-fr border-t border-zinc-800">
                          {changes.map(({ difference, isPositive, goal }) => (
                            <div key={`value-${goal.id}`} className="p-4 flex items-center justify-center">
                              <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive && '+'}{difference} {goal.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}