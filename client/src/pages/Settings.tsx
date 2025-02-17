import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';
import { Settings, settingsSchema } from '@shared/schema';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Brain, Clock, Dumbbell, Ban, DollarSign, CalendarIcon, BarChartIcon } from 'lucide-react';
import { ExportImport } from '@/components/ExportImport';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Базовые настройки
const DEFAULT_SETTINGS = settingsSchema.parse({
  startDate: '2025-02-07',
  endDate: '2025-09-09',
  colors: {
    mind: '--purple',
    time: '--green',
    sport: '--red',
    habits: '--orange',
    expenses: '--blue',
    daySuccess: '--green'
  },
  subcategories: {
    mind: [
      { id: 'breathing', name: '🫁 Дыхание', emoji: '🫁' },
      { id: 'tea', name: '🍵 Чай', emoji: '🍵' },
      { id: 'cleaning', name: '🧹 Уборка', emoji: '🧹' }
    ],
    time: [
      { id: 'work', name: '💼 Работа', emoji: '💼' },
      { id: 'study', name: '📚 Учёба', emoji: '📚' },
      { id: 'project', name: '🎯 Проект', emoji: '🎯' }
    ],
    sport: [
      { id: 'pills', name: '💊 Таблетки', emoji: '💊' },
      { id: 'training', name: '🏋️‍♂️ Тренировка', emoji: '🏋️‍♂️' },
      { id: 'calories', name: '🔥 Калории', emoji: '🔥' }
    ],
    habits: [
      { id: 'no_junk_food', name: '🍔 Дерьмо', emoji: '🍔' },
      { id: 'no_money_waste', name: '💸 Траты', emoji: '💸' },
      { id: 'no_adult', name: '🔞 Порно', emoji: '🔞' }
    ],
    expenses: [
      { id: 'food', name: '🍽️ Еда', emoji: '🍽️' },
      { id: 'junk', name: '🍕 Дерьмо', emoji: '🍕' },
      { id: 'city', name: '🌆 Город', emoji: '🌆' },
      { id: 'sport', name: '⚽ Спорт', emoji: '⚽' },
      { id: 'fun', name: '🎮 Отдых', emoji: '🎮' },
      { id: 'service', name: '🔧 Сервис', emoji: '🔧' },
      { id: 'other', name: '📦 Разное', emoji: '📦' }
    ],
    daySuccess: []
  }
});

// Доступные цвета
const COLORS = [
  { name: 'Фиолетовый', value: '--purple' },
  { name: 'Зелёный', value: '--green' },
  { name: 'Красный', value: '--red' },
  { name: 'Оранжевый', value: '--orange' },
  { name: 'Синий', value: '--blue' }
];

// Компонент выбора цвета
const ColorPicker = ({
  category,
  colorValue,
  onChange,
  icon: Icon,
  title
}: {
  category: string;
  colorValue: string;
  onChange: (color: string) => void;
  icon: React.ElementType;
  title: string;
}) => {
  return (
    <div className="w-full rounded-lg overflow-hidden">
      <div
        className="p-4 flex items-center justify-between transition-colors duration-200"
        style={{ backgroundColor: `var(${colorValue})` }}
      >
        <div className="flex items-center gap-2 text-white">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{title}</span>
        </div>
      </div>
      <div className="p-2 bg-card/50 flex gap-2 justify-center border-t border-white/10">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className={`w-6 h-6 rounded-full transition-transform duration-200 hover:scale-110 ${
              colorValue === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
            }`}
            style={{ backgroundColor: `var(${color.value})` }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};

// Компонент редактора категории
const CategoryEditor = ({
  category,
  subcategories,
  onUpdate,
  title,
  icon: Icon,
  colorValue,
  onColorChange,
}: {
  category: keyof Settings['subcategories'];
  subcategories: { id: string; name: string; emoji: string; }[];
  onUpdate: (category: string, items: { id: string; name: string; emoji: string; }[]) => void;
  title: string;
  icon: React.ElementType;
  colorValue: string;
  onColorChange: (color: string) => void;
}) => {
  return (
    <Card className="bg-card/80 border-accent/20">
      <CardHeader className="pb-2">
        <ColorPicker
          category={category}
          colorValue={colorValue}
          onChange={onColorChange}
          icon={Icon}
          title={title}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subcategories.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                value={item.name}
                onChange={(e) => {
                  const newItems = [...subcategories];
                  newItems[index] = { ...item, name: e.target.value };
                  onUpdate(category, newItems);
                }}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загрузка настроек
  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await storage.getSettings();
      if (!stored) return DEFAULT_SETTINGS;

      // Объединяем сохранённые настройки с дефолтными
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        subcategories: {
          ...DEFAULT_SETTINGS.subcategories,
          ...stored.subcategories
        },
        colors: {
          ...DEFAULT_SETTINGS.colors,
          ...stored.colors
        }
      };
    }
  });

  // Обработчик изменения настроек
  const handleSettingChange = async (key: keyof Settings, value: any) => {
    const newSettings = { ...settings };

    if (key === 'colors' || key === 'subcategories') {
      newSettings[key] = { ...newSettings[key], ...value };
    } else {
      newSettings[key] = value;
    }

    try {
      await storage.saveSettings(newSettings);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Настройки сохранены",
        description: "Изменения успешно применены",
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4">
      <div className="container mx-auto space-y-4 max-w-7xl">
        <header className="backdrop-blur-sm bg-card/30 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-primary">Настройки</h1>
        </header>

        {/* Настройки категорий */}
        <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Настройка категорий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryEditor
                category="mind"
                subcategories={settings.subcategories.mind}
                onUpdate={(category, items) => handleSettingChange('subcategories', { [category]: items })}
                title="Разум"
                icon={Brain}
                colorValue={settings.colors.mind}
                onColorChange={(color) => handleSettingChange('colors', { mind: color })}
              />
              <CategoryEditor
                category="time"
                subcategories={settings.subcategories.time}
                onUpdate={(category, items) => handleSettingChange('subcategories', { [category]: items })}
                title="Время"
                icon={Clock}
                colorValue={settings.colors.time}
                onColorChange={(color) => handleSettingChange('colors', { time: color })}
              />
              <CategoryEditor
                category="sport"
                subcategories={settings.subcategories.sport}
                onUpdate={(category, items) => handleSettingChange('subcategories', { [category]: items })}
                title="Спорт"
                icon={Dumbbell}
                colorValue={settings.colors.sport}
                onColorChange={(color) => handleSettingChange('colors', { sport: color })}
              />
              <CategoryEditor
                category="habits"
                subcategories={settings.subcategories.habits}
                onUpdate={(category, items) => handleSettingChange('subcategories', { [category]: items })}
                title="Пороки"
                icon={Ban}
                colorValue={settings.colors.habits}
                onColorChange={(color) => handleSettingChange('colors', { habits: color })}
              />
              <CategoryEditor
                category="expenses"
                subcategories={settings.subcategories.expenses}
                onUpdate={(category, items) => handleSettingChange('subcategories', { [category]: items })}
                title="Траты"
                icon={DollarSign}
                colorValue={settings.colors.expenses}
                onColorChange={(color) => handleSettingChange('colors', { expenses: color })}
              />
              <CategoryEditor
                category="daySuccess"
                subcategories={settings.subcategories.daySuccess}
                onUpdate={(category, items) => handleSettingChange('subcategories', { [category]: items })}
                title="Показатель успеха"
                icon={BarChartIcon}
                colorValue={settings.colors.daySuccess}
                onColorChange={(color) => handleSettingChange('colors', { daySuccess: color })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Целевые показатели */}
        <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Целевые показатели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="calorieTarget">Целевые калории (ккал/день)</Label>
                <Input
                  id="calorieTarget"
                  type="number"
                  value={settings.calorieTarget}
                  onChange={(e) => handleSettingChange('calorieTarget', parseInt(e.target.value))}
                  className="transition-shadow hover:shadow-md focus:shadow-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeTarget">Целевое время (часов/день)</Label>
                <Input
                  id="timeTarget"
                  type="number"
                  value={settings.timeTarget / 60}
                  onChange={(e) => handleSettingChange('timeTarget', parseFloat(e.target.value) * 60)}
                  className="transition-shadow hover:shadow-md focus:shadow-lg"
                  step="0.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Экспорт/Импорт */}
        <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Управление данными</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportImport />
            <div className="pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Очистить все данные
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Это приведет к удалению всех ваших данных и настроек.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => storage.clearData()}>
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;