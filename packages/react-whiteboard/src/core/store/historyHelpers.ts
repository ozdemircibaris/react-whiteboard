import { nanoid } from 'nanoid'
import type { HistoryAction, HistoryEntry } from '../../types'

export const MAX_HISTORY = 100

export function createHistoryEntry(action: HistoryAction): HistoryEntry {
  return {
    id: nanoid(),
    timestamp: Date.now(),
    action,
  }
}

export function pushHistory(
  history: HistoryEntry[],
  historyIndex: number,
  entry: HistoryEntry
): { history: HistoryEntry[]; historyIndex: number } {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(entry)
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift()
  }
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}
