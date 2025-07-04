"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Edit, Trash2 } from "lucide-react";
import { FieldContainer } from "@/components/ui/field-container";
import { FieldLabel } from "@/components/ui/field-label";
import { RelationshipSelect } from "./RelationshipSelect";
import { InlineCreate } from "./InlineCreate";
import { InlineEdit } from "./InlineEdit";
import { getItemAction } from "@/features/dashboard/actions/getItemAction";
import useSWR from "swr";
import Link from "next/link";


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

function CardContainer({ children, mode = "view", className = "" }: CardContainerProps) {
  const borderColor = mode === "edit" ? "border-l-blue-500" : mode === "create" ? "border-l-green-500" : "border-l-gray-300";
  
  return (
    <div className={`relative pl-6 ${className}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded ${borderColor}`} />
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
  isDisabled = false
}: CardsProps) {
  const [showConnectItems, setShowConnectItems] = useState(false);
  const [hideConnectItemsLabel, setHideConnectItemsLabel] = useState<"Cancel" | "Done">("Cancel");
  const [items, setItems] = useState<Record<string, any>>({});
  const editRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(false);

  // Build selectedFields like Keystone does
  const { displayOptions } = value;
  const selectedFields = [
    ...new Set([...displayOptions.cardFields, ...(displayOptions.inlineEdit?.fields || [])]),
  ]
    .map(fieldPath => {
      const fieldController = foreignList.fields[fieldPath]?.controller;
      return fieldController?.graphqlSelection || fieldPath;
    })
    .join('\n');

  // Also include id and label if not already included
  const finalSelectedFields = `
    id
    label: ${field.refLabelField || 'id'}
    ${selectedFields}
  `;

  // Handle Set serialization issue when passing from server to client
  const currentIds = value.currentIds instanceof Set 
    ? value.currentIds 
    : new Set(Array.isArray(value.currentIds) ? value.currentIds : []);
  const initialIds = value.initialIds instanceof Set 
    ? value.initialIds 
    : new Set(Array.isArray(value.initialIds) ? value.initialIds : []);
  const itemsBeingEdited = value.itemsBeingEdited instanceof Set 
    ? value.itemsBeingEdited 
    : new Set(Array.isArray(value.itemsBeingEdited) ? value.itemsBeingEdited : []);
  
  const currentIdsArray = Array.from(currentIds);
  const { data: itemsData, error: swrError } = useSWR(
    currentIdsArray.length > 0 ? `cards-items-${field.refListKey}-${currentIdsArray.join(',')}` : null,
    async () => {
      console.log(`🔍 SWR FETCHING for ${field.refListKey}:`, {
        currentIdsArray,
        finalSelectedFields
      });
      
      const itemPromises = currentIdsArray.map(async (itemId) => {
        console.log(`🔍 Calling getItemAction for ${field.refListKey}/${itemId}`);
        const result = await getItemAction(foreignList, itemId);
        console.log(`🔍 getItemAction result for ${itemId}:`, result);
        
        if (result.success) {
          return { id: itemId, data: result.data.item };
        }
        return null;
      });
      
      const results = await Promise.all(itemPromises);
      console.log(`🔍 Final SWR results:`, results);
      return results.filter(Boolean);
    }
  );
  
  // Log SWR errors
  if (swrError) {
    console.error(`🔍 SWR ERROR for ${field.refListKey}:`, swrError);
  }

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
    .map(id => ({ id, item: items[id] }))
    .filter(x => x.item);

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

  // Render field value for a card field
  const renderFieldValue = (item: any, fieldPath: string) => {
    const fieldValue = item[fieldPath];
    
    if (fieldValue == null) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    // Handle different field types
    if (typeof fieldValue === "object" && fieldValue.url) {
      // Image field
      return (
        <img 
          src={fieldValue.url} 
          alt={fieldValue.altText || fieldPath}
          className="w-full h-32 object-cover rounded border"
        />
      );
    }
    
    if (typeof fieldValue === "boolean") {
      return (
        <Badge variant={fieldValue ? "default" : "secondary"}>
          {fieldValue ? "Yes" : "No"}
        </Badge>
      );
    }
    
    return <span>{String(fieldValue)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Existing Cards */}
      {currentIdsArrayWithFetchedItems.length > 0 && (
        <ul className="space-y-4 list-none p-0 m-0">
          {currentIdsArrayWithFetchedItems.map(({ id, item }, index) => {
            const isEditMode = !isReadOnly && itemsBeingEdited.has(id);
            
            return (
              <li key={id}>
                <CardContainer mode={isEditMode ? "edit" : "view"}>
                  <div className="sr-only">
                    <h2>{`${field.label} ${index + 1} ${isEditMode ? "edit" : "view"} mode`}</h2>
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
                    <div className="space-y-6">
                      {/* Card Fields */}
                      {displayOptions.cardFields.map(fieldPath => {
                        const fieldConfig = foreignList?.fields?.[fieldPath];
                        const fieldLabel = fieldConfig?.label || fieldPath;
                        
                        return (
                          <FieldContainer key={fieldPath}>
                            <FieldLabel>{fieldLabel}</FieldLabel>
                            <div className="mt-1">
                              {renderFieldValue(item, fieldPath)}
                            </div>
                          </FieldContainer>
                        );
                      })}
                      
                      {/* Card Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {displayOptions.inlineEdit && !isReadOnly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {displayOptions.removeMode === "disconnect" && !isReadOnly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveItem(id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            title="This item will not be deleted. It will only be removed from this field."
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                        
                        {displayOptions.linkToItem && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Link href={`/${foreignList.path}/${id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View {foreignList.singular} details
                            </Link>
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
                  value: Array.from(currentIds).map(id => ({ id, label: items[id]?.label || id })),
                  onChange: (newItems: { id: string; label: string }[]) => {
                    // TODO: Handle connecting existing items
                    const newCurrentIds = field.many ? new Set(currentIds) : new Set<string>();
                    newItems.forEach((item: { id: string; label: string }) => newCurrentIds.add(item.id));
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
            <Button 
              size="sm"
              onClick={() => setShowConnectItems(false)}
            >
              {hideConnectItemsLabel}
            </Button>
          </div>
        </CardContainer>
      ) : value.itemBeingCreated ? (
        /* Inline Create Mode */
        <CardContainer mode="create">
          <InlineCreate
            list={foreignList}
            fields={displayOptions.inlineCreate!.fields}
            onCancel={() => {
              onChange?.({ ...value, itemBeingCreated: false });
            }}
            onCreate={handleCreateItem}
          />
        </CardContainer>
      ) : (displayOptions.inlineCreate || displayOptions.inlineConnect) && !isReadOnly ? (
        /* Create/Connect Actions */
        <CardContainer mode="create">
          <div className="flex gap-2">
            {displayOptions.inlineCreate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onChange?.({
                    ...value,
                    itemBeingCreated: true,
                  });
                }}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create {foreignList.singular}
              </Button>
            )}
            
            {displayOptions.inlineConnect && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowConnectItems(true);
                  setHideConnectItemsLabel("Cancel");
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Link existing {foreignList.singular}
              </Button>
            )}
          </div>
        </CardContainer>
      ) : null}

      {/* Validation Error */}
      {forceValidation && (
        <p className="text-sm text-red-600">
          You must finish creating and editing any related {foreignList.label?.toLowerCase() || "items"} before
          saving the {foreignList.singular?.toLowerCase() || "item"}
        </p>
      )}
    </div>
  );
}