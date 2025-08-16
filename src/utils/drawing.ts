import type { Point, RoughCanvas } from '../types';
import type { DrawingTool, Shape, DrawingOptions } from '../types/drawing';

/**
 * Generates a unique ID for shapes
 */
export function generateId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Converts screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: screenX - rect.left,
    y: screenY - rect.top,
  };
}

/**
 * Creates a new shape based on the drawing tool
 */
export function createShape(
  tool: DrawingTool,
  startPoint: Point,
  options: DrawingOptions
): Shape {
  return {
    id: generateId(),
    type: tool,
    points: [startPoint],
    options: {
      roughness: options.roughness || 1,
      bowing: options.bowing || 0,
      stroke: options.stroke || '#000000',
      strokeWidth: options.strokeWidth || 2,
      fill: options.fill || 'transparent',
      fillStyle: options.fillStyle || 'solid',
      ...options,
    },
    createdAt: Date.now(),
  };
}

/**
 * Updates shape with new points
 */
export function updateShape(shape: Shape, newPoints: Point[]): Shape {
  return {
    ...shape,
    points: newPoints,
  };
}

/**
 * Draws a shape on the canvas using Rough.js
 */
export function drawShape(
  context: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas | null,
  shape: Shape
): void {
  if (!roughCanvas) {
    // Fallback to basic canvas drawing
    drawBasicShape(context, shape);
    return;
  }

  const { type, points, options } = shape;

  // Safety check for points array
  if (!points || points.length < 2) return;

  switch (type) {
    case 'line':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          roughCanvas.line(p1.x, p1.y, p2.x, p2.y, options);
        }
      }
      break;

    case 'rectangle':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          roughCanvas.rectangle(x, y, width, height, options);
        }
      }
      break;

    case 'circle':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const radius = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
          );
          roughCanvas.circle(p1.x, p1.y, radius * 2, options);
        }
      }
      break;

    case 'ellipse':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const width = Math.abs(p2.x - p1.x) * 2;
          const height = Math.abs(p2.y - p1.y) * 2;
          roughCanvas.ellipse(
            p1.x - width / 2,
            p1.y - height / 2,
            width,
            height,
            options
          );
        }
      }
      break;

    case 'polygon':
      if (points.length >= 3) {
        const pointArray: [number, number][] = points
          .filter((p): p is Point => p !== undefined)
          .map(p => [p.x, p.y]);
        if (pointArray.length >= 3) {
          roughCanvas.polygon(pointArray, options);
        }
      }
      break;

    case 'text':
      // Text tool - draw placeholder for now
      if (points.length >= 1) {
        const point = points[0];
        if (point) {
          context.font = `${options.strokeWidth || 16}px Arial`;
          context.fillStyle = options.stroke || '#000000';
          context.fillText('Text', point.x, point.y);
        }
      }
      break;

    case 'pen':
      if (points.length >= 2) {
        context.beginPath();
        const firstPoint = points[0];
        if (firstPoint) {
          context.moveTo(firstPoint.x, firstPoint.y);
          for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
              context.lineTo(point.x, point.y);
            }
          }
          context.strokeStyle = options.stroke || '#000000';
          context.lineWidth = options.strokeWidth || 2;
          context.stroke();
        }
      }
      break;

    default:
      break;
  }
}

/**
 * Fallback drawing for when Rough.js is not available
 */
function drawBasicShape(context: CanvasRenderingContext2D, shape: Shape): void {
  const { type, points, options } = shape;

  // Safety check for points array
  if (!points || points.length < 2) return;

  context.strokeStyle = options.stroke || '#000000';
  context.lineWidth = options.strokeWidth || 2;
  context.fillStyle = options.fill || 'transparent';

  switch (type) {
    case 'line':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          context.beginPath();
          context.moveTo(p1.x, p1.y);
          context.lineTo(p2.x, p2.y);
          context.stroke();
        }
      }
      break;

    case 'rectangle':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          context.fillRect(x, y, width, height);
          context.strokeRect(x, y, width, height);
        }
      }
      break;

    case 'circle':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const radius = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
          );
          context.beginPath();
          context.arc(p1.x, p1.y, radius, 0, 2 * Math.PI);
          context.fill();
          context.stroke();
        }
      }
      break;

    case 'ellipse':
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const width = Math.abs(p2.x - p1.x) * 2;
          const height = Math.abs(p2.y - p1.y) * 2;
          context.beginPath();
          context.ellipse(p1.x, p1.y, width / 2, height / 2, 0, 0, 2 * Math.PI);
          context.fill();
          context.stroke();
        }
      }
      break;

    case 'pen':
      if (points.length >= 2) {
        const firstPoint = points[0];
        if (firstPoint) {
          context.beginPath();
          context.moveTo(firstPoint.x, firstPoint.y);
          for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
              context.lineTo(point.x, point.y);
            }
          }
          context.stroke();
        }
      }
      break;

    default:
      break;
  }
}

/**
 * Redraws all shapes on the canvas
 */
export function redrawCanvas(
  context: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas | null,
  shapes: Shape[],
  backgroundColor: string = '#ffffff'
): void {
  // Clear canvas
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  // Redraw all shapes
  shapes.forEach(shape => {
    drawShape(context, roughCanvas, shape);
  });
}
