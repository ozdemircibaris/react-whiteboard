/**
 * Test setup: mock browser APIs unavailable in jsdom.
 */

// Mock HTMLCanvasElement.getContext for tests that touch canvas utilities
HTMLCanvasElement.prototype.getContext = (() => {
  const noop = () => {}
  const ctx = {
    fillRect: noop,
    clearRect: noop,
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: noop,
    createImageData: () => [],
    setTransform: noop,
    drawImage: noop,
    save: noop,
    fillText: noop,
    restore: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    stroke: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    arc: noop,
    fill: noop,
    measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
    transform: noop,
    rect: noop,
    clip: noop,
    canvas: { width: 800, height: 600 },
    setLineDash: noop,
    getLineDash: () => [],
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
  }
  return function (this: HTMLCanvasElement, _type: string) {
    return ctx as unknown as CanvasRenderingContext2D
  }
})()

// Stub ImageBitmap if not available in jsdom
if (typeof globalThis.ImageBitmap === 'undefined') {
  (globalThis as Record<string, unknown>).ImageBitmap = class ImageBitmap {
    width = 0
    height = 0
    close() {}
  }
}

// Stub createImageBitmap
if (typeof globalThis.createImageBitmap === 'undefined') {
  (globalThis as Record<string, unknown>).createImageBitmap = async () =>
    new (globalThis as unknown as { ImageBitmap: new () => ImageBitmap }).ImageBitmap()
}

// Stub requestAnimationFrame / cancelAnimationFrame for viewport animation tests
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 0) as unknown as number
  }
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  (globalThis as Record<string, unknown>).cancelAnimationFrame = (id: number) => {
    clearTimeout(id)
  }
}

// Stub structuredClone if unavailable
if (typeof globalThis.structuredClone === 'undefined') {
  (globalThis as Record<string, unknown>).structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T
}
