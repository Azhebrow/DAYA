import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Statistics from "@/pages/Statistics";
import Ranges from "@/pages/Ranges";
import Settings from "@/pages/Settings";
import Oath from "@/pages/Oath";
import Goals from "@/pages/Goals";
import { LayoutDashboard, LineChart, CalendarDays, Settings2, BarChart, Target, Scroll } from "lucide-react";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isActive = location === href;

  return (
    <button 
      onClick={() => setLocation(href)}
      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
        ${isActive 
          ? 'bg-zinc-800 text-gray-200 shadow-lg scale-105' 
          : 'hover:bg-zinc-800/20 hover:text-gray-200 text-gray-400'}`}
    >
      {children}
    </button>
  );
}

function App() {
  useEffect(() => {
    const settings = JSON.parse(
      localStorage.getItem("day_success_tracker_settings") ||
        '{"darkMode":false}',
    );
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-black">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-black/60">
          <div className="flex h-14 items-center justify-center">
            <div className="flex items-center space-x-4">
              <NavLink href="/"><LayoutDashboard className="w-4 h-4" /> Дашборд</NavLink>
              <NavLink href="/oath"><Scroll className="w-4 h-4" /> Клятва</NavLink>
              <NavLink href="/goals"><Target className="w-4 h-4" /> Цели</NavLink>
              <NavLink href="/ranges"><BarChart className="w-4 h-4" /> Диапазоны</NavLink>
              <NavLink href="/statistics"><LineChart className="w-4 h-4" /> Статистика</NavLink>
              <NavLink href="/settings"><Settings2 className="w-4 h-4" /> Настройки</NavLink>
            </div>
          </div>
        </nav>
        <div className="pt-14">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/oath" component={Oath} />
            <Route path="/goals" component={Goals} />
            <Route path="/ranges" component={Ranges} />
            <Route path="/statistics" component={Statistics} />
            <Route path="/settings" component={Settings} />
          </Switch>
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;