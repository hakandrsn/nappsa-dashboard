import * as React from "react"
import {
  ChefHat,
  Tags,
  Globe,
  Film,
  Users,
  Home,
  Settings,
  GitBranch,
  Activity,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Dashboard data
const data = {
  user: {
    name: "Admin",
    email: "admin@nappsa.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "Nappsa Dashboard",
      logo: ChefHat,
      plan: "Yönetim Paneli",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: false,
    },
    {
      title: "Yemekler",
      url: "/dashboard/foods",
      icon: ChefHat,
      isActive: false,
    },
    {
      title: "Flow",
      url: "/dashboard/flows",
      icon: GitBranch,
      isActive: false,
    },
    {
      title: "Aktiviteler",
      url: "/dashboard/activities",
      icon: Activity,
      isActive: false,
    },
    {
      title: "Kategoriler",
      url: "/dashboard/categories",
      icon: Tags,
      isActive: false,
    },
    {
      title: "Mutfaklar",
      url: "/dashboard/cuisines",
      icon: Globe,
      isActive: false,
    },
    {
      title: "Filmler",
      url: "/dashboard/movies",
      icon: Film,
      isActive: false,
    },
    {
      title: "Kullanıcılar",
      url: "/dashboard/users",
      icon: Users,
      isActive: false,
    },
    {
      title: "Ayarlar",
      url: "/dashboard/settings",
      icon: Settings,
      isActive: false,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
