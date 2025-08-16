import type { Point, RoughOptions } from './index';

export type DrawingTool =
  | 'select'
  | 'pen'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'polygon'
  | 'text';

export interface Shape {
  id: string;
  type: DrawingTool;
  points: Point[];
  options: RoughOptions;
  createdAt: number;
}

export interface DrawingState {
  isDrawing: boolean;
  currentShape: Shape | null;
  shapes: Shape[];
  selectedShape: Shape | null;
  activeTool: DrawingTool;
}

export interface DrawingOptions extends RoughOptions {
  tool: DrawingTool;
  fillStyle?: 'solid' | 'hachure' | 'zigzag' | 'dots' | 'cross-hatch';
}

export interface MouseEvent {
  clientX: number;
  clientY: number;
  target: EventTarget;
}

export interface CanvasMouseEvent {
  x: number;
  y: number;
  originalEvent: MouseEvent;
}
