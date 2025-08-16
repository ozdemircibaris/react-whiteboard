/**
 * Core type definitions for the whiteboard library
 */

import type { RoughCanvas } from './rough';
import type { DrawingTool, Shape } from './drawing';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WhiteboardConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  roughConfig?: RoughConfig;
}

export interface RoughConfig {
  roughness?: number;
  bowing?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillStyle?: 'solid' | 'hachure' | 'zigzag' | 'dots' | 'cross-hatch';
  fillWeight?: number;
  hachureAngle?: number;
  hachureGap?: number;
  curveStepCount?: number;
  curveFitting?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  disableMultiStroke?: boolean;
  disableMultiStrokeFill?: boolean;
  preserveVertices?: boolean;
}

// Re-export Rough.js types
export type { RoughCanvas, RoughGenerator, RoughOptions } from './rough';

export interface CanvasElement extends HTMLCanvasElement {
  // Extends HTMLCanvasElement for DOM compatibility
}

export interface WhiteboardInstance {
  canvas: CanvasElement;
  context: CanvasRenderingContext2D;
  roughCanvas: RoughCanvas | null; // Rough.js canvas instance
  config: WhiteboardConfig;
  resize(width?: number, height?: number): void;
  clear(): void;
  getSize(): Size;
  updateConfig(newConfig: Partial<WhiteboardConfig>): void;
  destroy(): void;
  // Drawing methods
  setActiveTool(tool: DrawingTool): void;
  getActiveTool(): DrawingTool;
  getShapes(): Shape[];
  clearShapes(): void;
  addShape(shape: Shape): void;
  removeShape(shapeId: string): void;
}
