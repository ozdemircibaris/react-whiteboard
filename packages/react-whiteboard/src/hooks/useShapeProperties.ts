import { useMemo, useCallback } from 'react'
import { useWhiteboardStore } from '../context'
import type {
  Shape,
  FillStyle,
  StrokeStyle,
  RectangleShape,
  EllipseShape,
  LineShape,
  ArrowShape,
  PathShape,
} from '../types'

type StylableShape = RectangleShape | EllipseShape | LineShape | ArrowShape | PathShape

interface ShapeStyleProps {
  fill: string
  fillStyle: FillStyle
  stroke: string
  strokeWidth: number
  strokeStyle: StrokeStyle
  cornerRadius: number
  opacity: number
}

function isStylable(shape: Shape): shape is StylableShape {
  return ['rectangle', 'ellipse', 'line', 'arrow', 'path'].includes(shape.type)
}

function hasFill(shape: Shape): shape is RectangleShape | EllipseShape {
  return shape.type === 'rectangle' || shape.type === 'ellipse'
}

function hasCornerRadius(shape: Shape): shape is RectangleShape {
  return shape.type === 'rectangle'
}

function getShapeStyle(shape: StylableShape): Partial<ShapeStyleProps> {
  const props = shape.props as Record<string, unknown>
  return {
    stroke: props.stroke as string,
    strokeWidth: props.strokeWidth as number,
    strokeStyle: (props.strokeStyle as StrokeStyle) || 'solid',
    opacity: shape.opacity,
    ...(hasFill(shape) ? {
      fill: props.fill as string,
      fillStyle: (props.fillStyle as FillStyle) || 'hachure',
    } : {}),
    ...(hasCornerRadius(shape) ? {
      cornerRadius: props.cornerRadius as number,
    } : {}),
  }
}

/**
 * Headless hook for controlling shape style properties.
 *
 * When stylable shapes are selected: changes apply to selected shapes AND update
 * the store's default props for future shapes.
 * When nothing is selected: changes only update defaults.
 */
export function useShapeProperties() {
  const currentShapeStyle = useWhiteboardStore((s) => s.currentShapeStyle)
  const setCurrentShapeStyle = useWhiteboardStore((s) => s.setCurrentShapeStyle)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const shapes = useWhiteboardStore((s) => s.shapes)
  const updateShape = useWhiteboardStore((s) => s.updateShape)

  const selectedStylableShapes = useMemo(() => {
    const result: StylableShape[] = []
    for (const id of selectedIds) {
      const shape = shapes.get(id)
      if (shape && isStylable(shape)) {
        result.push(shape)
      }
    }
    return result
  }, [selectedIds, shapes])

  const hasRectangle = useMemo(
    () => selectedStylableShapes.some(hasCornerRadius),
    [selectedStylableShapes],
  )

  const hasFillableShape = useMemo(
    () => selectedStylableShapes.some(hasFill),
    [selectedStylableShapes],
  )

  const currentProps = useMemo<ShapeStyleProps>(() => {
    if (selectedStylableShapes.length === 1) {
      const style = getShapeStyle(selectedStylableShapes[0]!)
      return { ...currentShapeStyle, ...style }
    }
    return currentShapeStyle
  }, [selectedStylableShapes, currentShapeStyle])

  const applyProps = useCallback(
    (partial: Partial<ShapeStyleProps>) => {
      setCurrentShapeStyle(partial)

      for (const shape of selectedStylableShapes) {
        const shapeUpdates: Partial<Shape> = {}
        const propUpdates: Record<string, unknown> = {}

        if (partial.opacity !== undefined) {
          shapeUpdates.opacity = partial.opacity
        }

        if (partial.stroke !== undefined) propUpdates.stroke = partial.stroke
        if (partial.strokeWidth !== undefined) propUpdates.strokeWidth = partial.strokeWidth
        if (partial.strokeStyle !== undefined) propUpdates.strokeStyle = partial.strokeStyle

        if (hasFill(shape)) {
          if (partial.fill !== undefined) propUpdates.fill = partial.fill
          if (partial.fillStyle !== undefined) propUpdates.fillStyle = partial.fillStyle
        }

        if (hasCornerRadius(shape)) {
          if (partial.cornerRadius !== undefined) propUpdates.cornerRadius = partial.cornerRadius
        }

        if (Object.keys(propUpdates).length > 0) {
          shapeUpdates.props = { ...shape.props, ...propUpdates }
        }

        if (Object.keys(shapeUpdates).length > 0) {
          updateShape(shape.id, shapeUpdates, true)
        }
      }
    },
    [setCurrentShapeStyle, selectedStylableShapes, updateShape],
  )

  const setFill = useCallback((fill: string) => applyProps({ fill }), [applyProps])
  const setFillStyle = useCallback((fillStyle: FillStyle) => applyProps({ fillStyle }), [applyProps])
  const setStroke = useCallback((stroke: string) => applyProps({ stroke }), [applyProps])
  const setStrokeWidth = useCallback((strokeWidth: number) => applyProps({ strokeWidth }), [applyProps])
  const setStrokeStyle = useCallback((strokeStyle: StrokeStyle) => applyProps({ strokeStyle }), [applyProps])
  const setOpacity = useCallback((opacity: number) => applyProps({ opacity }), [applyProps])
  const setCornerRadius = useCallback((cornerRadius: number) => applyProps({ cornerRadius }), [applyProps])

  return {
    currentProps,
    selectedCount: selectedStylableShapes.length,
    hasRectangle,
    hasFillableShape,
    setFill,
    setFillStyle,
    setStroke,
    setStrokeWidth,
    setStrokeStyle,
    setOpacity,
    setCornerRadius,
  }
}
