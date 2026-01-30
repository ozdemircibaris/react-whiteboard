import { useMemo, useCallback } from 'react'
import { useWhiteboardStore } from '../core/store'
import type { TextFontFamily, TextShapeProps, TextShape } from '../types'
import { FONT_FAMILIES, FONT_SIZE_PRESETS } from '../utils/fonts'
import type { FontSizePreset } from '../utils/fonts'
import { measureTextLines } from '../utils/fonts'

/**
 * Headless hook for controlling text properties.
 *
 * When text shapes are selected: changes apply to selected shapes AND update
 * the store's default props for future shapes.
 * When nothing is selected: changes only update defaults.
 */
export function useTextProperties() {
  const currentTextProps = useWhiteboardStore((s) => s.currentTextProps)
  const setCurrentTextProps = useWhiteboardStore((s) => s.setCurrentTextProps)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const shapes = useWhiteboardStore((s) => s.shapes)
  const updateShape = useWhiteboardStore((s) => s.updateShape)

  // Gather selected text shapes
  const selectedTextShapes = useMemo(() => {
    const result: TextShape[] = []
    for (const id of selectedIds) {
      const shape = shapes.get(id)
      if (shape && shape.type === 'text') {
        result.push(shape as TextShape)
      }
    }
    return result
  }, [selectedIds, shapes])

  // Resolved props: if one text shape is selected, show its props.
  // If multiple or none, show defaults.
  const currentProps = useMemo<Omit<TextShapeProps, 'text'>>(() => {
    if (selectedTextShapes.length === 1) {
      const { text: _, ...rest } = selectedTextShapes[0]!.props
      return rest
    }
    return currentTextProps
  }, [selectedTextShapes, currentTextProps])

  // Apply partial text props to selected shapes and/or defaults
  const applyProps = useCallback(
    (partial: Partial<Omit<TextShapeProps, 'text'>>) => {
      setCurrentTextProps(partial)

      for (const shape of selectedTextShapes) {
        const newProps = { ...shape.props, ...partial }
        const { width, height } = measureTextLines(shape.props.text, newProps)
        updateShape(shape.id, { width, height, props: newProps }, true)
      }
    },
    [setCurrentTextProps, selectedTextShapes, updateShape],
  )

  const setFontFamily = useCallback(
    (fontFamily: TextFontFamily) => applyProps({ fontFamily }),
    [applyProps],
  )

  const setFontSize = useCallback(
    (fontSize: number) => applyProps({ fontSize }),
    [applyProps],
  )

  const setFontSizePreset = useCallback(
    (preset: FontSizePreset) => applyProps({ fontSize: FONT_SIZE_PRESETS[preset] }),
    [applyProps],
  )

  const setColor = useCallback(
    (color: string) => applyProps({ color }),
    [applyProps],
  )

  const setBackgroundColor = useCallback(
    (backgroundColor: string) => applyProps({ backgroundColor }),
    [applyProps],
  )

  const setAlign = useCallback(
    (align: 'left' | 'center' | 'right') => applyProps({ align }),
    [applyProps],
  )

  const toggleBold = useCallback(() => {
    const next = currentProps.fontWeight === 700 ? 400 : 700
    applyProps({ fontWeight: next })
  }, [currentProps.fontWeight, applyProps])

  const toggleItalic = useCallback(() => {
    const next = currentProps.fontStyle === 'italic' ? 'normal' : 'italic'
    applyProps({ fontStyle: next })
  }, [currentProps.fontStyle, applyProps])

  return {
    /** Resolved text properties (from selection or defaults) */
    currentProps,
    /** Number of selected text shapes */
    selectedCount: selectedTextShapes.length,
    /** Available font families */
    fontFamilies: FONT_FAMILIES,
    /** Available size presets */
    fontSizePresets: FONT_SIZE_PRESETS,

    setFontFamily,
    setFontSize,
    setFontSizePreset,
    setColor,
    setBackgroundColor,
    setAlign,
    toggleBold,
    toggleItalic,
  }
}
