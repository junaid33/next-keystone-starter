"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getItemAction } from "@/features/dashboard/actions";

interface UseItemStateProps {
  selectedFields: string[];
  localList: any;
  field: any;
  id: string | null;
  currentIds: Set<string>;
}

export function useItemState({
  selectedFields,
  localList,
  field,
  id,
  currentIds
}: UseItemStateProps) {
  const [items, setItems] = useState<Record<string, any>>({});

  // Build GraphQL selection for the relationship field
  const relationshipSelection = selectedFields.map(fieldPath => {
    const fieldConfig = field.foreignList?.fields?.[fieldPath];
    if (fieldConfig?.type === 'image') {
      // For image fields, get both url and altText
      return `${fieldPath} { url altText }`;
    }
    return fieldPath;
  }).join('\n');

  // Fetch item data if we have an id
  const { data: itemData, error } = useSWR(
    id ? `item-${localList.key}-${id}` : null,
    async () => {
      if (!id) return null;
      
      const graphqlSelection = `
        id
        ${field.path} {
          id
          label: ${field.refLabelField || 'id'}
          ${relationshipSelection}
        }
      `;
      
      const result = await getItemAction(localList.key, id, graphqlSelection);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch item data');
      }
    }
  );

  // Update items state when data changes
  useEffect(() => {
    if (itemData) {
      const relationshipData = itemData[field.path];
      const newItems: Record<string, any> = {};
      
      if (Array.isArray(relationshipData)) {
        relationshipData.forEach((item: any) => {
          newItems[item.id] = item;
        });
      } else if (relationshipData && relationshipData.id) {
        newItems[relationshipData.id] = relationshipData;
      }
      
      setItems(newItems);
    }
  }, [itemData, field.path]);

  // Also fetch individual items for currentIds that aren't in our fetched data
  const missingIds = Array.from(currentIds).filter(id => !items[id]);
  
  // Fetch missing items individually if needed
  const { data: missingItemsData } = useSWR(
    missingIds.length > 0 ? `missing-items-${field.refListKey}-${missingIds.join(',')}` : null,
    async () => {
      if (missingIds.length === 0) return [];
      
      const promises = missingIds.map(async (itemId) => {
        const result = await getItemAction(field.refListKey, itemId, `
          id
          label: ${field.refLabelField || 'id'}
          ${relationshipSelection}
        `);
        
        if (result.success) {
          return result.data;
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      return results.filter(Boolean);
    }
  );

  // Update items with missing data
  useEffect(() => {
    if (missingItemsData && missingItemsData.length > 0) {
      setItems(prev => {
        const newItems = { ...prev };
        missingItemsData.forEach((item: any) => {
          if (item && item.id) {
            newItems[item.id] = item;
          }
        });
        return newItems;
      });
    }
  }, [missingItemsData]);

  const loading = id !== null && !itemData && !error;
  const hasError = !!error;

  return {
    items,
    setItems,
    loading,
    error: hasError,
    state: loading ? { kind: 'loading' as const } : 
           hasError ? { kind: 'error' as const, message: error.message } : 
           { kind: 'loaded' as const }
  };
}