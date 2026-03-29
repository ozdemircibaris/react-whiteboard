/**
 * FNV-1a 32-bit hash — a fast, non-cryptographic hash function.
 * Used to produce compact cache keys from shape properties.
 *
 * @see https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
 */

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

/**
 * Compute FNV-1a 32-bit hash from a string.
 * Returns the hash as an unsigned 32-bit integer.
 */
export function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME) >>> 0
  }
  return hash >>> 0
}

/**
 * Round a number to 4 decimal places (multiply by 1e4, round, keep as int).
 * Prevents floating-point precision drift from producing different cache keys
 * for visually identical values.
 */
export function stableRound(v: number): number {
  return Math.round(v * 1e4)
}

/**
 * Build a stable hash string from an object's values.
 * Recursively walks the object, sorting keys for deterministic ordering,
 * and feeds all scalar values into a single pipe-delimited string
 * that is then hashed with FNV-1a and returned as base-36.
 */
export function hashObjectProps(obj: Record<string, unknown>): string {
  const parts: string[] = []
  collectValues(obj, parts)
  return fnv1a32(parts.join('|')).toString(36)
}

function collectValues(value: unknown, parts: string[]): void {
  if (value === null || value === undefined) {
    parts.push('')
    return
  }
  if (typeof value === 'number') {
    parts.push(String(stableRound(value)))
    return
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    parts.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    parts.push(`[${value.length}]`)
    for (const item of value) {
      collectValues(item, parts)
    }
    return
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    for (const key of keys) {
      parts.push(key)
      collectValues(record[key], parts)
    }
  }
}
