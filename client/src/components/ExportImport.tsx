import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportData {
  settings: any;
  goals?: {
    goals: any[];
    history: any[];
  };
}

export function ExportImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const data = storage.exportData();
      // Получаем данные целей из localStorage
      const goalsData = localStorage.getItem('goals_data');
      const historyData = localStorage.getItem('goals_history');
      const exportData: ExportData = {
        settings: JSON.parse(data),
        goals: {
          goals: goalsData ? JSON.parse(goalsData) : [],
          history: historyData ? JSON.parse(historyData) : []
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Экспорт завершен",
        description: "Данные успешно экспортированы",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData: ExportData = JSON.parse(content);

        // Импортируем настройки
        storage.importData(JSON.stringify(importedData.settings));

        // Импортируем данные целей, если они есть
        if (importedData.goals) {
          localStorage.setItem('goals_data', JSON.stringify(importedData.goals.goals));
          localStorage.setItem('goals_history', JSON.stringify(importedData.goals.history));
        }

        toast({
          title: "Импорт завершен",
          description: "Данные успешно импортированы",
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Перезагружаем страницу для применения импортированных данных
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Ошибка импорта",
          description: "Неверный формат файла",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleExport}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/20"
      >
        <Download className="w-4 h-4 mr-2" />
        Экспорт
      </Button>
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/20"
      >
        <Upload className="w-4 h-4 mr-2" />
        Импорт
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}