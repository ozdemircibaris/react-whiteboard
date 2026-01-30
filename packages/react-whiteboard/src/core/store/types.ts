import type { WhiteboardStore } from './createStore'

/**
 * Zustand set/get API passed to action creator functions.
 * Decouples action modules from Zustand's internal types.
 */
export interface StoreApi {
  set: (
    partial:
      | Partial<WhiteboardStore>
      | ((state: WhiteboardStore) => Partial<WhiteboardStore>),
  ) => void
  get: () => WhiteboardStore
}
