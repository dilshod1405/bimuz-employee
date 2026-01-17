"use client"

import * as React from "react"
import {
  BarChart3,
  Users,
  GraduationCap,
  UsersRound,
  CreditCard,
  ClipboardList,
  MessageSquare,
  FileText,
  FolderOpen,
  Command,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAuthStore } from "@/stores/authStore"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items for Developer role (full access)
const developerMenuItems: {
  title: string
  url: string
  icon: LucideIcon
}[] = [
  {
    title: "Analitika",
    url: "/analitika",
    icon: BarChart3,
  },
  {
    title: "Xodimlar",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Talabalar",
    url: "/students",
    icon: GraduationCap,
  },
  {
    title: "Guruhlar",
    url: "/groups",
    icon: UsersRound,
  },
  {
    title: "To'lovlar",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Davomatlar",
    url: "/davomatlar",
    icon: ClipboardList,
  },
  {
    title: "Murojaatlar",
    url: "/murojaatlar",
    icon: MessageSquare,
  },
  {
    title: "Hisobotlar",
    url: "/hisobotlar",
    icon: FileText,
  },
  {
    title: "Hujjatlar",
    url: "/hujjatlar",
    icon: FolderOpen,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  // Only Developer role gets full access
  const isDeveloper = user?.role === "dasturchi"
  const menuItems = isDeveloper ? developerMenuItems : []

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const userData = user
    ? {
        name: user.full_name,
        email: user.email,
        avatar: user.avatar_url || undefined,
        initials: getInitials(user.full_name),
      }
    : null

  if (!userData) {
    return null
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">BIMUZ Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.length > 0 && <NavMain items={menuItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
