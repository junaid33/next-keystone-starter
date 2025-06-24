/**
 * Sidebar component - Navigation for Dashboard 2
 * Based on Dashboard 1 sidebar with consistent ShadCN styling
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Sidebar as SidebarComponent, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from '@/components/ui/sidebar'
import { useAdminMeta } from '../hooks/useAdminMeta'
import { Home, Database, Users, Settings } from 'lucide-react'

export function Sidebar() {
  const { adminMeta } = useAdminMeta()
  const currentPath = usePathname()

  const lists = adminMeta?.lists || {}

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard2',
      icon: Home,
      isActive: currentPath === '/dashboard2'
    },
    ...Object.values(lists).map((list: any) => ({
      title: list.label,
      href: `/dashboard2/${list.path}`,
      icon: Database,
      isActive: currentPath.startsWith(`/dashboard2/${list.path}`)
    }))
  ]

  return (
    <SidebarComponent variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Database className="h-4 w-4" />
          </div>
          <span className="font-semibold">Admin Dashboard</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </SidebarComponent>
  )
}