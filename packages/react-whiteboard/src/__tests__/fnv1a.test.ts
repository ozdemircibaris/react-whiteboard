import { describe, it, expect } from 'vitest'
import { fnv1a32, stableRound, hashObjectProps } from '../utils/fnv1a'

describe('fnv1a32', () => {
  it('returns a 32-bit unsigned integer', () => {
    const hash = fnv1a32('hello')
    expect(hash).toBeGreaterThanOrEqual(0)
    expect(hash).toBeLessThanOrEqual(0xFFFFFFFF)
  })

  it('produces same hash for same input', () => {
    expect(fnv1a32('test')).toBe(fnv1a32('test'))
  })

  it('produces different hashes for different inputs', () => {
    expect(fnv1a32('abc')).not.toBe(fnv1a32('abd'))
  })

  it('handles empty string', () => {
    const hash = fnv1a32('')
    expect(hash).toBeGreaterThanOrEqual(0)
  })
})

describe('stableRound', () => {
  it('rounds to 4 decimal places as integer', () => {
    expect(stableRound(1.23456)).toBe(12346)
    expect(stableRound(0)).toBe(0)
    expect(stableRound(100)).toBe(1000000)
  })

  it('eliminates floating-point drift', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(stableRound(0.1 + 0.2)).toBe(stableRound(0.3))
  })
})

describe('hashObjectProps', () => {
  it('returns a base-36 string', () => {
    const result = hashObjectProps({ fill: '#ff0000', strokeWidth: 2 })
    expect(result).toMatch(/^[0-9a-z]+$/)
  })

  it('same props produce same hash', () => {
    const props = { fill: '#ff0000', stroke: '#000', strokeWidth: 2 }
    expect(hashObjectProps(props)).toBe(hashObjectProps({ ...props }))
  })

  it('different props produce different hash', () => {
    const a = { fill: '#ff0000', strokeWidth: 2 }
    const b = { fill: '#00ff00', strokeWidth: 2 }
    expect(hashObjectProps(a)).not.toBe(hashObjectProps(b))
  })

  it('is order-independent (keys are sorted)', () => {
    const a = { stroke: '#000', fill: '#fff' }
    const b = { fill: '#fff', stroke: '#000' }
    expect(hashObjectProps(a)).toBe(hashObjectProps(b))
  })

  it('handles nested objects', () => {
    const a = { start: { x: 10, y: 20 }, end: { x: 30, y: 40 } }
    const b = { start: { x: 10, y: 20 }, end: { x: 30, y: 40 } }
    expect(hashObjectProps(a)).toBe(hashObjectProps(b))
  })

  it('handles arrays', () => {
    const a = { points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }
    const b = { points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }
    expect(hashObjectProps(a)).toBe(hashObjectProps(b))
  })

  it('handles null and undefined values', () => {
    const a = { fill: null, stroke: undefined }
    const b = { fill: null, stroke: undefined }
    expect(hashObjectProps(a as Record<string, unknown>)).toBe(
      hashObjectProps(b as Record<string, unknown>),
    )
  })
})
