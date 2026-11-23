"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Edit, Trash2, Link2 } from "lucide-react";
import { FieldContainer } from "@/components/ui/field-container";
import { FieldLabel } from "@/components/ui/field-label";
import { RelationshipSelect } from "./RelationshipSelect";
import { InlineCreate } from "./InlineCreate";
import { InlineEdit } from "./InlineEdit";
import { getItemAction } from "@/features/dashboard/actions/getItemAction";
import useSWR from "swr";
import Link from "next/link";
import { Fields } from "@/features/dashboard/components/Fields";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { getFieldViews } from "@/features/dashboard/views/registry";

interface CardsProps {
  field: {
    refListKey: string;
    refLabelField: string;
    refSearchFields?: string[];
    many?: boolean;
    label: string;
    path: string;
    isRequired?: boolean;
    hideCreate?: boolean;
    displayOptions?: {
      cardFields: string[];
      inlineCreate?: {
        fields: string[];
      };
      inlineEdit?: {
        fields: string[];
      };
      linkToItem?: boolean;
      removeMode?: "disconnect";
      inlineConnect?: boolean;
    };
  };
  value: {
    kind: "cards-view";
    currentIds: Set<string>;
    id: string | null;
    initialIds: Set<string>;
    itemBeingCreated: boolean;
    itemsBeingEdited: Set<string>;
    displayOptions: {
      cardFields: string[];
      linkToItem: boolean;
      removeMode: "disconnect" | "none";
      inlineCreate: { fields: string[] } | null;
      inlineEdit: { fields: string[] } | null;
      inlineConnect: boolean;
    };
  };
  list: any;
  foreignList: any;
  forceValidation?: boolean;
  autoFocus?: boolean;
  onChange?: (newValue: any) => void;
  isDisabled?: boolean;
}

interface CardContainerProps {
  children: React.ReactNode;
  mode: "view" | "create" | "edit";
  className?: string;
}

function CardContainer({
  children,
  mode = "view",
  className = "",
}: CardContainerProps) {
  const tone =
    mode === "edit" ? "bg-[var(--ks-accent)]" : mode === "create" ? "bg-[var(--ks-green)]" : "bg-transparent";

  return (
    <div className={`relative overflow-hidden rounded-[10px] bg-[var(--ks-surface-2)] p-3 shadow-[inset_0_0_0_1px_var(--ks-line)] ${className}`}>
      <div aria-hidden="true" className={`absolute inset-y-0 left-0 w-0.5 ${tone}`} />
      {children}
    </div>
  );
}

export function Cards({
  field,
  value,
  foreignList,
  onChange,
  forceValidation = false,
  isDisabled = false,
}: CardsProps) {
  const [showConnectItems, setShowConnectItems] = useState(false);
  const [hideConnectItemsLabel, setHideConnectItemsLabel] = useState<
    "Cancel" | "Done"
  >("Cancel");
  const [items, setItems] = useState<Record<string, any>>({});
  const editRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(false);

  // Build selectedFields like Keystone does
  const { displayOptions } = value;
  
  const selectedFields = [
    ...new Set([
      ...displayOptions.cardFields,
      ...(displayOptions.inlineEdit?.fields || []),
    ]),
  ]
    .map((fieldPath) => {
      const field = foreignList.fields[fieldPath];
      if (!field) return fieldPath;
      
      // Get the field controller with graphqlSelection
      const fieldViews = getFieldViews(field.viewsIndex);
      const controller = fieldViews.controller(field);
      
      return controller?.graphqlSelection || fieldPath;
    })
    .join("\n");

  // Also include id and the proper label field if not already included
  const labelField = field.refLabelField || foreignList.labelField || "id";
  const finalSelectedFields = `
    id
    ${labelField !== "id" ? `label: ${labelField}` : ""}
    ${selectedFields}
  `;

  // Handle Set serialization issue when passing from server to client
  const currentIds =
    value.currentIds instanceof Set
      ? value.currentIds
      : new Set(Array.isArray(value.currentIds) ? value.currentIds : []);
  const itemsBeingEdited =
    value.itemsBeingEdited instanceof Set
      ? value.itemsBeingEdited
      : new Set(
          Array.isArray(value.itemsBeingEdited) ? value.itemsBeingEdited : []
        );

  const currentIdsArray = Array.from(currentIds);
  const { data: itemsData, error: swrError } = useSWR(
    currentIdsArray.length > 0
      ? `cards-items-${field.refListKey}-${currentIdsArray.join(",")}`
      : null,
    async () => {
      const itemPromises = currentIdsArray.map(async (itemId) => {
        const result = await getItemAction(foreignList, itemId);
        if (result.success) {
          return { id: itemId, data: result.data.item };
        }
        return null;
      });

      const results = await Promise.all(itemPromises);
      return results.filter(Boolean);
    }
  );

  // Update items state when data changes
  useEffect(() => {
    if (itemsData) {
      const newItems: Record<string, any> = {};
      itemsData.forEach((result: any) => {
        if (result && result.data) {
          newItems[result.id] = result.data;
        }
      });
      setItems(newItems);
    }
  }, [itemsData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  });

  useEffect(() => {
    if (value.itemsBeingEdited && editRef.current) {
      editRef.current.focus();
    }
  }, [value]);

  const isReadOnly = !onChange || isDisabled;

  // Convert currentIds to array with items
  const currentIdsArrayWithFetchedItems = Array.from(currentIds)
    .map((id) => ({ id, item: items[id] }))
    .filter((x) => x.item);

  // Handle removing items
  const handleRemoveItem = (itemId: string) => {
    if (!onChange || isReadOnly) return;

    const newCurrentIds = new Set(currentIds);
    newCurrentIds.delete(itemId);
    onChange({
      ...value,
      currentIds: newCurrentIds,
    });
  };

  // Handle edit mode toggle
  const handleEditItem = (itemId: string) => {
    if (!onChange) return;

    onChange({
      ...value,
      itemsBeingEdited: new Set([...itemsBeingEdited, itemId]),
    });
  };

  // Handle save after edit
  const handleSaveEdit = (itemId: string, newItemData: any) => {
    const newItems = { ...items, [itemId]: newItemData };
    setItems(newItems);

    const newItemsBeingEdited = new Set(itemsBeingEdited);
    newItemsBeingEdited.delete(itemId);
    onChange?.({
      ...value,
      itemsBeingEdited: newItemsBeingEdited,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = (itemId: string) => {
    const newItemsBeingEdited = new Set(itemsBeingEdited);
    newItemsBeingEdited.delete(itemId);
    onChange?.({
      ...value,
      itemsBeingEdited: newItemsBeingEdited,
    });
  };

  // Handle inline create
  const handleCreateItem = (newItemData: any) => {
    const id = newItemData.id;
    setItems({ ...items, [id]: newItemData });
    onChange?.({
      ...value,
      itemBeingCreated: false,
      currentIds: field.many ? new Set([...currentIds, id]) : new Set([id]),
    });
  };

  // Create enhanced fields for card display
  const cardFields = useMemo(() => {
    if (!foreignList?.fields) return {};

    // Filter to only card fields and enhance them
    const filteredFields: Record<string, any> = {};
    displayOptions.cardFields.forEach((fieldPath) => {
      if (foreignList.fields[fieldPath]) {
        filteredFields[fieldPath] = foreignList.fields[fieldPath];
      }
    });

    return enhanceFields(filteredFields, foreignList.key);
  }, [foreignList, displayOptions.cardFields]);

  // Deserialize item data for each card field
  const getFieldValue = useCallback(
    (item: any, fieldPath: string) => {
      const field = cardFields[fieldPath];
      if (!field?.controller) return null;

      const itemForField: Record<string, unknown> = {};
      itemForField[fieldPath] = item[fieldPath] ?? null;

      return field.controller.deserialize(itemForField);
    },
    [cardFields]
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Existing Cards */}
      {currentIdsArrayWithFetchedItems.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {currentIdsArrayWithFetchedItems.map(({ id, item }, index) => {
            const isEditMode = !isReadOnly && itemsBeingEdited.has(id);

            return (
              <li key={id}>
                <CardContainer mode={isEditMode ? "edit" : "view"}>
                  <div className="sr-only">
                    <h2>{`${field.label} ${index + 1} ${
                      isEditMode ? "edit" : "view"
                    } mode`}</h2>
                  </div>

                  {isEditMode ? (
                    <InlineEdit
                      list={foreignList}
                      fields={displayOptions.inlineEdit!.fields}
                      item={item}
                      onSave={(newItemData) => handleSaveEdit(id, newItemData)}
                      onCancel={() => handleCancelEdit(id)}
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Card Fields using Fields component */}
                      <Fields
                        list={foreignList}
                        fields={cardFields}
                        value={Object.fromEntries(
                          displayOptions.cardFields.map((fieldPath) => [
                            fieldPath,
                            getFieldValue(item, fieldPath),
                          ])
                        )}
                        onChange={undefined}
                        forceValidation={false}
                        invalidFields={new Set()}
                        isRequireds={{}}
                      />

                      {/* Card Actions */}
                      <div className="ks-track flex-wrap self-end">
                        {displayOptions.linkToItem && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/${foreignList.path}/${id}`}>
                              <ExternalLink />
                              Open
                            </Link>
                          </Button>
                        )}

                        {displayOptions.removeMode === "disconnect" &&
                          !isReadOnly && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              data-variant="danger"
                              onClick={() => handleRemoveItem(id)}
                              title="Unlink (the item is kept)"
                            >
                              <Trash2 />
                              Remove
                            </Button>
                          )}

                        {displayOptions.inlineEdit && !isReadOnly && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(id)}
                          >
                            <Edit />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContainer>
              </li>
            );
          })}
        </ul>
      )}

      {/* Inline Connect Mode */}
      {!isReadOnly && displayOptions.inlineConnect && showConnectItems ? (
        <CardContainer mode="edit">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <RelationshipSelect
                list={foreignList}
                labelField={field.refLabelField}
                searchFields={field.refSearchFields}
                state={{
                  kind: "many",
                  value: Array.from(currentIds).map((id) => ({
                    id,
                    label: items[id]?.label || id,
                  })),
                  onChange: (newItems: { id: string; label: string }[]) => {
                    // TODO: Handle connecting existing items
                    const newCurrentIds = field.many
                      ? new Set(currentIds)
                      : new Set<string>();
                    newItems.forEach((item: { id: string; label: string }) =>
                      newCurrentIds.add(item.id)
                    );
                    onChange?.({
                      ...value,
                      currentIds: newCurrentIds,
                    });
                    setHideConnectItemsLabel("Done");
                  },
                }}
                autoFocus
                placeholder={`Select a ${foreignList.singular}`}
              />
            </div>
            <div className="ks-track">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowConnectItems(false)}>
                {hideConnectItemsLabel}
              </Button>
            </div>
          </div>
        </CardContainer>
      ) : value.itemBeingCreated ? (
        /* Inline Create Mode */
        <CardContainer mode="create">
          <InlineCreate
            list={foreignList}
            fields={displayOptions.inlineCreate!.fields}
            selectedFields={finalSelectedFields}
            onCancel={() => {
              onChange?.({ ...value, itemBeingCreated: false });
            }}
            onCreate={handleCreateItem}
          />
        </CardContainer>
      ) : (displayOptions.inlineCreate || displayOptions.inlineConnect) &&
        !isReadOnly ? (
        /* Create/Connect Actions */
        <CardContainer mode="create">
          <div className="ks-track flex-wrap">
            {displayOptions.inlineCreate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onChange?.({
                    ...value,
                    itemBeingCreated: true,
                  });
                }}
              >
                <Plus />
                New {foreignList.singular.toLowerCase()}
              </Button>
            )}

            {displayOptions.inlineConnect && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowConnectItems(true);
                  setHideConnectItemsLabel("Cancel");
                }}
              >
                <Link2 />
                Link existing
              </Button>
            )}
          </div>
        </CardContainer>
      ) : null}

      {/* Validation Error */}
      {forceValidation && (
        <p className="text-[12px] text-[var(--ks-danger)]">
          You must finish creating and editing any related{" "}
          {foreignList.label?.toLowerCase() || "items"} before saving the{" "}
          {foreignList.singular?.toLowerCase() || "item"}
        </p>
      )}
    </div>
  );
}
