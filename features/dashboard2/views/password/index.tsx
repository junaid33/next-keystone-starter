/**
 * Password field view - Placeholder based on Keystone structure
 */

import React from 'react'

export function Field({ field, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-600">PASSWORD FIELD PLACEHOLDER</div>
        <div className="text-xs text-gray-500">Path: {field.path}</div>
        <div className="text-xs text-gray-500">Value: [HIDDEN]</div>
      </div>
    </div>
  )
}

export function Cell({ item, field }: any) {
  return (
    <span className="text-sm text-gray-400">••••••••</span>
  )
}

export function CardValue({ item, field }: any) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">PASSWORD CARD PLACEHOLDER</div>
    </div>
  )
}

export const controller = (config: any) => ({
  path: config.path,
  label: config.label,
  description: config.description,
  graphqlSelection: `${config.path} { isSet }`,
  defaultValue: "",
  deserialize: (item: any) => "",
  serialize: (value: any) => ({ [config.path]: value }),
  validate: () => true,
})

Cell.supportsLinkTo = false