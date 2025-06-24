/**
 * Relationship field view - Placeholder based on Keystone structure
 */

import React from 'react'

export function Field({ field, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-600">RELATIONSHIP FIELD PLACEHOLDER</div>
        <div className="text-xs text-gray-500">Path: {field.path}</div>
        <div className="text-xs text-gray-500">Value: {JSON.stringify(value)}</div>
      </div>
    </div>
  )
}

export function Cell({ item, field }: any) {
  const value = item[field.path]
  return (
    <span className="text-sm">
      {value ? (
        <span className="text-blue-600">Related Item</span>
      ) : (
        <span className="text-gray-400">RELATIONSHIP PLACEHOLDER</span>
      )}
    </span>
  )
}

export function CardValue({ item, field }: any) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">RELATIONSHIP CARD PLACEHOLDER</div>
    </div>
  )
}

export const controller = (config: any) => ({
  path: config.path,
  label: config.label,
  description: config.description,
  graphqlSelection: `${config.path} { id label: ${config.fieldMeta?.refLabelField || 'name'} }`,
  defaultValue: null,
  deserialize: (item: any) => item[config.path] || null,
  serialize: (value: any) => ({ [config.path]: value }),
  validate: () => true,
})

Cell.supportsLinkTo = true