"use client"

import { safeErrorSummary } from '@/features/dashboard/lib/security';
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { ReactNode } from 'react';
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '../context/DashboardProvider';
import { Pagination } from './Pagination';
import { getFieldViews } from '../views/registry';
import { deleteManyItemsAction } from '../actions/item-actions';
import { BulkEditDialog, bulkEditableFields } from './BulkEditDialog';
import { findStatusField } from '../lib/listQueryFields';
import { statusTone } from '../lib/statusTone';

interface ListItem {
  id: string;
  [key: string]: unknown;
}

interface ListData {
  items: ListItem[];
  count: number;
}

interface ListTableProps {
  data: ListData;
  list: any; // Using Keystone's list structure
  selectedFields: Set<string>;
  currentPage: number;
  pageSize: number;
  isFetching?: boolean;
}

const INTERACTIVE = 'a,button,input,select,textarea,label,[role="checkbox"],[role="button"]';

export function ListTable({
  data,
  list,
  selectedFields,
  currentPage,
  pageSize,
  isFetching = false,
}: ListTableProps): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams() || new URLSearchParams();
  const { basePath } = useDashboard();
  const queryClient = useQueryClient();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Selection survives refetches only for rows still on the page
  const [selectedItemsState, setSelectedItems] = useState<{
    itemsFromServer?: ListItem[];
    selectedItems: Set<string>;
  }>(() => ({
    itemsFromServer: undefined,
    selectedItems: new Set(),
  }));

  useEffect(() => {
    if (data.items && selectedItemsState.itemsFromServer !== data.items) {
      const newSelectedItems = new Set<string>();
      data.items.forEach(item => {
        if (selectedItemsState.selectedItems.has(item.id)) {
          newSelectedItems.add(item.id);
        }
      });
      setSelectedItems({
        itemsFromServer: data.items,
        selectedItems: newSelectedItems,
      });
    }
  }, [data.items, selectedItemsState.itemsFromServer, selectedItemsState.selectedItems]);

  const selected = selectedItemsState.selectedItems;
  const setSelected = (next: Set<string>) =>
    setSelectedItems({ itemsFromServer: selectedItemsState.itemsFromServer, selectedItems: next });

  // Esc clears a selection
  useEffect(() => {
    if (selected.size === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"],[role="alertdialog"],[role="menu"]')) {
        setSelectedItems((s) => ({ ...s, selectedItems: new Set() }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected.size]);

  const handleDelete = async () => {
    const idsToDelete = Array.from(selected);
    if (idsToDelete.length === 0) return;

    if (!list.gqlNames?.deleteManyMutationName) {
      toast.error('Delete functionality not available for this list');
      return;
    }

    setIsDeleteLoading(true);
    try {
      const response = await deleteManyItemsAction(list.key, idsToDelete, {
        deleteManyMutationName: list.gqlNames.deleteManyMutationName,
        whereUniqueInputName: list.gqlNames.whereUniqueInputName,
      });

      if (response.errors.length > 0) {
        toast.error(response.errors[0].message);
      } else {
        toast.success(`Deleted ${idsToDelete.length} ${idsToDelete.length === 1 ? list.singular : list.plural}`);
        setSelected(new Set());
        await queryClient.invalidateQueries({
          queryKey: ['lists', list.key, 'items']
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const titleField: string = list.labelField && list.fields[list.labelField] ? list.labelField : 'id';
  const statusField = useMemo(() => findStatusField(list.fields), [list.fields]);
  const columns = Array.from(selectedFields).filter((f) => f !== 'id' && f !== titleField && list.fields[f]);
  const canBulkEdit = useMemo(() => Object.keys(bulkEditableFields(list)).length > 0, [list]);

  const hrefFor = (item: ListItem) => `${basePath}/${list.path}/${encodeURIComponent(item.id)}`;

  const renderCell = (item: ListItem, fieldKey: string) => {
    const field = list.fields[fieldKey];
    if (!field) return null;

    if (field.viewsIndex !== undefined) {
      try {
        const CellComponent = getFieldViews(field.viewsIndex).Cell;
        if (CellComponent) {
          const linkTo = (CellComponent as any).supportsLinkTo ? { href: hrefFor(item) } : undefined;
          return <CellComponent field={field} item={item} linkTo={linkTo} />;
        }
      } catch (err) {
        console.error(`Failed to render cell for field ${fieldKey}:`, safeErrorSummary(err));
      }
    }

    const value = item[fieldKey];
    if (value === null || value === undefined) return <span className="text-[var(--ks-label)]">—</span>;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return <span>{String(value)}</span>;
    return <span className="text-[var(--ks-label)]">—</span>;
  };

  const statusOf = (item: ListItem) => {
    if (!statusField) return null;
    const raw = item[statusField.path];
    const option = statusField.fieldMeta?.options?.find((o: any) => String(o.value) === String(raw));
    return { tone: statusTone(raw), label: option?.label ?? (raw == null ? 'None' : String(raw)) };
  };

  const titleOf = (item: ListItem) => {
    const raw = item[titleField];
    return raw === null || raw === undefined || raw === '' ? item.id : String(raw);
  };

  const sortBy = query.sortBy;
  const sortField = sortBy?.startsWith('-') ? sortBy.slice(1) : sortBy;
  const sortDirection = sortBy?.startsWith('-') ? 'DESC' : 'ASC';

  const handleSort = (fieldKey: string) => {
    const field = fieldKey === 'id' ? { isOrderable: true } : list.fields[fieldKey];
    if (!field?.isOrderable) return;
    const next = new URLSearchParams(query);
    next.set('sortBy', sortBy === fieldKey ? `-${fieldKey}` : fieldKey);
    router.push(`${pathname}?${next.toString()}`);
  };

  const onRowClick = (e: React.MouseEvent, item: ListItem) => {
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(hrefFor(item), '_blank');
      return;
    }
    router.push(hrefFor(item));
  };

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const allChecked = data.items.length > 0 && selected.size === data.items.length;
  const someChecked = selected.size > 0 && !allChecked;
  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(data.items.map((i) => i.id)) : new Set());

  const SortIcon = ({ field }: { field: string }) =>
    field === sortField ? (
      sortDirection === 'ASC' ? <ArrowUp className="size-3 text-[var(--ks-ink-2)]" /> : <ArrowDown className="size-3 text-[var(--ks-ink-2)]" />
    ) : null;

  const titleSortable = titleField === 'id' || list.fields[titleField]?.isOrderable;

  if (!data || !data.items) return null;

  return (
    <div className={cn("relative transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
      {isFetching && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 animate-[ks-progress_1s_ease-in-out_infinite] bg-[var(--ks-accent)]" />
        </div>
      )}

      {/* Desktop: dense table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0 text-[13px] [&_.text-sm]:text-[13px]">
          <thead>
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-[var(--ks-line)] [&>th]:bg-[var(--ks-surface-2)] [&>th]:px-3 [&>th]:text-left [&>th]:align-middle">
              <th className="w-10 !pl-6 !pr-1">
                <Checkbox
                  aria-label="Select all"
                  checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                  onCheckedChange={(c) => toggleAll(c === true)}
                />
              </th>
              <th className="min-w-[240px]">
                <button
                  type="button"
                  onClick={() => handleSort(titleField)}
                  className={cn("ks-label inline-flex items-center gap-1", titleSortable ? "hover:text-[var(--ks-ink-2)]" : "cursor-default")}
                >
                  {titleField === 'id' ? 'ID' : list.fields[titleField]?.label || 'Title'}
                  <SortIcon field={titleField} />
                </button>
              </th>
              {columns.map((fieldKey) => {
                const field = list.fields[fieldKey];
                return (
                  <th key={fieldKey} className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort(fieldKey)}
                      className={cn("ks-label inline-flex items-center gap-1", field?.isOrderable ? "hover:text-[var(--ks-ink-2)]" : "cursor-default")}
                    >
                      {field?.label || fieldKey}
                      <SortIcon field={fieldKey} />
                    </button>
                  </th>
                );
              })}
              <th className="w-full !p-0" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => {
              const isSelected = selected.has(item.id);
              const status = statusOf(item);
              return (
                <tr
                  key={item.id}
                  onClick={(e) => onRowClick(e, item)}
                  data-selected={isSelected || undefined}
                  className="group cursor-pointer [&>td]:h-10 [&>td]:border-b [&>td]:border-[var(--ks-line)] [&>td]:px-3 [&>td]:align-middle hover:[&>td]:bg-[var(--ks-hover)] data-[selected]:[&>td]:bg-[var(--ks-selected)]"
                >
                  <td className="relative w-10 !pl-6 !pr-1">
                    {isSelected && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[var(--ks-accent)]" />}
                    <Checkbox aria-label={`Select ${titleOf(item)}`} checked={isSelected} onCheckedChange={(c) => toggle(item.id, c === true)} />
                  </td>
                  <td className="max-w-[420px]">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {status && <span className="ks-dot" data-tone={status.tone} title={status.label} aria-label={status.label} role="img" />}
                      <Link href={hrefFor(item)} className="truncate font-medium text-[var(--ks-ink)] outline-none hover:underline focus-visible:underline">
                        {titleOf(item)}
                      </Link>
                    </div>
                  </td>
                  {columns.map((fieldKey) => (
                    <td key={fieldKey} className="max-w-[280px] whitespace-nowrap text-[var(--ks-ink-2)] [&_*]:truncate">
                      {renderCell(item, fieldKey)}
                    </td>
                  ))}
                  <td aria-hidden="true" className="!p-0" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phone: one card row per item */}
      <div className="md:hidden">
        <div className="flex h-9 items-center gap-3 border-b border-[var(--ks-line)] bg-[var(--ks-surface-2)] px-4">
          <Checkbox
            aria-label="Select all"
            checked={allChecked ? true : someChecked ? 'indeterminate' : false}
            onCheckedChange={(c) => toggleAll(c === true)}
          />
          <span className="ks-label">{titleField === 'id' ? 'ID' : list.fields[titleField]?.label || 'Title'}</span>
        </div>
        <ul>
          {data.items.map((item) => {
            const isSelected = selected.has(item.id);
            const status = statusOf(item);
            return (
              <li
                key={item.id}
                onClick={(e) => onRowClick(e, item)}
                data-selected={isSelected || undefined}
                className="relative flex cursor-pointer gap-3 border-b border-[var(--ks-line)] px-4 py-3 active:bg-[var(--ks-hover)] data-[selected]:bg-[var(--ks-selected)]"
              >
                {isSelected && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[var(--ks-accent)]" />}
                <div className="pt-0.5">
                  <Checkbox aria-label={`Select ${titleOf(item)}`} checked={isSelected} onCheckedChange={(c) => toggle(item.id, c === true)} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {status && <span className="ks-dot" data-tone={status.tone} title={status.label} aria-label={status.label} role="img" />}
                    <Link href={hrefFor(item)} className="truncate text-[14px] font-medium leading-5 text-[var(--ks-ink)]">
                      {titleOf(item)}
                    </Link>
                  </div>
                  {columns.length > 0 && (
                    <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] leading-4 text-[var(--ks-dim)] [&_.text-sm]:text-[12px]">
                      {columns.slice(0, 4).map((fieldKey) => (
                        <div key={fieldKey} className="flex min-w-0 max-w-full items-center gap-1">
                          <dt className="shrink-0 text-[var(--ks-label)]">{list.fields[fieldKey]?.label}</dt>
                          <dd className="min-w-0 truncate text-[var(--ks-ink-2)] [&_*]:truncate">{renderCell(item, fieldKey)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Pagination
        currentPage={currentPage}
        total={data.count || 0}
        pageSize={pageSize}
        list={{ singular: list.singular, plural: list.plural }}
        selectedItems={selected}
        onResetSelection={() => setSelected(new Set())}
        onDelete={list.hideDelete ? undefined : handleDelete}
        onEdit={canBulkEdit ? () => setEditOpen(true) : undefined}
        isDeleteLoading={isDeleteLoading}
      />

      {canBulkEdit && (
        <BulkEditDialog
          list={list}
          ids={Array.from(selected)}
          open={editOpen}
          onOpenChange={setEditOpen}
          onDone={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
