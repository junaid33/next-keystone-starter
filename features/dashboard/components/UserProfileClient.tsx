/**
 * UserProfileClient: the account menu at the foot of the sidebar.
 */

"use client";

import Link from "next/link";
import { ChevronsUpDown, CircleUser, Database, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { signOut } from "@/features/dashboard/actions/auth";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserProfileClientProps {
  user: User;
}

export function initialsFor(user: { name?: string | null; email?: string | null }) {
  const source = user.name?.trim() || user.email || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function UserAvatar({ user, className = "size-7 text-[12px]" }: { user: { name?: string | null; email?: string | null }; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`ks-raised grid shrink-0 place-items-center rounded-full font-mono font-medium text-[var(--ks-ink-2)] ${className}`}
    >
      {initialsFor(user)}
    </span>
  );
}

export function UserProfileClient({ user }: UserProfileClientProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="gap-2.5 px-1.5 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
            >
              <UserAvatar user={user} />
              <span className="grid min-w-0 flex-1 text-left leading-4 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[13px] font-medium text-[var(--ks-ink)]">{user.name || user.email}</span>
                <span className="truncate text-[12px] text-[var(--ks-label)]">{user.email}</span>
              </span>
              <ChevronsUpDown className="ml-auto !size-3.5 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2 font-normal normal-case tracking-normal">
              <UserAvatar user={user} className="size-8 text-[12px]" />
              <span className="grid min-w-0 leading-4">
                <span className="truncate text-[13px] font-medium text-[var(--ks-ink)]">{user.name || user.email}</span>
                <span className="truncate font-sans text-[12px] text-[var(--ks-label)]">{user.email}</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="gap-2.5">
                <Link href="/dashboard/account" onClick={() => setOpenMobile(false)}>
                  <CircleUser className="text-[var(--ks-label)]" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2.5" onClick={() => window.open("/api/graphql", "_blank")}>
                <Database className="text-[var(--ks-label)]" />
                GraphQL API
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between gap-3 px-2 py-1.5">
              <span className="text-[13px] text-[var(--ks-ink-2)]">Theme</span>
              <ThemeSwitcher />
            </div>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild className="w-full gap-2.5">
                <button type="submit">
                  <LogOut className="text-[var(--ks-label)]" />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
