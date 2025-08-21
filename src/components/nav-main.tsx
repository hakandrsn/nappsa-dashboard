import * as React from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation()
  
  return (
    <nav className="grid gap-1 px-2">
      {items.map((item, index) => {
        const Icon = item.icon
        const isActive = location.pathname === item.url
        
        return (
          <Link
            key={index}
            to={item.url}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
