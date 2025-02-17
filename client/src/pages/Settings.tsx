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
import { Brain, Clock, Dumbbell, Ban, DollarSign, ChevronDown, ChevronUp, CalendarIcon, CheckCircle2 } from 'lucide-react';
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
import EmojiPicker from 'emoji-picker-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Updated colorPalette - organized by color groups
const colorPalette = [
  // Красные и оранжевые оттенки
  { name: 'red', value: '--red', hex: 'var(--red)' },
  { name: 'red-light', value: '--red-light', hex: 'var(--red-light)' },
  { name: 'red-dark', value: '--red-dark', hex: 'var(--red-dark)' },
  { name: 'orange', value: '--orange', hex: 'var(--orange)' },
  { name: 'orange-light', value: '--orange-light', hex: 'var(--orange-light)' },
  { name: 'orange-dark', value: '--orange-dark', hex: 'var(--orange-dark)' },
  { name: 'rose', value: '--rose', hex: 'var(--rose)' },
  { name: 'rose-light', value: '--rose-light', hex: 'var(--rose-light)' },
  { name: 'amber', value: '--amber', hex: 'var(--amber)' },

  // Синие оттенки
  { name: 'blue', value: '--blue', hex: 'var(--blue)' },
  { name: 'blue-light', value: '--blue-light', hex: 'var(--blue-light)' },
  { name: 'blue-dark', value: '--blue-dark', hex: 'var(--blue-dark)' },
  { name: 'cyan', value: '--cyan', hex: 'var(--cyan)' },
  { name: 'cyan-light', value: '--cyan-light', hex: 'var(--cyan-light)' },
  { name: 'sky', value: '--sky', hex: 'var(--sky)' },
  { name: 'indigo', value: '--indigo', hex: 'var(--indigo)' },

  // Зеленые оттенки
  { name: 'green', value: '--green', hex: 'var(--green)' },
  { name: 'green-light', value: '--green-light', hex: 'var(--green-light)' },
  { name: 'green-dark', value: '--green-dark', hex: 'var(--green-dark)' },
  { name: 'emerald', value: '--emerald', hex: 'var(--emerald)' },
  { name: 'emerald-light', value: '--emerald-light', hex: 'var(--emerald-light)' },
  { name: 'lime', value: '--lime', hex: 'var(--lime)' },
  { name: 'teal', value: '--teal', hex: 'var(--teal)' },

  // Фиолетовые и розовые оттенки
  { name: 'purple', value: '--purple', hex: 'var(--purple)' },
  { name: 'purple-light', value: '--purple-light', hex: 'var(--purple-light)' },
  { name: 'purple-dark', value: '--purple-dark', hex: 'var(--purple-dark)' },
  { name: 'violet', value: '--violet', hex: 'var(--violet)' },
  { name: 'fuchsia', value: '--fuchsia', hex: 'var(--fuchsia)' },
  { name: 'pink', value: '--pink', hex: 'var(--pink)' },
];

// Updated ColorPicker component
const ColorPicker = ({
  value,
  onChange,
  usedColors,
  categoryName,
  icon: Icon
}: {
  value: string;
  onChange: (value: string) => void;
  usedColors: string[];
  categoryName: string;
  icon: React.ElementType;
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
            className="w-full p-4 rounded-lg transition-all duration-200 hover:opacity-90 flex items-center justify-between gap-3"
            style={{ backgroundColor: `var(${value})` }}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-white" />
              <span className="text-white font-medium">{categoryName}</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronDown className="h-4 w-4 text-white" />
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4">
        <div className="grid grid-cols-6 gap-2">
          {colorPalette.map((color) => (
            <button
              key={color.value}
              onClick={() => !isColorUsed(color.value) && onChange(color.value)}
              className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                value === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
              } ${isColorUsed(color.value) ? 'opacity-25 cursor-not-allowed' : 'hover:scale-110'}`}
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

const DEFAULT_OATH_TEXT = `Я — неоспоримая сила. Я не раб своих желаний, я их хозяин. Я выбираю дисциплину вместо минутных удовольствий. Я не позволяю порнографии разрушать мой разум и лишать меня энергии — я сильнее этого. Я не растрачиваю своё время на пустые развлечения, которые ведут в никуда. Каждое мгновение — это возможность стать лучше, и я не позволю себе её упустить.
Я контролирую свои финансы, потому что понимаю: деньги — это инструмент для роста, а не для удовлетворения капризов. Я не покупаю бесполезные вещи, потому что инвестирую в себя и своё будущее. Я строю жизнь, где каждый шаг ведёт к успеху.
Моё тело — мой храм. Я питаю его едой, которая даёт силу, а не слабость. Я не позволю сахару и пустым калориям лишить меня энергии и решимости. Я тренирую своё тело, потому что хочу быть сильным, выносливым, непоколебимым. Я уважаю себя слишком сильно, чтобы быть слабым.
Я не убиваю время — я использую его. Я вкладываю каждую минуту в развитие навыков, знаний и опыта, которые приведут меня к величию. Я строю будущее своими действиями сегодня. Я знаю, кем хочу быть, и ничего не сможет меня остановить.
Моя решимость — моя броня. Я выбираю путь дисциплины, силы и мудрости. Я хозяин своей судьбы, и никакие соблазны не могут отнять у меня власть над собой. Я выбираю быть великим. Я выбираю побеждать.`;

const SubcategoryEditor = ({
  category,
  subcategories = [], // Add default empty array
  onUpdate,
  title,
  icon: Icon,
  colorValue,
  onColorChange,
  usedColors,
}: {
  category: 'mind' | 'time' | 'sport' | 'habits' | 'expenses' | 'daySuccess';
  subcategories: { id: string; name: string; emoji: string; }[];
  onUpdate: (category: string, subcategories: { id: string; name: string; emoji: string; }[]) => void;
  title: string;
  icon: React.ElementType;
  colorValue: string;
  onColorChange: (value: string) => void;
  usedColors: string[];
}) => {
  return (
    <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
      <CardHeader className="pb-2">
        <ColorPicker
          value={colorValue}
          onChange={onColorChange}
          usedColors={usedColors}
          categoryName={title}
          icon={Icon}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(subcategories || []).map((sub, index) => (
            <div key={sub.id} className="flex items-center gap-2">
              <Input
                value={sub.name}
                onChange={(e) => {
                  const newSubcategories = [...subcategories];
                  newSubcategories[index] = {
                    ...sub,
                    name: e.target.value
                  };
                  onUpdate(category, newSubcategories);
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

const DEFAULT_SETTINGS = settingsSchema.parse({
  startDate: '2025-02-07',
  endDate: '2025-09-09',
  oathText: DEFAULT_OATH_TEXT,
  colors: {
    mind: '--purple',
    time: '--green',
    sport: '--red',
    habits: '--orange',
    expenses: '--orange',
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
    daySuccess: [] // Initialize with empty array
  }
});

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOathExpanded, setIsOathExpanded] = React.useState(false);

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => storage.getSettings(),
    initialData: DEFAULT_SETTINGS
  });

  const handleSettingChange = async (key: keyof Settings, value: any) => {
    let newSettings = { ...settings };

    if (key === 'colors') {
      newSettings = { ...settings, colors: { ...DEFAULT_SETTINGS.colors, ...settings.colors, ...value } };
    } else if (key === 'timeTarget') {
      newSettings = { ...settings, timeTarget: value * 60 };
    } else if (key === 'subcategories') {
      newSettings = { 
        ...settings, 
        subcategories: { 
          ...DEFAULT_SETTINGS.subcategories,
          ...settings.subcategories,
          ...value 
        } 
      };
    } else {
      newSettings = { ...settings, [key]: value };
    }

    try {
      await storage.saveSettings(newSettings);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Настройки сохранены",
        description: "Ваши изменения успешно применены",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive"
      });
    }
  };

  const handleClearData = async () => {
    try {
      await storage.clearData();
      queryClient.invalidateQueries();
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4">
      <div className="container mx-auto space-y-4 max-w-7xl">
        <header className="backdrop-blur-sm bg-card/30 rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold text-primary">Настройки</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

          <Card className="backdrop-blur-sm bg-card/80 border-accent/20 md:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Настройка категорий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SubcategoryEditor
                  category="mind"
                  subcategories={settings?.subcategories?.mind || DEFAULT_SETTINGS.subcategories.mind}
                  onUpdate={(category, newSubcategories) => {
                    handleSettingChange('subcategories', {
                      ...settings.subcategories,
                      [category]: newSubcategories
                    });
                  }}
                  title="Разум"
                  icon={Brain}
                  colorValue={settings.colors.mind}
                  onColorChange={(value) => handleSettingChange('colors', { mind: value })}
                  usedColors={[
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                />
                <SubcategoryEditor
                  category="time"
                  subcategories={settings?.subcategories?.time || DEFAULT_SETTINGS.subcategories.time}
                  onUpdate={(category, newSubcategories) => {
                    handleSettingChange('subcategories', {
                      ...settings.subcategories,
                      [category]: newSubcategories
                    });
                  }}
                  title="Время"
                  icon={Clock}
                  colorValue={settings.colors.time}
                  onColorChange={(value) => handleSettingChange('colors', { time: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                />
                <SubcategoryEditor
                  category="sport"
                  subcategories={settings?.subcategories?.sport || DEFAULT_SETTINGS.subcategories.sport}
                  onUpdate={(category, newSubcategories) => {
                    handleSettingChange('subcategories', {
                      ...settings.subcategories,
                      [category]: newSubcategories
                    });
                  }}
                  title="Спорт"
                  icon={Dumbbell}
                  colorValue={settings.colors.sport}
                  onColorChange={(value) => handleSettingChange('colors', { sport: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.habits,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                />
                <SubcategoryEditor
                  category="habits"
                  subcategories={settings?.subcategories?.habits || DEFAULT_SETTINGS.subcategories.habits}
                  onUpdate={(category, newSubcategories) => {
                    handleSettingChange('subcategories', {
                      ...settings.subcategories,
                      [category]: newSubcategories
                    });
                  }}
                  title="Пороки"
                  icon={Ban}
                  colorValue={settings.colors.habits}
                  onColorChange={(value) => handleSettingChange('colors', { habits: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                />
                <SubcategoryEditor
                  category="expenses"
                  subcategories={settings?.subcategories?.expenses || DEFAULT_SETTINGS.subcategories.expenses}
                  onUpdate={(category, newSubcategories) => {
                    handleSettingChange('subcategories', {
                      ...settings.subcategories,
                      [category]: newSubcategories
                    });
                  }}
                  title="Траты"
                  icon={DollarSign}
                  colorValue={settings.colors.expenses}
                  onColorChange={(value) => handleSettingChange('colors', { expenses: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.daySuccess,
                    '--red',
                    '--orange',
                    '--green',
                    '--blue',
                    '--purple'
                  ]}
                />
                <SubcategoryEditor
                  category="daySuccess"
                  subcategories={settings?.subcategories?.daySuccess || DEFAULT_SETTINGS.subcategories.daySuccess}
                  onUpdate={(category, newSubcategories) => {
                    handleSettingChange('subcategories', {
                      ...settings.subcategories,
                      [category]: newSubcategories
                    });
                  }}
                  title="Успехи дня"
                  icon={CheckCircle2}
                  colorValue={settings.colors.daySuccess}
                  onColorChange={(value) => handleSettingChange('colors', { daySuccess: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.expenses,
                    '--red',
                    '--orange',
                    '--green',
                    '--blue',
                    '--purple'
                  ]}
                />
              </div>
            </CardContent>
          </Card>

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
};

export default SettingsPage;