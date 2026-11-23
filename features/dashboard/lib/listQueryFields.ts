/**
 * Which fields the list page selects: id, the visible columns, plus the label field
 * (the row title) and the status field (the dot on the title line).
 * Plain module, safe on server and client.
 */
import { getFieldTypeFromViewsIndex } from '../views/getFieldTypeFromViewsIndex'

export function findStatusField(fields: Record<string, any>): any | null {
  for (const field of Object.values(fields || {}) as any[]) {
    if (!/^(status|state|stage)$/i.test(field?.path || '')) continue
    try {
      if (getFieldTypeFromViewsIndex(field.viewsIndex) === 'select') return field
    } catch {
      // unknown views index: not a status field
    }
  }
  return null
}

export function listColumns(list: any, fieldsParam?: string | null): string[] {
  const fields = list?.fields || {}
  if (fieldsParam) {
    const fromUrl = fieldsParam.split(',').filter((f) => f in fields)
    if (fromUrl.length) return fromUrl
  }
  if (list?.initialColumns?.length) return list.initialColumns
  return Object.keys(fields).filter((k) => ['name', 'title', 'label', 'createdAt', 'updatedAt'].includes(k))
}

export function listQueryFields(list: any, fieldsParam?: string | null): string[] {
  const fields = list?.fields || {}
  const out = ['id', ...listColumns(list, fieldsParam)]
  if (list?.labelField && fields[list.labelField]) out.push(list.labelField)
  const status = findStatusField(fields)
  if (status) out.push(status.path)
  return [...new Set(out)]
}
