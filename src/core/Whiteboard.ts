/**
 * Main Whiteboard class - Core canvas management and Rough.js integration
 */

import type {
  WhiteboardConfig,
  WhiteboardInstance,
  CanvasElement,
  Size,
  RoughCanvas,
  Point,
} from '../types';
import type {
  DrawingTool,
  Shape,
  DrawingOptions,
  DrawingState,
} from '../types/drawing';
import {
  createCanvas,
  getOptimalCanvasSize,
  setCanvasSize,
  clearCanvas,
  validateConfig,
} from '../utils/canvas';
import {
  createShape,
  drawShape,
  redrawCanvas,
  screenToCanvas,
} from '../utils/drawing';

export class Whiteboard implements WhiteboardInstance {
  public canvas: CanvasElement;
  public context: CanvasRenderingContext2D;
  public roughCanvas: RoughCanvas | null;
  public config: WhiteboardConfig;

  private container: HTMLElement;
  private isDestroyed = false;
  private drawingState: DrawingState;
  private eventListeners: Map<string, (e: globalThis.MouseEvent) => void> =
    new Map();

  constructor(
    container: string | HTMLElement,
    config: Partial<WhiteboardConfig> = {}
  ) {
    this.config = validateConfig(config);
    this.container = this.resolveContainer(container);

    // Initialize drawing state
    this.drawingState = {
      isDrawing: false,
      currentShape: null,
      shapes: [],
      selectedShape: null,
      activeTool: 'pen',
    };

    // Initialize canvas
    this.canvas = this.initializeCanvas();
    this.context = this.getCanvasContext();

    // Initialize Rough.js
    this.roughCanvas = this.initializeRoughCanvas();

    // Setup canvas
    this.setupCanvas();

    // Setup event listeners
    this.setupEventListeners();

    // Append to container
    this.container.appendChild(this.canvas);
  }

  /**
   * Resolves container element from string selector or HTMLElement
   */
  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container element not found: ${container}`);
      }
      return element as HTMLElement;
    }
    return container;
  }

  /**
   * Creates and initializes the canvas element
   */
  private initializeCanvas(): CanvasElement {
    const size = this.getCanvasSize();
    const canvas = createCanvas(size);

    // Set canvas size with high DPI support
    const context = canvas.getContext('2d');
    if (context) {
      setCanvasSize(canvas, size, context);
    }

    return canvas;
  }

  /**
   * Gets the canvas context
   */
  private getCanvasContext(): CanvasRenderingContext2D {
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    return context;
  }

  /**
   * Initializes Rough.js canvas
   */
  private initializeRoughCanvas(): RoughCanvas | null {
    try {
      // Dynamic import for Rough.js
      const rough = require('roughjs');
      return rough.canvas(this.canvas);
    } catch (error) {
      // Rough.js not available, falling back to basic canvas
      return null;
    }
  }

  /**
   * Determines canvas size based on container or config
   */
  private getCanvasSize(): Size {
    if (this.config.width && this.config.height) {
      return {
        width: this.config.width,
        height: this.config.height,
      };
    }

    return getOptimalCanvasSize(this.container);
  }

  /**
   * Sets up the canvas with initial state
   */
  private setupCanvas(): void {
    // Clear canvas with background color
    clearCanvas(
      this.context,
      {
        width: this.canvas.width,
        height: this.canvas.height,
      },
      this.config.backgroundColor
    );
  }

  /**
   * Sets up mouse event listeners for drawing
   */
  private setupEventListeners(): void {
    const handleMouseDown = (e: globalThis.MouseEvent) =>
      this.handleMouseDown(e);
    const handleMouseMove = (e: globalThis.MouseEvent) =>
      this.handleMouseMove(e);
    const handleMouseUp = (e: globalThis.MouseEvent) => this.handleMouseUp(e);
    const handleDoubleClick = (e: globalThis.MouseEvent) =>
      this.handleDoubleClick(e);

    this.canvas.addEventListener('mousedown', handleMouseDown);
    this.canvas.addEventListener('mousemove', handleMouseMove);
    this.canvas.addEventListener('mouseup', handleMouseUp);
    this.canvas.addEventListener('dblclick', handleDoubleClick);

    this.eventListeners.set('mousedown', handleMouseDown);
    this.eventListeners.set('mousemove', handleMouseMove);
    this.eventListeners.set('mouseup', handleMouseUp);
    this.eventListeners.set('dblclick', handleDoubleClick);
  }

  /**
   * Handles mouse down events for drawing
   */
  private handleMouseDown(e: globalThis.MouseEvent): void {
    if (this.isDestroyed) return;

    const point = screenToCanvas(e.clientX, e.clientY, this.canvas);

    if (this.drawingState.activeTool === 'select') {
      // Handle selection logic
      this.handleSelection(point);
      return;
    }

    if (this.drawingState.activeTool === 'polygon') {
      // Handle polygon tool - add points on click
      this.handlePolygonClick(point);
      return;
    }

    this.drawingState.isDrawing = true;

    const options: DrawingOptions = {
      tool: this.drawingState.activeTool,
      ...this.config.roughConfig,
    };

    this.drawingState.currentShape = createShape(
      this.drawingState.activeTool,
      point,
      options
    );
  }

  /**
   * Handles mouse move events for drawing
   */
  private handleMouseMove(e: globalThis.MouseEvent): void {
    if (!this.drawingState.isDrawing || !this.drawingState.currentShape) return;

    const point = screenToCanvas(e.clientX, e.clientY, this.canvas);

    if (this.drawingState.activeTool === 'pen') {
      // For pen tool, add points continuously
      this.drawingState.currentShape.points.push(point);
    } else if (this.drawingState.activeTool === 'polygon') {
      // For polygon tool, add points on click, preview on move
      if (this.drawingState.currentShape.points.length === 1) {
        this.drawingState.currentShape.points.push(point);
      } else {
        this.drawingState.currentShape.points[1] = point;
      }
    } else if (this.drawingState.activeTool === 'text') {
      // For text tool, just update position
      if (this.drawingState.currentShape.points.length === 1) {
        this.drawingState.currentShape.points[0] = point;
      }
    } else {
      // For other tools, update the second point
      if (this.drawingState.currentShape.points.length === 1) {
        this.drawingState.currentShape.points.push(point);
      } else {
        this.drawingState.currentShape.points[1] = point;
      }
    }

    // Redraw canvas with current shape
    this.redrawWithCurrentShape();
  }

  /**
   * Handles mouse up events for drawing
   */
  private handleMouseUp(e: globalThis.MouseEvent): void {
    if (!this.drawingState.isDrawing || !this.drawingState.currentShape) return;

    const point = screenToCanvas(e.clientX, e.clientY, this.canvas);

    // Finalize the shape
    if (this.drawingState.currentShape.points.length === 1) {
      this.drawingState.currentShape.points.push(point);
    }

    // Add to shapes array
    this.drawingState.shapes.push(this.drawingState.currentShape);

    // Reset drawing state
    this.drawingState.isDrawing = false;
    this.drawingState.currentShape = null;

    // Redraw entire canvas
    this.redrawCanvas();
  }

  /**
   * Handles polygon click events for adding points
   */
  private handlePolygonClick(point: Point): void {
    if (!this.drawingState.isDrawing) {
      // Start new polygon
      this.drawingState.isDrawing = true;
      const options: DrawingOptions = {
        tool: 'polygon',
        ...this.config.roughConfig,
      };
      this.drawingState.currentShape = createShape('polygon', point, options);
    } else if (this.drawingState.currentShape) {
      // Add point to existing polygon
      this.drawingState.currentShape.points.push(point);
    }

    // Redraw with current state
    this.redrawWithCurrentShape();
  }

  /**
   * Handles double click events for polygon completion
   */
  private handleDoubleClick(_e: globalThis.MouseEvent): void {
    if (
      this.drawingState.activeTool === 'polygon' &&
      this.drawingState.isDrawing
    ) {
      // Complete polygon on double click
      if (
        this.drawingState.currentShape &&
        this.drawingState.currentShape.points.length >= 3
      ) {
        // Remove the preview point and finalize
        this.drawingState.currentShape.points.pop();

        // Add to shapes array
        this.drawingState.shapes.push(this.drawingState.currentShape);

        // Reset drawing state
        this.drawingState.isDrawing = false;
        this.drawingState.currentShape = null;

        // Redraw entire canvas
        this.redrawCanvas();
      }
    }
  }

  /**
   * Redraws canvas with current shape being drawn
   */
  private redrawWithCurrentShape(): void {
    redrawCanvas(
      this.context,
      this.roughCanvas,
      this.drawingState.shapes,
      this.config.backgroundColor
    );

    if (this.drawingState.currentShape) {
      drawShape(this.context, this.roughCanvas, this.drawingState.currentShape);
    }
  }

  /**
   * Redraws entire canvas with all shapes
   */
  private redrawCanvas(): void {
    redrawCanvas(
      this.context,
      this.roughCanvas,
      this.drawingState.shapes,
      this.config.backgroundColor
    );
  }

  /**
   * Handles selection logic
   */
  private handleSelection(point: Point): void {
    // Find shape at point
    const selectedShape = this.findShapeAtPoint(point);

    if (selectedShape) {
      this.drawingState.selectedShape = selectedShape;
      // Highlight selected shape
      this.highlightSelectedShape(selectedShape);
    } else {
      this.drawingState.selectedShape = null;
      this.redrawCanvas(); // Redraw without highlight
    }
  }

  /**
   * Finds shape at given point
   */
  private findShapeAtPoint(point: Point): Shape | null {
    // Simple point-in-bounds check for now
    // Can be improved with more sophisticated hit testing
    for (let i = this.drawingState.shapes.length - 1; i >= 0; i--) {
      const shape = this.drawingState.shapes[i];
      if (shape && this.isPointInShape(point, shape)) {
        return shape;
      }
    }
    return null;
  }

  /**
   * Checks if point is inside shape bounds
   */
  private isPointInShape(point: Point, shape: Shape): boolean {
    if (shape.points.length < 2) return false;

    const { type, points } = shape;

    switch (type) {
      case 'rectangle':
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const minX = Math.min(p1.x, p2.x);
          const maxX = Math.max(p1.x, p2.x);
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);
          return (
            point.x >= minX &&
            point.x <= maxX &&
            point.y >= minY &&
            point.y <= maxY
          );
        }
        break;

      case 'circle':
        const center = points[0];
        const radiusPoint = points[1];
        if (center && radiusPoint) {
          const radius = Math.sqrt(
            Math.pow(radiusPoint.x - center.x, 2) +
              Math.pow(radiusPoint.y - center.y, 2)
          );
          const distance = Math.sqrt(
            Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
          );
          return distance <= radius;
        }
        break;

      case 'ellipse':
        const eCenter = points[0];
        const eRadiusPoint = points[1];
        if (eCenter && eRadiusPoint) {
          const width = Math.abs(eRadiusPoint.x - eCenter.x) * 2;
          const height = Math.abs(eRadiusPoint.y - eCenter.y) * 2;
          const normalizedX = (point.x - eCenter.x) / (width / 2);
          const normalizedY = (point.y - eCenter.y) / (height / 2);
          return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
        }
        break;

      case 'line':
        const l1 = points[0];
        const l2 = points[1];
        if (l1 && l2) {
          const tolerance = 5; // 5px tolerance for line selection
          const distance = this.distanceToLine(point, l1, l2);
          return distance <= tolerance;
        }
        break;

      case 'pen':
        // For pen tool, check if point is near any line segment
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          if (p1 && p2) {
            const distance = this.distanceToLine(point, p1, p2);
            if (distance <= 5) return true; // 5px tolerance
          }
        }
        break;
    }

    return false;
  }

  /**
   * Calculates distance from point to line
   */
  private distanceToLine(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const x = lineStart.x + param * C;
    const y = lineStart.y + param * D;

    const dx = point.x - x;
    const dy = point.y - y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Highlights selected shape
   */
  private highlightSelectedShape(shape: Shape): void {
    this.redrawCanvas();

    // Draw selection highlight
    const ctx = this.context;
    ctx.save();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const { type, points } = shape;

    switch (type) {
      case 'rectangle':
        if (points.length >= 2) {
          const p1 = points[0];
          const p2 = points[1];
          if (p1 && p2) {
            const width = Math.abs(p2.x - p1.x);
            const height = Math.abs(p2.y - p1.y);
            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
          }
        }
        break;

      case 'circle':
        if (points.length >= 2) {
          const center = points[0];
          const radiusPoint = points[1];
          if (center && radiusPoint) {
            const radius = Math.sqrt(
              Math.pow(radiusPoint.x - center.x, 2) +
                Math.pow(radiusPoint.y - center.y, 2)
            );
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius + 2, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
        break;

      case 'ellipse':
        if (points.length >= 2) {
          const center = points[0];
          const radiusPoint = points[1];
          if (center && radiusPoint) {
            const width = Math.abs(radiusPoint.x - center.x) * 2;
            const height = Math.abs(radiusPoint.y - center.y) * 2;
            ctx.beginPath();
            ctx.ellipse(
              center.x,
              center.y,
              width / 2 + 2,
              height / 2 + 2,
              0,
              0,
              2 * Math.PI
            );
            ctx.stroke();
          }
        }
        break;
    }

    ctx.restore();
  }

  /**
   * Resizes the canvas
   */
  public resize(width?: number, height?: number): void {
    if (this.isDestroyed) return;

    const newSize: Size = {
      width: width || this.config.width || 800,
      height: height || this.config.height || 600,
    };

    setCanvasSize(this.canvas, newSize, this.context);
    this.config.width = newSize.width;
    this.config.height = newSize.height;

    // Re-clear with new dimensions
    this.setupCanvas();
  }

  /**
   * Clears the canvas
   */
  public clear(): void {
    if (this.isDestroyed) return;
    this.setupCanvas();
  }

  /**
   * Gets the current canvas size
   */
  public getSize(): Size {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * Updates the configuration
   */
  public updateConfig(newConfig: Partial<WhiteboardConfig>): void {
    if (this.isDestroyed) return;

    this.config = { ...this.config, ...newConfig };

    // Re-apply configuration changes
    if (newConfig.width || newConfig.height) {
      this.resize(newConfig.width, newConfig.height);
    }

    if (newConfig.backgroundColor) {
      this.clear();
    }
  }

  /**
   * Destroys the whiteboard instance
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Remove canvas from DOM
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Clear references
    this.canvas = null as any;
    this.context = null as any;
    this.roughCanvas = null;
    this.container = null as any;
  }

  /**
   * Checks if the whiteboard is destroyed
   */
  public get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Sets the active drawing tool
   */
  public setActiveTool(tool: DrawingTool): void {
    if (this.isDestroyed) return;
    this.drawingState.activeTool = tool;
  }

  /**
   * Gets the active drawing tool
   */
  public getActiveTool(): DrawingTool {
    return this.drawingState.activeTool;
  }

  /**
   * Gets all drawn shapes
   */
  public getShapes(): Shape[] {
    return [...this.drawingState.shapes];
  }

  /**
   * Clears all drawn shapes
   */
  public clearShapes(): void {
    if (this.isDestroyed) return;
    this.drawingState.shapes = [];
    this.redrawCanvas();
  }

  /**
   * Adds a shape to the canvas
   */
  public addShape(shape: Shape): void {
    if (this.isDestroyed) return;
    this.drawingState.shapes.push(shape);
    this.redrawCanvas();
  }

  /**
   * Removes a shape by ID
   */
  public removeShape(shapeId: string): void {
    if (this.isDestroyed) return;
    this.drawingState.shapes = this.drawingState.shapes.filter(
      s => s.id !== shapeId
    );
    this.redrawCanvas();
  }
}
