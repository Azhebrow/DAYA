import { motion } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Target, DollarSign, Book, Weight, Video, CodeSquare } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Goal = {
  id: number;
  title: string;
  target: number;
  current: number;
  unit: string;
  icon: string;
  color: string;
};

const iconComponents: Record<string, React.ReactNode> = {
  "dollar": <DollarSign className="w-6 h-6" />,
  "book": <Book className="w-6 h-6" />,
  "weight": <Weight className="w-6 h-6" />,
  "video": <Video className="w-6 h-6" />,
  "code": <CodeSquare className="w-6 h-6" />
};

export default function Goals() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<string>("");

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, current }: { id: number; current: number }) => {
      const res = await apiRequest("PATCH", `/api/goals/${id}`, { current });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Прогресс обновлен",
        description: "Ваш прогресс был успешно сохранен",
      });
      setEditingId(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive",
      });
    },
  });

  const totalProgress = goals.length > 0
    ? goals.reduce((acc, goal) => acc + (goal.current / goal.target) * 100, 0) / goals.length
    : 0;

  const handleUpdateProgress = (id: number) => {
    const numValue = Number(currentValue);
    if (!isNaN(numValue)) {
      updateGoalMutation.mutate({ id, current: numValue });
    }
  };

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id);
    setCurrentValue(goal.current.toString());
  };

  const getGradientStyle = (color: string) => {
    const [start, end] = color.split('-');
    return `bg-gradient-to-br from-${start}-500 to-${end}-700`;
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
              <Progress value={totalProgress} className="w-96 h-4" />
              <p className="text-sm text-gray-400">{totalProgress.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden p-6 ${getGradientStyle(goal.color)} bg-opacity-10 border-0 shadow-xl`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20 backdrop-blur-sm" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${getGradientStyle(goal.color)} shadow-lg ring-2 ring-${goal.color.split('-')[0]}-500/50 backdrop-blur-xl`}>
                        {iconComponents[goal.icon]}
                      </div>
                      <h3 className="text-xl font-bold text-white">{goal.title}</h3>
                    </div>
                    {editingId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={currentValue}
                          onChange={(e) => setCurrentValue(e.target.value)}
                          className="w-24 bg-black/50 border-white/20 text-white"
                        />
                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateProgress(goal.id)}
                            className={`${getGradientStyle(goal.color)} hover:opacity-90 text-white`}
                          >
                            ✓
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingId(null)}
                            className="border-white/20 hover:bg-white/10 text-white"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        onClick={() => startEditing(goal)}
                        className="text-2xl font-bold hover:bg-white/10 text-white"
                      >
                        {goal.current}/{goal.target}
                        <span className="text-sm ml-1 opacity-70">{goal.unit}</span>
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Progress 
                      value={(goal.current / goal.target) * 100} 
                      className="h-3 bg-black/30 overflow-hidden"
                    />
                    <p className="text-sm text-white/70 text-right">
                      {((goal.current / goal.target) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}