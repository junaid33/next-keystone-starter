/**
 * Float field view - Placeholder based on Keystone structure
 */

import React from 'react'

export function Field({ field, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-600">FLOAT FIELD PLACEHOLDER</div>
        <div className="text-xs text-gray-500">Path: {field.path}</div>
        <div className="text-xs text-gray-500">Value: {JSON.stringify(value)}</div>
      </div>
    </div>
  )
}

export function Cell({ item, field }: any) {
  const value = item[field.path]
  return (
    <span className="text-sm font-mono">
      {value !== null && value !== undefined ? value.toFixed(2) : <span className="text-gray-400">FLOAT PLACEHOLDER</span>}
    </span>
  )
}

export function CardValue({ item, field }: any) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">FLOAT CARD PLACEHOLDER</div>
    </div>
  )
}

export const controller = (config: any) => ({
  path: config.path,
  label: config.label,
  description: config.description,
  graphqlSelection: config.path,
  defaultValue: 0.0,
  deserialize: (item: any) => parseFloat(item[config.path]) || 0.0,
  serialize: (value: any) => ({ [config.path]: parseFloat(value) }),
  validate: () => true,
})

Cell.supportsLinkTo = false