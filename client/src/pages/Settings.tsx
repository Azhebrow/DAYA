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
import { Brain, Clock, Dumbbell, Ban, DollarSign, ChevronDown, ChevronUp, CalendarIcon, CheckCircle2, Pencil, Smile } from 'lucide-react';
import { ExportImport } from '@/components/ExportImport';
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const EMOJIS = {
  activities: ["🫁", "🍵", "🧹", "💼", "📚", "🎯", "💊", "🍔", "💸", "🔞", "🏃", "📖", "🎨", "🎵", "🎮", "⚽️", "🎭", "🎪", "🎲", "🎱"],
  food: ["🍎", "🍕", "🍜", "🍳", "🥗", "🍖", "🥩", "🌮", "🥪", "🥤"],
  objects: ["📱", "💻", "⌚️", "📷", "🎮", "📚", "✏️", "📎", "💡", "🔑"],
  symbols: ["❤️", "⭐️", "✨", "💫", "🔥", "💯", "❌", "✅", "⚠️", "🔄"],
};

interface TaskNameEditorProps {
  taskName: string;
  emoji: string;
  onChange: (newName: string, newEmoji: string) => void;
  icon: React.ElementType;
  color: string;
  toast: ReturnType<typeof useToast>['toast'];
}

const TaskNameEditor = ({
  taskName,
  emoji,
  onChange,
  icon: Icon,
  color,
  toast
}: TaskNameEditorProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(taskName);
  const [emojiValue, setEmojiValue] = React.useState(emoji);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateAndSave = () => {
    if (name.length < 3 || name.length > 7) {
      setError("Название должно быть от 3 до 7 символов");
      toast({
        title: "Ошибка",
        description: "Название должно быть от 3 до 7 символов",
        variant: "destructive"
      });
      return false;
    }
    setError("");
    onChange(name, emojiValue);
    setIsEditing(false);
    setIsEmojiPickerOpen(false);
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndSave();
    } else if (e.key === 'Escape') {
      setName(taskName);
      setEmojiValue(emoji);
      setIsEditing(false);
      setIsEmojiPickerOpen(false);
      setError("");
    }
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div
      className="w-full p-4 rounded-lg transition-all duration-200 hover:opacity-90 flex items-center gap-4"
      style={{ backgroundColor: `var(${color})` }}
    >
      <Icon className="h-5 w-5 text-white shrink-0" />
      {isEditing ? (
        <div className="flex gap-3 flex-1 items-center">
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white min-w-[60px]"
              >
                {emojiValue} <Smile className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-3">
              <div className="space-y-3">
                {Object.entries(EMOJIS).map(([category, emojis]) => (
                  <div key={category} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground capitalize">{category}</Label>
                    <div className="grid grid-cols-8 gap-1.5">
                      {emojis.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className="h-9 w-9 p-0 hover:bg-accent"
                          onClick={() => {
                            setEmojiValue(emoji);
                            setIsEmojiPickerOpen(false);
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onBlur={validateAndSave}
            onKeyDown={handleKeyDown}
            className={`h-9 flex-1 bg-white/10 border-none text-white text-base ${error ? 'ring-2 ring-red-500' : ''}`}
            maxLength={7}
            placeholder="3-7 символов"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center">
          <span className="text-base text-white">
            {emojiValue} {taskName}
          </span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/20 shrink-0"
        onClick={() => setIsEditing(!isEditing)}
      >
        <Pencil className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
};

const DEFAULT_OATH_TEXT = `[Your oath text here]`;

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return settingsSchema.parse({});
      return settingsSchema.parse(JSON.parse(stored));
    } catch (error) {
      console.error('Error parsing settings:', error);
      return settingsSchema.parse({});
    }
  });

  const [isOathExpanded, setIsOathExpanded] = React.useState(false);

  const handleTaskNameChange = React.useCallback((categoryName: string, taskName: string, newName: string, newEmoji: string) => {
    try {
      console.log('Attempting to update task:', { categoryName, taskName, newName, newEmoji });

      const tasks = localStorage.getItem('tasks');
      if (!tasks) {
        console.error('No tasks found in storage');
        throw new Error('No tasks found in storage');
      }

      let parsedTasks;
      try {
        parsedTasks = JSON.parse(tasks);
        console.log('Current tasks:', parsedTasks);
      } catch (e) {
        console.error('Failed to parse tasks:', e);
        throw new Error('Failed to parse tasks');
      }

      if (!Array.isArray(parsedTasks)) {
        console.error('Tasks is not an array:', parsedTasks);
        throw new Error('Invalid tasks format');
      }

      const category = parsedTasks.find((c: any) => c.name === categoryName);
      if (!category) {
        console.error('Category not found:', categoryName);
        throw new Error(`Category ${categoryName} not found`);
      }

      const task = category.tasks.find((t: any) => t.name === taskName);
      if (!task) {
        console.error('Task not found:', taskName);
        throw new Error(`Task ${taskName} not found in ${categoryName}`);
      }

      const updatedTasks = parsedTasks.map((c: any) => {
        if (c.name === categoryName) {
          return {
            ...c,
            tasks: c.tasks.map((t: any) =>
              t.name === taskName
                ? { ...t, name: newName, emoji: newEmoji }
                : t
            )
          };
        }
        return c;
      });

      console.log('Updated tasks:', updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));

      toast({
        title: "Задача обновлена",
        description: `${newEmoji} ${newName} успешно сохранено`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить задачу: " + (error instanceof Error ? error.message : 'Неизвестная ошибка'),
        variant: "destructive"
      });
    }
  }, [toast]);

  // Other handler functions...
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
    <div className="container max-w-7xl mx-auto p-4 space-y-6">
      {/* Task Names Section */}
      <Card className="backdrop-blur-sm bg-card/80 border-accent/20 col-span-full">
        <CardHeader>
          <CardTitle className="text-xl text-primary">
            Названия задач
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mind tasks */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Разум</Label>
              <TaskNameEditor
                taskName="Дыхание"
                emoji="🫁"
                onChange={(newName, newEmoji) => handleTaskNameChange('Разум', 'Дыхание', newName, newEmoji)}
                icon={Brain}
                color={settings.colors.mind}
                toast={toast}
              />
              <TaskNameEditor
                taskName="Чай"
                emoji="🍵"
                onChange={(newName, newEmoji) => handleTaskNameChange('Разум', 'Чай', newName, newEmoji)}
                icon={Brain}
                color={settings.colors.mind}
                toast={toast}
              />
            </div>

            {/* Time tasks */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Время</Label>
              <TaskNameEditor
                taskName="Уборка"
                emoji="🧹"
                onChange={(newName, newEmoji) => handleTaskNameChange('Время', 'Уборка', newName, newEmoji)}
                icon={Clock}
                color={settings.colors.time}
                toast={toast}
              />
              <TaskNameEditor
                taskName="Работа"
                emoji="💼"
                onChange={(newName, newEmoji) => handleTaskNameChange('Время', 'Работа', newName, newEmoji)}
                icon={Clock}
                color={settings.colors.time}
                toast={toast}
              />
              <TaskNameEditor
                taskName="Учёба"
                emoji="📚"
                onChange={(newName, newEmoji) => handleTaskNameChange('Время', 'Учёба', newName, newEmoji)}
                icon={Clock}
                color={settings.colors.time}
                toast={toast}
              />
              <TaskNameEditor
                taskName="Проект"
                emoji="🎯"
                onChange={(newName, newEmoji) => handleTaskNameChange('Время', 'Проект', newName, newEmoji)}
                icon={Clock}
                color={settings.colors.time}
                toast={toast}
              />
            </div>

            {/* Health tasks */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Здоровье</Label>
              <TaskNameEditor
                taskName="Таблетки"
                emoji="💊"
                onChange={(newName, newEmoji) => handleTaskNameChange('Здоровье', 'Таблетки', newName, newEmoji)}
                icon={Dumbbell}
                color={settings.colors.sport}
                toast={toast}
              />
            </div>

            {/* Habits tasks */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Пороки</Label>
              <TaskNameEditor
                taskName="Дерьмо"
                emoji="🍔"
                onChange={(newName, newEmoji) => handleTaskNameChange('Пороки', 'Дерьмо', newName, newEmoji)}
                icon={Ban}
                color={settings.colors.habits}
                toast={toast}
              />
              <TaskNameEditor
                taskName="Порно"
                emoji="🔞"
                onChange={(newName, newEmoji) => handleTaskNameChange('Пороки', 'Порно', newName, newEmoji)}
                icon={Ban}
                color={settings.colors.habits}
                toast={toast}
              />
            </div>

            {/* Expenses tasks */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Траты</Label>
              <TaskNameEditor
                taskName="Траты"
                emoji="💸"
                onChange={(newName, newEmoji) => handleTaskNameChange('Траты', 'Траты', newName, newEmoji)}
                icon={DollarSign}
                color={settings.colors.expenses}
                toast={toast}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
        <CardHeader>
          <CardTitle className="text-xl text-primary">
            Текст клятвы
          </CardTitle>
        </CardHeader>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

        <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              Цвета категорий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <ColorPicker
                  value={settings.colors.daySuccess}
                  onChange={(value) => handleSettingChange('colors', { daySuccess: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.expenses
                  ]}
                  categoryName="Успех дня"
                  icon={CheckCircle2}
                />
              </div>
              <div>
                <ColorPicker
                  value={settings.colors.mind}
                  onChange={(value) => handleSettingChange('colors', { mind: value })}
                  usedColors={[
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                  categoryName="Разум"
                  icon={Brain}
                />
              </div>
              <div>
                <ColorPicker
                  value={settings.colors.time}
                  onChange={(value) => handleSettingChange('colors', { time: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                  categoryName="Время"
                  icon={Clock}
                />
              </div>
              <div>
                <ColorPicker
                  value={settings.colors.sport}
                  onChange={(value) => handleSettingChange('colors', { sport: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.habits,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                  categoryName="Спорт"
                  icon={Dumbbell}
                />
              </div>
              <div>
                <ColorPicker
                  value={settings.colors.habits}
                  onChange={(value) => handleSettingChange('colors', { habits: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.expenses,
                    settings.colors.daySuccess
                  ]}
                  categoryName="Пороки"
                  icon={Ban}
                />
              </div>
              <div>
                <ColorPicker
                  value={settings.colors.expenses}
                  onChange={(value) => handleSettingChange('colors', { expenses: value })}
                  usedColors={[
                    settings.colors.mind,
                    settings.colors.time,
                    settings.colors.sport,
                    settings.colors.habits,
                    settings.colors.daySuccess
                  ]}
                  categoryName="Траты"
                  icon={DollarSign}
                />
              </div>
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
  );
}

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