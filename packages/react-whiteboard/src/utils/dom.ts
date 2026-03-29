/**
 * Checks whether an event target is an input-like element that should
 * prevent keyboard shortcuts from firing (text inputs, textareas,
 * selects, and contenteditable elements).
 */
export function isInputTarget(target: EventTarget | null): boolean {
  if (!target) return false

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  return false
}
