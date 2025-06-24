/**
 * Select field view - Placeholder based on Keystone structure
 */

import React from 'react'

export function Field({ field, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-600">SELECT FIELD PLACEHOLDER</div>
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
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{value}</span>
      ) : (
        <span className="text-gray-400">SELECT PLACEHOLDER</span>
      )}
    </span>
  )
}

export function CardValue({ item, field }: any) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">SELECT CARD PLACEHOLDER</div>
    </div>
  )
}

export const controller = (config: any) => ({
  path: config.path,
  label: config.label,
  description: config.description,
  graphqlSelection: config.path,
  defaultValue: null,
  deserialize: (item: any) => item[config.path] || null,
  serialize: (value: any) => ({ [config.path]: value }),
  validate: () => true,
})

Cell.supportsLinkTo = false