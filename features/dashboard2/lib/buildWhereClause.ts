/**
 * Build WHERE clause from URL search parameters
 * Server-side filter processing without React components
 * Based on Keystone's useFilters implementation
 */

import { getFieldTypeFromViewsIndex } from '../views/getFieldTypeFromViewsIndex'

export type Filter = {
  field: string
  type: string
  value: any
}

// Server-side filter mappings for different field types - extracted from field controllers
const FIELD_FILTER_MAPPINGS: Record<string, {
  types: Record<string, { label: string; initialValue: any }>;
  graphql: (fieldPath: string, fieldMeta: any) => (args: { type: string; value: any }) => Record<string, any>;
}> = {
  text: {
    types: {
      contains_i: { label: 'Contains', initialValue: '' },
      not_contains_i: { label: 'Does not contain', initialValue: '' },
      is_i: { label: 'Is exactly', initialValue: '' },
      not_i: { label: 'Is not exactly', initialValue: '' },
      starts_with_i: { label: 'Starts with', initialValue: '' },
      not_starts_with_i: { label: 'Does not start with', initialValue: '' },
      ends_with_i: { label: 'Ends with', initialValue: '' },
      not_ends_with_i: { label: 'Does not end with', initialValue: '' },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      const isNot = type.startsWith('not_')
      const key = type === 'is_i' || type === 'not_i'
        ? 'equals'
        : type
            .replace(/_i$/, '')
            .replace('not_', '')
            .replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
      const filter = { [key]: value }
      return {
        [fieldPath]: {
          ...(isNot ? { not: filter } : filter),
          mode: fieldMeta?.shouldUseModeInsensitive ? 'insensitive' : undefined,
        },
      }
    },
  },
  checkbox: {
    types: {
      is: { label: 'Is', initialValue: true },
      not: { label: 'Is not', initialValue: true },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: boolean }) => {
      return {
        [fieldPath]: {
          equals: type === 'not' ? !value : value,
        },
      }
    },
  },
  integer: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: number }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  float: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      const val = value === null ? null : parseFloat(value)
      if (type === 'not') return { [fieldPath]: { not: { equals: val } } }
      return { [fieldPath]: { [type]: val } }
    },
  },
  bigInt: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  decimal: {
    types: {
      equals: { label: 'Is exactly', initialValue: null },
      not: { label: 'Is not exactly', initialValue: null },
      gt: { label: 'Is greater than', initialValue: null },
      lt: { label: 'Is less than', initialValue: null },
      gte: { label: 'Is greater than or equal to', initialValue: null },
      lte: { label: 'Is less than or equal to', initialValue: null },
      empty: { label: 'Is empty', initialValue: null },
      not_empty: { label: 'Is not empty', initialValue: null },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type === 'empty') return { [fieldPath]: { equals: null } }
      if (type === 'not_empty') return { [fieldPath]: { not: { equals: null } } }
      if (type === 'not') return { [fieldPath]: { not: { equals: value } } }
      return { [fieldPath]: { [type]: value } }
    },
  },
  id: {
    types: {
      equals: { label: 'Equals', initialValue: '' },
      not_equals: { label: 'Does not equal', initialValue: '' },
      contains: { label: 'Contains', initialValue: '' },
      not_contains: { label: 'Does not contain', initialValue: '' },
    },
    graphql: (fieldPath: string, fieldMeta: any) => ({ type, value }: { type: string; value: string }) => {
      if (type.startsWith('not_')) {
        const actualType = type.replace('not_', '')
        return { [fieldPath]: { not: { [actualType]: value } } }
      }
      return { [fieldPath]: { [type]: value } }
    },
  },
}

function getFieldFilterMapping(fieldType: string) {
  return FIELD_FILTER_MAPPINGS[fieldType] || null
}

export function buildWhereClause(
  list: any,
  searchParams: Record<string, any>
): Record<string, any> {
  // Build map of possible filters using server-side mappings
  const possibleFilters: Record<string, { type: string; field: string; fieldPath: string; fieldMeta: any }> = {}
  
  for (const [fieldPath, field] of Object.entries(list.fields)) {
    if (typeof field.viewsIndex === 'number') {
      try {
        const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex)
        const filterMapping = getFieldFilterMapping(fieldType)
        
        if (filterMapping) {
          for (const filterType in filterMapping.types) {
            possibleFilters[`!${fieldPath}_${filterType}`] = {
              type: filterType,
              field: fieldType,
              fieldPath,
              fieldMeta: field.fieldMeta,
            }
          }
        }
      } catch (error) {
        // Skip fields with invalid viewsIndex
        continue
      }
    }
  }
  
  // Parse filters from search params - exact Keystone logic
  const filters: Filter[] = []
  for (const key in searchParams) {
    const filter = possibleFilters[key]
    if (!filter) continue
    
    const val = searchParams[key]
    if (typeof val !== 'string') continue
    
    try {
      const value = JSON.parse(val)
      filters.push({ ...filter, value })
    } catch (err) {
      // Skip invalid JSON values
      continue
    }
  }
  
  // Convert filters to GraphQL where clause using server-side mappings
  const whereConditions = filters.map(filter => {
    const filterMapping = getFieldFilterMapping(filter.field)
    if (!filterMapping) return {}
    
    return filterMapping.graphql(filter.fieldPath, filter.fieldMeta)({
      type: filter.type,
      value: filter.value,
    })
  }).filter(condition => Object.keys(condition).length > 0)
  
  // Return combined where clause
  if (whereConditions.length === 0) {
    return {}
  }
  
  return { AND: whereConditions }
}