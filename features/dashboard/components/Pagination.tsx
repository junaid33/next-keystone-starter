"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronLeft, ChevronRight, ChevronDown, PencilLine, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListInfo {
  singular: string;
  plural: string;
}

interface PaginationProps {
  currentPage?: number;
  total?: number;
  pageSize?: number;
  list?: ListInfo;
  selectedItems?: Set<string>;
  onResetSelection?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isDeleteLoading?: boolean;
}

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * List footer. Sticky at the bottom of the page: range + pager + page size.
 * With rows selected it becomes the bulk-action bar (count, edit, delete, clear).
 */
export function Pagination({
  currentPage = 1,
  total = 0,
  pageSize = 10,
  list = { singular: "item", plural: "items" },
  selectedItems = new Set<string>(),
  onResetSelection,
  onDelete,
  onEdit,
  isDeleteLoading = false,
}: PaginationProps) {
  const [currentPageInput, setCurrentPageInput] = useState(currentPage.toString());
  const [customSize, setCustomSize] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query: Record<string, string> = {};

  if (searchParams) {
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setCurrentPageInput(currentPage.toString());
  }, [currentPage]);

  const getQueryString = (newParams: Record<string, number>) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key].toString());
    });
    return allParams.toString();
  };

  const handlePageChange = (newPage: number) => {
    const page = Math.max(1, Math.min(totalPages, Number(newPage) || 1));
    setCurrentPageInput(page.toString());
    if (page !== currentPage) {
      router.push(`${pathname}?${getQueryString({ page })}`);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    const size = Math.max(1, Math.floor(Number(newSize)));
    if (!Number.isFinite(size)) return;
    router.push(`${pathname}?${getQueryString({ pageSize: size, page: 1 })}`);
  };

  const start = total === 0 ? 0 : pageSize * (currentPage - 1) + 1;
  const end = Math.min(pageSize * currentPage, total);
  const noun = (n: number) => (n === 1 ? list.singular : list.plural);

  const bar = "sticky bottom-0 z-20 flex h-12 items-center gap-2 border-t border-[var(--ks-line)] bg-[color-mix(in_oklab,var(--ks-surface)_90%,transparent)] px-3 backdrop-blur-md md:px-6 md:rounded-b-[12px]";

  if (selectedItems.size > 0) {
    const n = selectedItems.size;
    return (
      <div className={bar} role="toolbar" aria-label="Selection">
        <span className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="grid h-5 min-w-5 place-items-center rounded-[6px] bg-[var(--ks-accent)] px-1 font-mono text-[12px] font-medium text-white">{n}</span>
          <span className="truncate text-[var(--ks-ink-2)]">selected</span>
        </span>
        <div className="ml-auto ks-track">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilLine />
              Edit
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" data-variant="danger" disabled={isDeleteLoading}>
                  <Trash2 />
                  {isDeleteLoading ? "Deleting" : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {n} {noun(n)}
                  </AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <div className="ks-track">
                    <AlertDialogCancel className="h-7 px-2.5 text-[12px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      data-variant="danger-fill"
                      className="h-7 px-2.5 text-[12px]"
                      onClick={() => onDelete?.()}
                      disabled={isDeleteLoading}
                    >
                      Delete {n}
                    </AlertDialogAction>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="icon-sm" aria-label="Clear selection" title="Clear (Esc)" onClick={onResetSelection}>
            <X />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={bar}>
      <span className="min-w-0 truncate text-[12px] text-[var(--ks-dim)]">
        <span className="font-mono text-[var(--ks-ink-2)]">{total > pageSize ? `${start}–${end}` : total}</span>
        {total > pageSize && (
          <>
            {" of "}
            <span className="font-mono text-[var(--ks-ink-2)]">{total}</span>
          </>
        )}{" "}
        <span className="max-sm:hidden">{noun(total).toLowerCase()}</span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2 text-[12px]">
              <span className="font-mono text-[var(--ks-ink-2)]">{pageSize}</span>
              <span className="max-sm:hidden">per page</span>
              <ChevronDown className="!size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Page size</DropdownMenuLabel>
            {PAGE_SIZES.map((size) => (
              <DropdownMenuItem key={size} onClick={() => handlePageSizeChange(size)} className="justify-between">
                <span className="font-mono">{size}</span>
                {size === pageSize && <Check className="size-3.5 text-[var(--ks-accent)]" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <form
              className="p-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (customSize) handlePageSizeChange(Number(customSize));
              }}
            >
              <input
                inputMode="numeric"
                aria-label="Custom page size"
                placeholder="Custom"
                value={customSize}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => /^\d*$/.test(e.target.value) && setCustomSize(e.target.value)}
                className="ks-field h-7 w-full px-2 font-mono text-[12px]"
              />
            </form>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ks-track">
          <Button variant="outline" size="icon-sm" aria-label="Previous page" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft />
          </Button>
          <label className="flex h-7 items-center gap-1 px-1.5 font-mono text-[12px] text-[var(--ks-dim)]">
            <span className="sr-only">Page</span>
            <input
              className="w-6 bg-transparent text-center text-[var(--ks-ink)] outline-none"
              inputMode="numeric"
              value={currentPageInput}
              onChange={(e) => /^\d*$/.test(e.target.value) && setCurrentPageInput(e.target.value)}
              onBlur={() => (currentPageInput === "" ? setCurrentPageInput(currentPage.toString()) : handlePageChange(Number(currentPageInput)))}
              onKeyDown={(e) => e.key === "Enter" && handlePageChange(Number(currentPageInput))}
            />
            <span>/</span>
            <span>{totalPages}</span>
          </label>
          <Button variant="outline" size="icon-sm" aria-label="Next page" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
