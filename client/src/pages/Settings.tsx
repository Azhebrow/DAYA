import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';
import { Settings, settingsSchema } from '@shared/schema';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronUp, Brain, Clock, Dumbbell, Sparkles, DollarSign } from 'lucide-react';
import { ExportImport } from '@/components/ExportImport';
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Определяем расширенную палитру цветов
const colorPalette = [
  { name: 'purple', value: 'purple-500', hex: 'hsl(var(--purple-500))' },
  { name: 'blue', value: 'blue-500', hex: 'hsl(var(--blue-500))' },
  { name: 'green', value: 'green-500', hex: 'hsl(var(--green-500))' },
  { name: 'red', value: 'red-500', hex: 'hsl(var(--red-500))' },
  { name: 'orange', value: 'orange-500', hex: 'hsl(var(--orange-500))' },
  { name: 'yellow', value: 'yellow-500', hex: 'hsl(var(--yellow-500))' },
  { name: 'pink', value: 'pink-500', hex: 'hsl(var(--pink-500))' },
  { name: 'teal', value: 'teal-500', hex: 'hsl(var(--teal-500))' },
  { name: 'indigo', value: 'indigo-500', hex: 'hsl(var(--indigo-500))' },
  { name: 'cyan', value: 'cyan-500', hex: 'hsl(var(--cyan-500))' },
  { name: 'emerald', value: 'emerald-500', hex: 'hsl(var(--emerald-500))' },
  { name: 'rose', value: 'rose-500', hex: 'hsl(var(--rose-500))' },
];

// Компонент выбора цвета через Popover
const ColorPicker = ({ 
  value, 
  onChange, 
  usedColors, 
  categoryName 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  usedColors: string[];
  categoryName: string;
}) => {
  const isColorUsed = (color: string) => usedColors.includes(color) && color !== value;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full p-0 h-auto hover:bg-transparent"
        >
          <div 
            className="p-4 rounded-lg transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: `hsl(var(--${value}))` }}
          >
            {categoryName === 'Разум' && <Brain className="h-5 w-5 text-white" />}
            {categoryName === 'Время' && <Clock className="h-5 w-5 text-white" />}
            {categoryName === 'Спорт' && <Dumbbell className="h-5 w-5 text-white" />}
            {categoryName === 'Привычки' && <Sparkles className="h-5 w-5 text-white" />}
            {categoryName === 'Траты' && <DollarSign className="h-5 w-5 text-white" />}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          {colorPalette.map((color) => (
            <button
              key={color.value}
              onClick={() => !isColorUsed(color.value) && onChange(color.value)}
              className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all
                ${value === color.value ? 'ring-white scale-110' : 'ring-transparent hover:scale-105'}
                ${isColorUsed(color.value) ? 'opacity-40 cursor-not-allowed' : ''}
              `}
              style={{ backgroundColor: color.hex }}
              disabled={isColorUsed(color.value)}
              title={isColorUsed(color.value) ? 'Этот цвет уже используется' : color.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Основной текст клятвы остается без изменений
const DEFAULT_OATH_TEXT = `Я — неоспоримая сила. Я не раб своих желаний, я их хозяин. Я выбираю дисциплину вместо минутных удовольствий. Я не позволяю порнографии разрушать мой разум и лишать меня энергии — я сильнее этого. Я не растрачиваю своё время на пустые развлечения, которые ведут в никуда. Каждое мгновение — это возможность стать лучше, и я не позволю себе её упустить.
Я контролирую свои финансы, потому что понимаю: деньги — это инструмент для роста, а не для удовлетворения капризов. Я не покупаю бесполезные вещи, потому что инвестирую в себя и своё будущее. Я строю жизнь, где каждый шаг ведёт к успеху.
Моё тело — мой храм. Я питаю его едой, которая даёт силу, а не слабость. Я не позволю сахару и пустым калориям лишить меня энергии и решимости. Я тренирую своё тело, потому что хочу быть сильным, выносливым, непоколебимым. Я уважаю себя слишком сильно, чтобы быть слабым.
Я не убиваю время — я использую его. Я вкладываю каждую минуту в развитие навыков, знаний и опыта, которые приведут меня к величию. Я строю будущее своими действиями сегодня. Я знаю, кем хочу быть, и ничего не сможет меня остановить.
Моя решимость — моя броня. Я выбираю путь дисциплины, силы и мудрости. Я хозяин своей судьбы, и никакие соблазны не могут отнять у меня власть над собой. Я выбираю быть великим. Я выбираю побеждать.`;

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return settingsSchema.parse({
        startDate: '2025-02-07',
        endDate: '2025-09-09',
        oathText: DEFAULT_OATH_TEXT,
        colorScheme: 'default',
        colors: {
          mind: 'purple-500',
          time: 'green-500',
          sport: 'red-500',
          habits: 'orange-500',
          expenses: 'orange-500',
        }
      });
      const parsedSettings = settingsSchema.parse(JSON.parse(stored));
      return parsedSettings;
    } catch (error) {
      console.error('Error parsing settings:', error);
      return settingsSchema.parse({
        startDate: '2025-02-07',
        endDate: '2025-09-09',
        oathText: DEFAULT_OATH_TEXT,
        colorScheme: 'default',
        colors: {
          mind: 'purple-500',
          time: 'green-500',
          sport: 'red-500',
          habits: 'orange-500',
          expenses: 'orange-500',
        }
      });
    }
  });

  const [isOathExpanded, setIsOathExpanded] = React.useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key: keyof Settings, value: any) => {
    let newSettings = {...settings};

    if (key === 'colors') {
      newSettings = { ...settings, colors: {...settings.colors, ...value} };
    } else if (key === 'timeTarget') {
      newSettings = { ...settings, timeTarget: value * 60 };
    } else {
      newSettings = { ...settings, [key]: value };
    }
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    toast({
      title: "Настройки сохранены",
      description: "Ваши изменения успешно применены",
    });
  };

  const handleClearData = () => {
    try {
      localStorage.clear();
      window.location.reload();
      toast({
        title: "Данные удалены",
        description: "Все данные успешно удалены",
      });
    } catch (error) {
      console.error('Clear data error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении данных",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4">
      <div className="container mx-auto space-y-4 max-w-7xl">
        <header className="backdrop-blur-sm bg-card/30 rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold text-primary">Настройки</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Карточка с текстом клятвы - всегда на всю ширину */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20 md:col-span-2 xl:col-span-3">
            <Collapsible open={isOathExpanded} onOpenChange={setIsOathExpanded}>
              <CollapsibleTrigger className="w-full">
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center justify-between">
                    <span>Текст клятвы</span>
                    {isOathExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="oathText">Отредактируйте текст клятвы</Label>
                    <Textarea
                      id="oathText"
                      value={settings.oathText || DEFAULT_OATH_TEXT}
                      onChange={(e) => handleSettingChange('oathText', e.target.value)}
                      className="min-h-[200px] font-medium"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Карточка диапазона дат */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Диапазон дат
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Начальная дата</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.startDate ? format(new Date(settings.startDate), 'PP') : 'Выберите дату'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={settings.startDate ? new Date(settings.startDate) : undefined}
                        onSelect={(date) => date && handleSettingChange('startDate', format(date, 'yyyy-MM-dd'))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Конечная дата</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.endDate ? format(new Date(settings.endDate), 'PP') : 'Выберите дату'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={settings.endDate ? new Date(settings.endDate) : undefined}
                        onSelect={(date) => date && handleSettingChange('endDate', format(date, 'yyyy-MM-dd'))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка целевых показателей */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Целевые показатели
              </CardTitle>
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
                    onChange={(e) => handleSettingChange('timeTarget', parseFloat(e.target.value))}
                    className="transition-shadow hover:shadow-md focus:shadow-lg"
                    step="0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка с категориями и цветами */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Цвета категорий
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {/* Разум */}
                <div className="flex items-center gap-4">
                  <ColorPicker
                    value={settings.colors.mind}
                    onChange={(value) => handleSettingChange('colors', { mind: value })}
                    usedColors={[
                      settings.colors.time,
                      settings.colors.sport,
                      settings.colors.habits,
                      settings.colors.expenses
                    ]}
                    categoryName="Разум"
                  />
                  <div className="flex-grow">
                    <Label>Разум</Label>
                  </div>
                </div>

                {/* Время */}
                <div className="flex items-center gap-4">
                  <ColorPicker
                    value={settings.colors.time}
                    onChange={(value) => handleSettingChange('colors', { time: value })}
                    usedColors={[
                      settings.colors.mind,
                      settings.colors.sport,
                      settings.colors.habits,
                      settings.colors.expenses
                    ]}
                    categoryName="Время"
                  />
                  <div className="flex-grow">
                    <Label>Время</Label>
                  </div>
                </div>

                {/* Спорт */}
                <div className="flex items-center gap-4">
                  <ColorPicker
                    value={settings.colors.sport}
                    onChange={(value) => handleSettingChange('colors', { sport: value })}
                    usedColors={[
                      settings.colors.mind,
                      settings.colors.time,
                      settings.colors.habits,
                      settings.colors.expenses
                    ]}
                    categoryName="Спорт"
                  />
                  <div className="flex-grow">
                    <Label>Спорт</Label>
                  </div>
                </div>

                {/* Привычки */}
                <div className="flex items-center gap-4">
                  <ColorPicker
                    value={settings.colors.habits}
                    onChange={(value) => handleSettingChange('colors', { habits: value })}
                    usedColors={[
                      settings.colors.mind,
                      settings.colors.time,
                      settings.colors.sport,
                      settings.colors.expenses
                    ]}
                    categoryName="Привычки"
                  />
                  <div className="flex-grow">
                    <Label>Привычки</Label>
                  </div>
                </div>

                {/* Траты */}
                <div className="flex items-center gap-4">
                  <ColorPicker
                    value={settings.colors.expenses}
                    onChange={(value) => handleSettingChange('colors', { expenses: value })}
                    usedColors={[
                      settings.colors.mind,
                      settings.colors.time,
                      settings.colors.sport,
                      settings.colors.habits
                    ]}
                    categoryName="Траты"
                  />
                  <div className="flex-grow">
                    <Label>Траты</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка управления данными - всегда в конце и на всю ширину */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20 md:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Управление данными
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <AlertDialogAction onClick={handleClearData}>
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
    </div>
  );
}