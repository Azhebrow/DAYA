import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ExportImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const data = storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
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
        storage.importData(content);
        
        toast({
          title: "Импорт завершен",
          description: "Данные успешно импортированы",
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
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
