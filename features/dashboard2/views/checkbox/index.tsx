/**
 * Checkbox field view - Placeholder based on Keystone structure
 */

import React from 'react'

export function Field({ field, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-600">CHECKBOX FIELD PLACEHOLDER</div>
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
        <span className="text-green-600">✓ True</span>
      ) : (
        <span className="text-gray-400">✗ False</span>
      )}
    </span>
  )
}

export function CardValue({ item, field }: any) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">CHECKBOX CARD PLACEHOLDER</div>
    </div>
  )
}

export const controller = (config: any) => ({
  path: config.path,
  label: config.label,
  description: config.description,
  graphqlSelection: config.path,
  defaultValue: false,
  deserialize: (item: any) => Boolean(item[config.path]),
  serialize: (value: any) => ({ [config.path]: Boolean(value) }),
  validate: () => true,
})

Cell.supportsLinkTo = false