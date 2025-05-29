/**
 * Field type registry
 * This file manages the registration and access to field types
 */

import * as React from 'react'
import * as text from "./text"
import * as select from "./select"
import * as integer from "./integer"
import * as timestamp from "./timestamp"
import * as float from "./float"
import * as id from "./id"
import * as json from "./json"
import * as password from "./password"
import * as virtual from "./virtual"
import * as relationship from "./relationship"
import * as image from "./image"
import * as document from "./document"
import * as checkbox from "./checkbox"
import type { DataGetter } from '@/lib/utils/dataGetter';

// Define interfaces for field implementations
export interface Field {
  path: string
  label: string
  description?: string
  fieldMeta?: {
    isRequired?: boolean
    min?: number
    max?: number
    isNullable?: boolean
    refListKey?: string
    refLabelField?: string
    many?: boolean
    plural?: string
    searchFields?: string[]
    query?: string
  }
  viewsIndex: number
}

// Type alias for the fieldMeta structure
export type FieldMetaType = Field['fieldMeta'];

export interface FieldControllerConfig {
  listKey: string;
  fieldMeta: FieldMetaType | undefined;
  label: string;
  description: string | null;
  path: string;
  customViews: Record<string, any>;
}

export interface FieldController<Value = unknown, InputValue = Value> {
  path: string;
  label: string;
  description?: string;
  graphqlSelection: string;
  defaultValue: Value;
  deserialize: (data: DataGetter<Record<string, any>>) => Value;
  validate?: (value: Value) => boolean;
  serialize: (value: Value) => Record<string, any>;
  filter?: {
    Filter: React.ComponentType<FilterProps>;
    graphql: (args: { type: string; value: any }) => Record<string, any>;
    Label: (args: { label: string; type: string; value: any }) => string;
    types: Record<string, {
      label: string;
      initialValue: any;
    }>;
  };
}

interface FilterType {
  label: string
  initialValue: string | number | boolean
}

interface FilterTypes {
  [key: string]: FilterType
}

export interface FieldProps<Value = unknown> { // Add export
  field: Field
  value?: Value
  onChange?: (value: Value) => void
  forceValidation?: boolean
}

export interface CellProps { // Add export
  item: Record<string, any>
  field: Field
}

export interface FilterProps { // Add export
  value: string | number | boolean
  onChange: (value: string | number | boolean) => void
  operator: string
}

interface ClientImplementation<Value = unknown> {
  Field: React.ComponentType<FieldProps<Value>>
  Cell: React.ComponentType<CellProps>
  Filter: React.ComponentType<FilterProps>
  controller: (config: Field) => FieldController<Value>
}

interface ServerImplementation {
  getGraphQLSelection: (path: string, fieldMeta?: FieldMetaType) => string
  transformFilter?: (path: string, operator: string, value: any) => Record<string, any>
  getFilterTypes: () => FilterTypes
  formatFilterLabel: (operator: string, value: any) => string
}

export interface FieldImplementation<Value = unknown> { // Change default generic
  client?: {
    Field: React.ComponentType<FieldProps<Value>>
    Filter?: React.ComponentType<FilterProps>
    Cell?: React.ComponentType<CellProps>
    CardValue?: React.ComponentType<CellProps>
    controller?: (config: FieldControllerConfig) => FieldController<Value>
  }
  graphql?: {
    getGraphQLSelection: (path: string, fieldMeta?: FieldMetaType) => string
  }
  server?: {
    transformFilter?: (path: string, operator: string, value: any) => Record<string, any>
  }
  filterTypes?: {
    getFilterTypes: () => FilterTypes
    formatFilterLabel: (operator: string, value: any) => string
  }
}

// Define the field types registry structure
interface FieldTypesRegistry {
  [key: string]: FieldImplementation<unknown> // Reflect default generic change
}

// Map of field types to their implementations
export const fieldTypes: FieldTypesRegistry = {
  text: text as unknown as FieldImplementation<string>,
  select: select as unknown as FieldImplementation<string>,
  integer: integer as unknown as FieldImplementation<number>,
  timestamp: timestamp as unknown as FieldImplementation<Date>,
  float: float as unknown as FieldImplementation<number>,
  id: id as unknown as FieldImplementation<string>,
  json: json as unknown as FieldImplementation<unknown>,
  password: password as unknown as FieldImplementation<string>,
  virtual: virtual as unknown as FieldImplementation<unknown>,
  relationship: relationship as unknown as FieldImplementation<unknown>,
  image: image as unknown as FieldImplementation<unknown>,
  document: document as unknown as FieldImplementation<unknown>,
  checkbox: checkbox as unknown as FieldImplementation<boolean>,
}

/**
 * Unified function to get field implementation
 * 
 * This function returns the field implementation, which includes both
 * client-side and server-side functionality. Next.js enforces client/server
 * boundaries at runtime, so the appropriate functions will be available
 * based on the context.
 * 
 * @param fieldType The field type name (e.g., "select")
 * @returns The field implementation
 */
export function getField(fieldType: string): FieldImplementation {
  const implementation = fieldTypes[fieldType]
  if (!implementation) {
    throw new Error(`Field type "${fieldType}" not found`)
  }

  return implementation
}

/**
 * Get the field type from a field's viewsIndex
 * @param viewsIndex The views index of the field
 * @returns The field type name
 */
export function getFieldTypeFromViewsIndex(viewsIndex: number): string {
  const viewsIndexToType: Record<number, string> = {
    // 0: "id",
    // 1: "virtual",
    // 2: "text",
    // 3: "checkbox",
    // 4: "json",
    // 5: "relationship",
    // 6: "timestamp",
    // 7: "select",
    // 8: "integer",
    // 9: "image",
    // 10: "float",
    // 11: "document",
    // 12: "password",
      0: "id",
    1: "text",
    2: "checkbox",
    3: "relationship",
    4: "password"
  }

  const fieldType = viewsIndexToType[viewsIndex]
  if (!fieldType) {
    throw new Error(`Invalid views index: ${viewsIndex}`)
  }

  return fieldType
}