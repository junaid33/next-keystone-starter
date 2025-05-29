"use client";

import { Folders } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getAdminLists } from "@/features/dashboard/actions";
import type { KeystoneResponse } from "@/features/dashboard/lib/keystoneClient";

interface Item {
  title: string;
  href: string;
  color?: string;
}

interface ListItem {
  key: string;
  path: string;
  label: string;
  isHidden: boolean;
}

interface ModelSwitcherDropdownProps {
  type?: "model" | "platform";
  title?: string;
  items?: Item[];
  basePath: string;
}

function ModelSwitcherDropdownContent({ type, basePath }: { type: "model" | "platform", basePath: string }) {
  const { data, error, isLoading } = useSWR<KeystoneResponse<ListItem[]>>(
    type === "model" ? "adminMeta" : null,
    async () => {
      // The fetcher now correctly returns KeystoneResponse
      return getAdminLists();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );

  if (isLoading) {
    return (
      <DropdownMenuContent
        align="start"
        className="w-48 overflow-y-auto max-h-72"
      >
        <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
      </DropdownMenuContent>
    );
  }

  // Calculate navItems based on successful data
  let navItems: { label: string; href: string }[] = [];
  if (data?.success) {
    // Access the nested lists array directly, using optional chaining and nullish coalescing
    navItems = (data.data?.keystone?.adminMeta?.lists ?? [])
      .filter((list: ListItem) => !list.isHidden)
      .map((list: ListItem) => ({
        label: list.label,
        href: `${basePath}/${list.path}`,
      }));
  } else if (error) {
    // Handle SWR error or if data.success is false
    console.error("Error loading admin lists:", error || data?.error);
    navItems = []; // Ensure navItems is empty on error
  }

  if (navItems.length === 0 && !isLoading) { // Added !isLoading check to avoid showing "No items" during load
    return (
      <DropdownMenuContent
        align="start"
        className="w-48 overflow-y-auto max-h-72"
      >
        <DropdownMenuItem disabled>No items available</DropdownMenuItem>
      </DropdownMenuContent>
    );
  }

  return (
    <DropdownMenuContent
      align="start"
      className="w-48 overflow-y-auto max-h-72"
    >
      {navItems.map((item) => (
        <DropdownMenuItem key={item.href} asChild>
          <Link href={item.href}>{item.label}</Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
}

export function ModelSwitcherDropdown({ type = "model", title, items: customItems, basePath }: ModelSwitcherDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2">
          {title && <span className="mr-1">{title}</span>}
          <Button
            variant="outline"
            size="icon"
            className="h-5 w-5 rounded-sm"
          >
            <Folders className="size-3"/>
          </Button>
        </div>
      </DropdownMenuTrigger>
      {type === "model" ? (
        <ModelSwitcherDropdownContent type={type} basePath={basePath} />
      ) : (
        <DropdownMenuContent
          align="start"
          className="w-48 overflow-y-auto max-h-72"
        >
          {(customItems || []).map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={`${basePath}${item.href}`}>{item.title}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}