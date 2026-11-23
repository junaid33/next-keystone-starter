/**
 * Sidebar: overview, every list the session can see, search, and the account menu.
 * List visibility still comes from visibleSidebarLists (role + Keystone isHidden).
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { AdminMeta } from '../hooks/useAdminMeta'
import { LayoutGrid, Search } from 'lucide-react'
import { LogoIcon } from '@/features/dashboard/components/Logo'
import { UserProfileClient } from './UserProfileClient'
import { visibleSidebarLists } from '../lib/sidebarAccess'
import { useCommandPalette } from './CommandPalette'
import { listIcon } from './listIcons'

interface User {
  id: string
  email: string
  name?: string
  role?: {
    canAccessDashboard?: boolean
  }
}

interface SidebarProps {
  adminMeta: AdminMeta | null
  user?: User | null
}

export function Sidebar({ adminMeta, user }: SidebarProps) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const palette = useCommandPalette()

  const listsArray = Object.values(adminMeta?.lists || {})

  const isLinkActive = React.useCallback(
    (href: string) => {
      if (!pathname) return false
      if (href === '/dashboard') return pathname === '/dashboard'
      return pathname === href || pathname.startsWith(`${href}/`)
    },
    [pathname]
  )

  const sidebarLinks = visibleSidebarLists(listsArray as any[], user).map((list: any) => ({
    key: list.key,
    title: list.label,
    href: `/dashboard/${list.path}`,
  }))

  const close = () => setOpenMobile(false)

  return (
    <SidebarComponent collapsible="icon" variant="inset">
      <SidebarHeader className="gap-2 px-2 pb-1 pt-2.5">
        <Link
          href="/dashboard"
          onClick={close}
          className="flex h-8 items-center gap-2 rounded-[8px] px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="ks-raised grid size-6 shrink-0 place-items-center rounded-[7px]">
            <LogoIcon className="size-3.5" suffix="-nav" />
          </span>
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[var(--ks-ink)] group-data-[collapsible=icon]:hidden">
            Keystone
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            close()
            palette.open()
          }}
          className="ks-field flex h-8 w-full items-center gap-2 px-2 text-left text-[13px] text-[var(--ks-label)] outline-none hover:text-[var(--ks-dim)] group-data-[collapsible=icon]:hidden"
        >
          <Search className="size-3.5" />
          <span className="flex-1">Search</span>
          <span className="ks-kbd max-md:hidden">⌘K</span>
        </button>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar">
        <SidebarGroup className="py-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isLinkActive('/dashboard')} tooltip="Overview">
                <Link href="/dashboard" onClick={close}>
                  <LayoutGrid />
                  <span>Overview</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {sidebarLinks.length > 0 && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel>Lists</SidebarGroupLabel>
            <SidebarMenu>
              {sidebarLinks.map((link) => {
                const Icon = listIcon(link.key)
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={isLinkActive(link.href)} tooltip={link.title}>
                      <Link href={link.href} onClick={close}>
                        <Icon />
                        <span>{link.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">{user && <UserProfileClient user={user} />}</SidebarFooter>

      <SidebarRail />
    </SidebarComponent>
  )
}
