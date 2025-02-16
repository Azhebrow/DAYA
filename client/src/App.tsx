import { useEffect } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutDashboard, LineChart, CalendarDays, Settings2, Target, Scroll } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Statistics from "@/pages/Statistics";
import Settings from "@/pages/Settings";
import Oath from "@/pages/Oath";
import Goals from "@/pages/Goals";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href} >
      <button
        className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 text-sm md:text-base
        ${isActive
          ? "bg-zinc-800 text-gray-200 shadow-lg scale-105"
          : "hover:bg-zinc-800/20 hover:text-gray-200 text-gray-400"}`}
      >
        {children}
      </button>
    </Link>
  );
}

const routes = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/oath", label: "Клятва", icon: Scroll },
  { href: "/goals", label: "Цели", icon: Target },
  { href: "/statistics", label: "Статистика", icon: LineChart },
  { href: "/settings", label: "Настройки", icon: Settings2 },
];

function App() {
  const [location, setLocation] = useLocation();

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
      <div className="min-h-screen bg-black text-sm sm:text-base">
        {/* Mobile Navigation */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-black/60 px-4 py-2">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите страницу" />
            </SelectTrigger>
            <SelectContent>
              {routes.map(({ href, label, icon: Icon }) => (
                <SelectItem key={href} value={href}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-black/60 hidden md:block">
          <div className="flex h-14 items-center justify-center">
            <div className="flex items-center space-x-2 lg:space-x-4">
              {routes.map(({ href, label, icon: Icon }) => (
                <NavLink key={href} href={href}>
                  <Icon className="w-4 h-4" /> {label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="pt-14 px-4 md:px-6 lg:px-8">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/oath" component={Oath} />
            <Route path="/goals" component={Goals} />
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