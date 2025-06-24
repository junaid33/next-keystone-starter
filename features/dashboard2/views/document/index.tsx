/**
 * Document field view - Simplified rich text implementation
 * Note: This is a simplified version. Full implementation would require Slate.js editor
 */

import React, { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Simplified document structure - in reality this would be Slate.js nodes
type DocumentValue = Array<{
  type: 'paragraph' | 'heading' | 'blockquote'
  children: Array<{ text: string }>
}>

interface DocumentFieldProps {
  field: {
    path: string
    label: string
    description?: string
  }
  value: DocumentValue
  onChange?: (value: DocumentValue) => void
  autoFocus?: boolean
  forceValidation?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: any
  value?: DocumentValue
}

// Convert document to plain text for editing
function documentToText(document: DocumentValue): string {
  if (!document || !Array.isArray(document)) return ''
  return document
    .map(node => 
      node.children?.map(child => child.text || '').join('') || ''
    )
    .join('\n')
}

// Convert plain text back to document structure
function textToDocument(text: string): DocumentValue {
  if (!text.trim()) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }
  
  return text.split('\n').map(line => ({
    type: 'paragraph' as const,
    children: [{ text: line }]
  }))
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
}: DocumentFieldProps) {
  const [textValue, setTextValue] = useState(() => documentToText(value))
  const isReadOnly = onChange === undefined

  const handleChange = (newText: string) => {
    setTextValue(newText)
    if (onChange) {
      onChange(textToDocument(newText))
    }
  }

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <div className="relative">
        <Textarea
          autoFocus={autoFocus}
          readOnly={isReadOnly}
          onChange={(e) => handleChange(e.target.value)}
          value={textValue}
          className="min-h-32 font-sans"
          placeholder="Start typing your content..."
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Document
          </Badge>
        </div>
      </div>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Note: This is a simplified rich text editor. Full implementation would include formatting options.
      </p>
    </div>
  )
}

export function Cell({ item, field, value }: CellProps) {
  const fieldValue = value ?? item[field.path]?.document
  const text = documentToText(fieldValue)
  
  return (
    <div className="flex items-center gap-2">
      {text ? (
        <>
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate max-w-32">
            {text.slice(0, 50)}{text.length > 50 ? '...' : ''}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )}
    </div>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]?.document
  const text = documentToText(value)
  
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {text ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Document</span>
            </div>
            <div className="text-xs bg-muted p-2 rounded max-h-20 overflow-auto">
              {text.slice(0, 100)}{text.length > 100 ? '...' : ''}
            </div>
          </div>
        ) : (
          '—'
        )}
      </div>
    </div>
  )
}

type DocumentFieldMeta = {
  documentFeatures: any
  relationships: any
  componentBlocksPassedOnServer: string[]
}

export function controller(
  config: FieldControllerConfig<DocumentFieldMeta>
): FieldController<DocumentValue> {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} { document(hydrateRelationships: true) }`,
    defaultValue: [{ type: 'paragraph', children: [{ text: '' }] }],
    deserialize: data => {
      const documentFromServer = data[config.path]?.document
      if (!documentFromServer || !Array.isArray(documentFromServer)) {
        return [{ type: 'paragraph', children: [{ text: '' }] }]
      }
      return documentFromServer
    },
    serialize: value => ({
      [config.path]: value,
    }),
    validate: () => true, // Simplified validation
  }
}

Cell.supportsLinkTo = false