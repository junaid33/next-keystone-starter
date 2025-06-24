/**
 * BigInt field view - Placeholder based on Keystone structure
 */

import React from 'react'
import { safeStringify } from '../utils'

export function Field({ field, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-600">BIGINT FIELD PLACEHOLDER</div>
        <div className="text-xs text-gray-500">Path: {field.path}</div>
        <div className="text-xs text-gray-500">Value: {safeStringify(value)}</div>
      </div>
    </div>
  )
}

export function Cell({ item, field }: any) {
  const value = item[field.path]
  return (
    <span className="text-sm font-mono">
      {value !== null && value !== undefined ? value.toString() : <span className="text-gray-400">BIGINT PLACEHOLDER</span>}
    </span>
  )
}

export function CardValue({ item, field }: any) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">BIGINT CARD PLACEHOLDER</div>
    </div>
  )
}

export const controller = (config: any) => ({
  path: config.path,
  label: config.label,
  description: config.description,
  graphqlSelection: config.path,
  defaultValue: 0n,
  deserialize: (item: any) => item[config.path] ? BigInt(item[config.path]) : 0n,
  serialize: (value: any) => ({ [config.path]: value.toString() }),
  validate: () => true,
})

Cell.supportsLinkTo = false