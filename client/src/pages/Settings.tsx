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
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { ExportImport } from '@/components/ExportImport';
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

const DEFAULT_OATH_TEXT = `Я — неоспоримая сила. Я не раб своих желаний, я их хозяин. Я выбираю дисциплину вместо минутных удовольствий. Я не позволяю порнографии разрушать мой разум и лишать меня энергии — я сильнее этого. Я не растрачиваю своё время на пустые развлечения, которые ведут в никуда. Каждое мгновение — это возможность стать лучше, и я не позволю себе её упустить.
Я контролирую свои финансы, потому что понимаю: деньги — это инструмент для роста, а не для удовлетворения капризов. Я не покупаю бесполезные вещи, потому что инвестирую в себя и своё будущее. Я строю жизнь, где каждый шаг ведёт к успеху.
Моё тело — мой храм. Я питаю его едой, которая даёт силу, а не слабость. Я не позволю сахару и пустым калориям лишить меня энергии и решимости. Я тренирую своё тело, потому что хочу быть сильным, выносливым, непоколебимым. Я уважаю себя слишком сильно, чтобы быть слабым.
Я не убиваю время — я использую его. Я вкладываю каждую минуту в развитие навыков, знаний и опыта, которые приведут меня к величию. Я строю будущее своими действиями сегодня. Я знаю, кем хочу быть, и ничего не сможет меня остановить.
Моя решимость — моя броня. Я выбираю путь дисциплины, силы и мудрости. Я хозяин своей судьбы, и никакие соблазны не могут отнять у меня власть над собой. Я выбираю быть великим. Я выбираю побеждать.`;

export default function SettingsPage() {
  const [isOathExpanded, setIsOathExpanded] = React.useState(false);
  const [settings, setSettings] = React.useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return settingsSchema.parse({ 
        startDate: '2025-02-07', 
        endDate: '2025-09-09',
        oathText: DEFAULT_OATH_TEXT,
        colors: {
          primary: '#0EA5E9',
          accent: '#F472B6',
          background: '#000000',
          text: '#FFFFFF',
          border: '#27272A'
        }
      });
      return settingsSchema.parse(JSON.parse(stored));
    } catch (error) {
      console.error('Error parsing settings:', error);
      return settingsSchema.parse({ 
        startDate: '2025-02-07', 
        endDate: '2025-09-09',
        oathText: DEFAULT_OATH_TEXT,
        colors: {
          primary: '#0EA5E9',
          accent: '#F472B6',
          background: '#000000',
          text: '#FFFFFF',
          border: '#27272A'
        }
      });
    }
  });

  const { toast } = useToast();

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storage.saveSettings(newSettings);

    // Применяем цвета сразу при изменении
    if (key === 'colors') {
      document.documentElement.style.setProperty('--primary', value.primary);
      document.documentElement.style.setProperty('--accent', value.accent);
      document.documentElement.style.setProperty('--background', value.background);
      document.documentElement.style.setProperty('--text', value.text);
      document.documentElement.style.setProperty('--border', value.border);
    }

    toast({
      title: "Настройки сохранены",
      description: "Ваши изменения успешно применены",
    });
  };

  const handleColorChange = (colorKey: string, value: string) => {
    const newColors = { ...settings.colors, [colorKey]: value };
    handleSettingChange('colors', newColors);
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

  // Применяем цвета при первой загрузке
  React.useEffect(() => {
    const { colors } = settings;
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--background', colors.background);
    document.documentElement.style.setProperty('--text', colors.text);
    document.documentElement.style.setProperty('--border', colors.border);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4">
      <div className="container mx-auto space-y-4 max-w-7xl">
        <header className="backdrop-blur-sm bg-card/30 rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Настройки
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Сворачиваемая карточка с текстом клятвы */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20 md:col-span-2 xl:col-span-3">
            <Collapsible open={isOathExpanded} onOpenChange={setIsOathExpanded}>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-card/90">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      Текст клятвы
                    </CardTitle>
                    {isOathExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
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

          {/* Карточка настроек цветов */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Цветовая схема
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Основной цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-12 h-12 p-1 rounded-lg"
                    />
                    <Input
                      type="text"
                      value={settings.colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Акцентный цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-12 h-12 p-1 rounded-lg"
                    />
                    <Input
                      type="text"
                      value={settings.colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Цвет фона</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-12 p-1 rounded-lg"
                    />
                    <Input
                      type="text"
                      value={settings.colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Цвет текста</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={settings.colors.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="w-12 h-12 p-1 rounded-lg"
                    />
                    <Input
                      type="text"
                      value={settings.colors.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderColor">Цвет границ</Label>
                  <div className="flex gap-2">
                    <Input
                      id="borderColor"
                      type="color"
                      value={settings.colors.border}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      className="w-12 h-12 p-1 rounded-lg"
                    />
                    <Input
                      type="text"
                      value={settings.colors.border}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка диапазона дат */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
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
              <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
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
                  <Label htmlFor="timeTarget">Целевое время (минут/день)</Label>
                  <Input
                    id="timeTarget"
                    type="number"
                    value={settings.timeTarget}
                    onChange={(e) => handleSettingChange('timeTarget', parseInt(e.target.value))}
                    className="transition-shadow hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка управления данными - всегда в конце и на всю ширину */}
          <Card className="backdrop-blur-sm bg-card/80 border-accent/20 md:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
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