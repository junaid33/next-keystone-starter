/**
 * Presentation only: map a status-like option value to a dot tone.
 * Unknown values stay neutral so new options never get a misleading colour.
 */
export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'violet' | 'gray'

export function statusTone(value: unknown): Tone {
  const v = String(value ?? '').toLowerCase()
  if (!v) return 'gray'
  if (/(block|fail|error|cancel|reject|revoked|expired|disabled|overdue|lost)/.test(v)) return 'red'
  if (/^(done|complete|completed|active|approved|paid|published|resolved|success|succeeded|enabled|live|true)$/.test(v)) return 'green'
  if (/(progress|doing|started|running|review|processing)/.test(v)) return 'blue'
  if (/(pending|waiting|scheduled|hold|paused|draft)/.test(v)) return 'amber'
  return 'gray'
}
