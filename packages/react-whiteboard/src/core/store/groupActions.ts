import { nanoid } from 'nanoid'
import type { GroupShape, Shape } from '../../types'
import type { StoreApi } from './types'

/**
 * Group and ungroup actions for selected shapes.
 *
 * Grouping creates a GroupShape that owns children.
 * Children keep their parentId pointing to the group.
 * The group occupies one slot in shapeIds; children are removed from shapeIds.
 */
export function createGroupActions(
  set: StoreApi['set'],
  get: StoreApi['get'],
) {
  return {
    groupSelectedShapes: () => {
      const state = get()
      const selectedIds = Array.from(state.selectedIds)
      if (selectedIds.length < 2) return

      const shapes = selectedIds
        .map((id) => state.shapes.get(id))
        .filter((s): s is Shape => s !== undefined)

      // Calculate group bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const s of shapes) {
        minX = Math.min(minX, s.x)
        minY = Math.min(minY, s.y)
        maxX = Math.max(maxX, s.x + s.width)
        maxY = Math.max(maxY, s.y + s.height)
      }

      const groupId = nanoid()
      const groupShape: GroupShape = {
        id: groupId,
        type: 'group',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        parentId: null,
        seed: Math.floor(Math.random() * 2147483647),
        roughness: 0,
        props: {
          childIds: selectedIds,
        },
      }

      // Update children's parentId
      const newShapes = new Map(state.shapes)
      for (const shape of shapes) {
        newShapes.set(shape.id, { ...shape, parentId: groupId } as Shape)
      }
      newShapes.set(groupId, groupShape)

      // Replace children in shapeIds with the group
      // Insert group at the position of the first child
      const newShapeIds = state.shapeIds.filter((id) => !state.selectedIds.has(id))
      const firstChildIndex = state.shapeIds.findIndex((id) => state.selectedIds.has(id))
      newShapeIds.splice(Math.max(0, firstChildIndex), 0, groupId)

      set({
        shapes: newShapes,
        shapeIds: newShapeIds,
        selectedIds: new Set([groupId]),
      })
    },

    ungroupSelectedShapes: () => {
      const state = get()
      const groupIds: string[] = []

      for (const id of state.selectedIds) {
        const shape = state.shapes.get(id)
        if (shape?.type === 'group') groupIds.push(id)
      }

      if (groupIds.length === 0) return

      const newShapes = new Map(state.shapes)
      const newShapeIds = [...state.shapeIds]
      const restoredChildIds: string[] = []

      for (const groupId of groupIds) {
        const group = newShapes.get(groupId) as GroupShape | undefined
        if (!group) continue

        const childIds = group.props.childIds

        // Restore children's parentId
        for (const childId of childIds) {
          const child = newShapes.get(childId)
          if (child) {
            newShapes.set(childId, { ...child, parentId: null } as Shape)
            restoredChildIds.push(childId)
          }
        }

        // Replace group in shapeIds with its children
        const groupIndex = newShapeIds.indexOf(groupId)
        if (groupIndex >= 0) {
          newShapeIds.splice(groupIndex, 1, ...childIds)
        }

        // Remove the group shape
        newShapes.delete(groupId)
      }

      set({
        shapes: newShapes,
        shapeIds: newShapeIds,
        selectedIds: new Set(restoredChildIds),
      })
    },
  }
}
