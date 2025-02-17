import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Category } from '@shared/schema';
import TaskInput from './TaskInput';
import { useQuery } from '@tanstack/react-query';
import { storage } from '@/lib/storage';

interface TaskCardProps {
  category: Category;
  onTaskUpdate: (taskId: string, value: number | boolean | string) => void;
  isExpenseCard?: boolean;
  expenseIndex?: number;
}

export const TaskCard = React.memo(({ 
  category, 
  onTaskUpdate, 
  isExpenseCard = false,
  expenseIndex 
}: TaskCardProps) => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => storage.getSettings()
  });

  const handleTaskUpdate = useCallback((taskId: string, value: number | boolean | string) => {
    onTaskUpdate(taskId, value);
  }, [onTaskUpdate]);

  // Обновляем информацию о категории из настроек
  React.useEffect(() => {
    if (!settings?.subcategories) return;

    // Определяем тип категории для маппинга с настройками
    const categoryType = category.type.toLowerCase();
    let subcategoryList;

    switch (categoryType) {
      case 'time':
        subcategoryList = settings.subcategories.time;
        break;
      case 'calorie':
        subcategoryList = settings.subcategories.sport;
        break;
      case 'checkbox':
        if (category.name.includes('Порок')) {
          subcategoryList = settings.subcategories.habits;
        } else {
          subcategoryList = settings.subcategories.mind;
        }
        break;
      case 'expense':
        subcategoryList = settings.subcategories.expenses;
        break;
      default:
        return;
    }

    if (!subcategoryList) return;

    category.tasks.forEach(task => {
      // Ищем соответствующую подкатегорию по ID задачи
      const matchingSubcategory = subcategoryList.find(
        sub => task.id.startsWith(sub.id)
      );

      if (matchingSubcategory) {
        // Обновляем имя и эмодзи задачи из настроек
        task.name = matchingSubcategory.name;
        category.name = matchingSubcategory.name;
        category.emoji = matchingSubcategory.emoji;
      }
    });
  }, [settings, category]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="bg-zinc-900/50 border-gray-800">
        <div className="flex items-center p-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={category.name}>
              {category.emoji}
            </span>
            <span className="text-sm font-medium text-gray-200">
              {category.name}
            </span>
          </div>
        </div>
        <CardContent className="space-y-3 p-4 pt-2">
          {category.tasks.map((task) => (
            <TaskInput
              key={task.id}
              task={task}
              onChange={(value) => handleTaskUpdate(task.id, value)}
              isExpenseCard={isExpenseCard}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

TaskCard.displayName = 'TaskCard';