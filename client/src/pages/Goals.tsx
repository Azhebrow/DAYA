import { motion } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Target, DollarSign, Book, Weight, Video, CodeSquare } from "lucide-react";

interface Goal {
  id: number;
  title: string;
  target: number;
  current: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

const goals: Goal[] = [
  {
    id: 1,
    title: "Накопить",
    target: 5000,
    current: 2500,
    unit: "злотых",
    icon: <DollarSign className="w-6 h-6" />,
    color: "from-green-500 to-emerald-700"
  },
  {
    id: 2,
    title: "Изучить учебник",
    target: 804,
    current: 350,
    unit: "страниц",
    icon: <Book className="w-6 h-6" />,
    color: "from-blue-500 to-indigo-700"
  },
  {
    id: 3,
    title: "Набрать вес",
    target: 82,
    current: 78,
    unit: "кг",
    icon: <Weight className="w-6 h-6" />,
    color: "from-purple-500 to-violet-700"
  },
  {
    id: 4,
    title: "Сделать видео",
    target: 15,
    current: 5,
    unit: "видео",
    icon: <Video className="w-6 h-6" />,
    color: "from-red-500 to-rose-700"
  },
  {
    id: 5,
    title: "Заработать на фрилансе",
    target: 1500,
    current: 500,
    unit: "$",
    icon: <CodeSquare className="w-6 h-6" />,
    color: "from-yellow-500 to-orange-700"
  }
];

const calculateTotalProgress = () => {
  const individualProgress = goals.map(goal => (goal.current / goal.target) * 100);
  return individualProgress.reduce((acc, curr) => acc + curr, 0) / goals.length;
};

export default function Goals() {
  const totalProgress = calculateTotalProgress();

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
              <Card className="relative overflow-hidden p-6 backdrop-blur-lg bg-black/40 border-zinc-800">
                <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-10`} />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${goal.color}`}>
                        {goal.icon}
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
                      value={(goal.current / goal.target) * 100} 
                      className="h-2"
                    />
                    <p className="text-sm text-gray-400 text-right">
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
