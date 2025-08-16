/**
 * Rough.js type definitions
 */

export interface RoughCanvas {
  // Basic drawing methods
  line: (x1: number, y1: number, x2: number, y2: number, options?: RoughOptions) => void;
  rectangle: (x: number, y: number, width: number, height: number, options?: RoughOptions) => void;
  ellipse: (x: number, y: number, width: number, height: number, options?: RoughOptions) => void;
  circle: (x: number, y: number, diameter: number, options?: RoughOptions) => void;
  polygon: (points: [number, number][], options?: RoughOptions) => void;
  arc: (x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: RoughOptions) => void;
  curve: (points: [number, number][], options?: RoughOptions) => void;
  path: (d: string, options?: RoughOptions) => void;
  
  // Utility methods
  generator: RoughGenerator;
}

export interface RoughGenerator {
  line: (x1: number, y1: number, x2: number, y2: number, options?: RoughOptions) => any;
  rectangle: (x: number, y: number, width: number, height: number, options?: RoughOptions) => any;
  ellipse: (x: number, y: number, width: number, height: number, options?: RoughOptions) => any;
  circle: (x: number, y: number, diameter: number, options?: RoughOptions) => any;
  polygon: (points: [number, number][], options?: RoughOptions) => any;
  arc: (x: number, y: number, width: number, height: number, start: number, stop: number, closed?: boolean, options?: RoughOptions) => any;
  curve: (points: [number, number][], options?: RoughOptions) => any;
  path: (d: string, options?: RoughOptions) => any;
}

export interface RoughOptions {
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
