import { Menu } from "lucide-react"
import { Link } from "wouter"

import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const routes = [
  { href: "/", label: "Главная" },
  { href: "/statistics", label: "Статистика" },
  { href: "/ranges", label: "Диапазоны" },
  { href: "/monthly", label: "Ежемесячно" },
  { href: "/ten-day", label: "10 дней" },
]

export function MobileNav() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-6">
        <ScrollArea className="max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex flex-col space-y-3">
            {routes.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
