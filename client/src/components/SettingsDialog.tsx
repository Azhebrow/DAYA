import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';
import { Settings, settingsSchema } from '@shared/schema';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: () => void;
}

export default function SettingsDialog({ open, onOpenChange, onSettingsChange }: SettingsDialogProps) {
  const [settings, setSettings] = React.useState<Settings>(() => {
    try {
      return storage.getSettings();
    } catch (error) {
      console.error('Error initializing settings:', error);
      return settingsSchema.parse({});
    }
  });

  const { toast } = useToast();

  const handleSettingChange = (key: keyof Settings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      storage.saveSettings(newSettings);
      onSettingsChange?.();

      toast({
        title: "Настройки сохранены",
        description: "Ваши изменения успешно применены",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Произошла ошибка при сохранении настроек",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm border-accent/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Настройки</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Диапазон дат</h3>
            <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Целевые показатели</h3>
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

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Внешний вид</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Тёмная тема</Label>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-formula">Показывать формулу</Label>
              <Switch
                id="show-formula"
                checked={settings.showFormula}
                onCheckedChange={(checked) => handleSettingChange('showFormula', checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}