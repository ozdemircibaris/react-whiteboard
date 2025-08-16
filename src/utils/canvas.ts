/**
 * Canvas utility functions
 */

import type { CanvasElement, Size, WhiteboardConfig } from '../types';

/**
 * Creates a canvas element with the specified dimensions
 */
export function createCanvas(size: Size): CanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  // Set default styles
  canvas.style.display = 'block';
  canvas.style.border = '1px solid #ccc';
  canvas.style.backgroundColor = '#ffffff';

  return canvas;
}

/**
 * Gets the optimal canvas size for the container
 */
export function getOptimalCanvasSize(container: HTMLElement): Size {
  const rect = container.getBoundingClientRect();
  return {
    width: rect.width || 800,
    height: rect.height || 600,
  };
}

/**
 * Sets canvas dimensions and scales context for high DPI displays
 */
export function setCanvasSize(
  canvas: CanvasElement,
  size: Size,
  context: CanvasRenderingContext2D
): void {
  const dpr = window.devicePixelRatio || 1;

  // Set the actual size in memory (scaled up for high DPI)
  canvas.width = size.width * dpr;
  canvas.height = size.height * dpr;

  // Scale the drawing context so everything draws at the correct size
  context.scale(dpr, dpr);

  // Set the CSS size
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
}

/**
 * Clears the canvas with the specified background color
 */
export function clearCanvas(
  context: CanvasRenderingContext2D,
  size: Size,
  backgroundColor: string = '#ffffff'
): void {
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, size.width, size.height);
}

/**
 * Validates and applies default configuration
 */
export function validateConfig(
  config: Partial<WhiteboardConfig>
): WhiteboardConfig {
  return {
    width: config.width || 800,
    height: config.height || 600,
    backgroundColor: config.backgroundColor || '#ffffff',
    roughConfig: {
      roughness: 1,
      bowing: 0,
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'transparent',
      ...config.roughConfig,
    },
  };
}
