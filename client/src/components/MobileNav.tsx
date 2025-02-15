import { Menu, LayoutDashboard, LineChart, CalendarDays, Settings2, BarChart, Target, Scroll } from "lucide-react"
import { Link, useLocation } from "wouter"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const routes = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/oath", label: "Клятва", icon: Scroll },
  { href: "/goals", label: "Цели", icon: Target },
  { href: "/ranges", label: "Диапазоны", icon: BarChart },
  { href: "/statistics", label: "Статистика", icon: LineChart },
  { href: "/settings", label: "Настройки", icon: Settings2 },
]

export function MobileNav() {
  const [location] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-2 text-base hover:bg-zinc-800/20 hover:text-gray-200 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-5 w-5 text-gray-400" />
          <span className="sr-only">Открыть меню</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 border-r border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-1 p-4">
            {routes.map(({ href, label, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-zinc-800 text-gray-200 shadow-lg scale-[1.02]' 
                      : 'hover:bg-zinc-800/20 hover:text-gray-200 text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-base font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}