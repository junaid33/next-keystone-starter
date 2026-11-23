import React from "react";
import { TopBar } from "./TopBar";
import { basePath } from "../lib/config";

interface BreadcrumbItem {
  type: "link" | "model" | "page";
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  actions?: React.ReactNode;
}

/** Item and create pages: the shared top bar with basePath-relative crumbs. */
export function PageBreadcrumbs({ items, actions }: PageBreadcrumbsProps) {
  const crumbs = items.map((item) => ({
    label: item.label,
    href: item.type === "page" ? undefined : `${basePath}${item.href || ""}`,
  }));
  return <TopBar crumbs={crumbs} actions={actions} />;
}
