/** Preserve recorded provenance on partial edits; an explicit blank clears it. */
export function provenanceText(
  payload: Record<string, unknown>,
  field: string,
  existing: unknown = null,
): string | null {
  const value = Object.prototype.hasOwnProperty.call(payload, field) ? payload[field] : existing
  return String(value ?? '').trim() || null
}
