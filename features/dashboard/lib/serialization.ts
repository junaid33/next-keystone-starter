import type { GraphQLError } from 'graphql'

export type ItemData = { id: string, [key: string]: unknown }

export type DeserializedValue = Record<
  string,
  | { kind: 'error', errors: readonly [GraphQLError, ...GraphQLError[]] }
  | { kind: 'value', value: unknown }
>

export function serializeValueToObjByFieldKey (
  fields: Record<string, any>,
  value: DeserializedValue
): Record<string, Record<string, any>> {
  const obj: Record<string, Record<string, any>> = {}
  Object.keys(fields).map(fieldKey => {
    const val = value[fieldKey]
    if (val.kind === 'value') {
      obj[fieldKey] = fields[fieldKey].controller.serialize(val.value)
    }
  })
  return obj
}

export function deserializeValue (
  fields: Record<string, any>,
  itemGetter: any
): DeserializedValue {
  const value: DeserializedValue = {}
  Object.keys(fields).forEach(fieldKey => {
    const field = fields[fieldKey]
    const itemForField: Record<string, unknown> = {}
    const errors = new Set<GraphQLError>()
    
    // Get field data from itemGetter
    const fieldData = itemGetter.get ? itemGetter.get(fieldKey) : itemGetter[fieldKey]
    
    if (fieldData?.errors) {
      fieldData.errors.forEach((error: GraphQLError) => {
        errors.add(error)
      })
    }
    
    itemForField[fieldKey] = fieldData?.data || fieldData
    
    if (errors.size) {
      value[fieldKey] = { kind: 'error', errors: [...errors] as [GraphQLError, ...GraphQLError[]] }
    } else {
      value[fieldKey] = { kind: 'value', value: field.controller.deserialize(itemForField) }
    }
  })
  return value
}