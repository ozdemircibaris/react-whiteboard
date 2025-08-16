/**
 * Main entry point for the whiteboard library
 */

// Core exports
export { Whiteboard as WhiteboardCore } from './core/Whiteboard';

// React component exports
export { Whiteboard } from './react/Whiteboard';
export type { WhiteboardProps, WhiteboardRef } from './react/Whiteboard';

// Toolbar exports (for custom usage)
export { Toolbar } from './react/Toolbar';
export type { ToolbarProps } from './react/Toolbar';

// Type exports
export type {
  Point,
  Size,
  WhiteboardConfig,
  RoughConfig,
  CanvasElement,
  WhiteboardInstance,
} from './types';

// Drawing type exports
export type { Shape, DrawingState, DrawingOptions } from './types/drawing';

// Utility exports (for advanced usage)
export {
  createCanvas,
  getOptimalCanvasSize,
  setCanvasSize,
  clearCanvas,
  validateConfig,
} from './utils/canvas';

// Default export
export { Whiteboard as default } from './core/Whiteboard';
