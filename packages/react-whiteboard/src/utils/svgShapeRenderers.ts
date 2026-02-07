import type { RoughSVG } from 'roughjs/bin/svg'
import type { Options as RoughOptions } from 'roughjs/bin/core'
import { getStroke } from 'perfect-freehand'
import type {
  Shape,
  RectangleShape,
  EllipseShape,
  LineShape,
  ArrowShape,
  TextShape,
  PathShape,
  ImageShape,
  FillStyle,
  StrokeStyle,
} from '../types'
import { wrapTextLines, FONT_FAMILIES } from './fonts'
import { calculateArrowhead } from './canvas'
import { getBoundTextShape, BOUND_TEXT_PADDING, centerTextVertically } from './boundText'

// ============================================================================
// Helpers
// ============================================================================

function mapFillStyle(style: FillStyle | undefined): string {
  switch (style) {
    case 'hachure': return 'hachure'
    case 'cross-hatch': return 'cross-hatch'
    case 'dots': return 'dots'
    default: return 'solid'
  }
}

function getStrokeLineDash(style: StrokeStyle | undefined, strokeWidth: number): number[] {
  switch (style) {
    case 'dashed': return [strokeWidth * 4, strokeWidth * 2]
    case 'dotted': return [strokeWidth, strokeWidth * 2]
    default: return []
  }
}

function buildRoughOpts(seed: number, roughness: number, extra: RoughOptions = {}): RoughOptions {
  return { seed, roughness, ...extra }
}

function rotationTransform(rotation: number, x: number, y: number, w: number, h: number): string {
  if (rotation === 0) return ''
  const cx = x + w / 2
  const cy = y + h / 2
  const deg = (rotation * 180) / Math.PI
  return `rotate(${deg} ${cx} ${cy})`
}

function createSvgGroup(opacity: number, rotation: number, x: number, y: number, w: number, h: number): SVGGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  if (opacity < 1) g.setAttribute('opacity', String(opacity))
  const transform = rotationTransform(rotation, x, y, w, h)
  if (transform) g.setAttribute('transform', transform)
  return g
}

// ============================================================================
// Shape renderers
// ============================================================================

export function renderRectangle(
  rs: RoughSVG,
  shape: RectangleShape,
  allShapes: Map<string, Shape>,
): SVGGElement {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { fill, fillStyle, stroke, strokeWidth, strokeStyle, cornerRadius } = props

  const fillOpt = fill && fill !== 'transparent' ? fill : undefined
  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  const opts = buildRoughOpts(seed, roughness, {
    stroke, strokeWidth,
    fill: fillOpt,
    fillStyle: mapFillStyle(fillStyle),
    strokeLineDash: lineDash.length ? lineDash : undefined,
  })

  let el: SVGGElement
  if (cornerRadius > 0) {
    const r = Math.min(cornerRadius, width / 2, height / 2)
    const path = `M ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} L ${x + r} ${y + height} Q ${x} ${y + height} ${x} ${y + height - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
    el = rs.path(path, opts)
  } else {
    el = rs.rectangle(x, y, width, height, opts)
  }

  const g = createSvgGroup(opacity, rotation, x, y, width, height)
  g.appendChild(el)

  if (props.boundTextId) {
    const textEl = renderBoundText(shape, allShapes)
    if (textEl) g.appendChild(textEl)
  }

  return g
}

export function renderEllipse(
  rs: RoughSVG,
  shape: EllipseShape,
  allShapes: Map<string, Shape>,
): SVGGElement {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { fill, fillStyle, stroke, strokeWidth, strokeStyle } = props

  const cx = x + width / 2
  const cy = y + height / 2
  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  const el = rs.ellipse(cx, cy, width, height, buildRoughOpts(seed, roughness, {
    stroke, strokeWidth,
    fill: fill && fill !== 'transparent' ? fill : undefined,
    fillStyle: mapFillStyle(fillStyle),
    strokeLineDash: lineDash.length ? lineDash : undefined,
  }))

  const g = createSvgGroup(opacity, rotation, x, y, width, height)
  g.appendChild(el)

  if (props.boundTextId) {
    const textEl = renderBoundText(shape, allShapes)
    if (textEl) g.appendChild(textEl)
  }

  return g
}

export function renderLine(rs: RoughSVG, shape: LineShape): SVGGElement {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { stroke, strokeWidth, strokeStyle, points } = props

  const startPoint = points[0]
  const endPoint = points[1]
  if (!startPoint || !endPoint) {
    return document.createElementNS('http://www.w3.org/2000/svg', 'g')
  }

  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  const el = rs.line(
    x + startPoint.x, y + startPoint.y,
    x + endPoint.x, y + endPoint.y,
    buildRoughOpts(seed, roughness, {
      stroke, strokeWidth,
      strokeLineDash: lineDash.length ? lineDash : undefined,
    }),
  )

  const g = createSvgGroup(opacity, rotation, x, y, width, height)
  g.appendChild(el)
  return g
}

export function renderArrow(rs: RoughSVG, shape: ArrowShape): SVGGElement {
  const { x, y, width, height, rotation, opacity, props, seed, roughness } = shape
  const { stroke, strokeWidth, strokeStyle, start, end, startArrowhead, endArrowhead } = props

  const startX = x + start.x
  const startY = y + start.y
  const endX = x + end.x
  const endY = y + end.y

  const lineDash = getStrokeLineDash(strokeStyle, strokeWidth)
  const lineEl = rs.line(startX, startY, endX, endY, buildRoughOpts(seed, roughness, {
    stroke, strokeWidth,
    strokeLineDash: lineDash.length ? lineDash : undefined,
  }))

  const g = createSvgGroup(opacity, rotation, x, y, width, height)
  g.appendChild(lineEl)

  const arrowSize = strokeWidth * 4
  if (endArrowhead === 'arrow' || endArrowhead === 'triangle') {
    const [w1, w2] = calculateArrowhead({ x: startX, y: startY }, { x: endX, y: endY }, arrowSize)
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.setAttribute('points', `${endX},${endY} ${w1.x},${w1.y} ${w2.x},${w2.y}`)
    polygon.setAttribute('fill', stroke)
    g.appendChild(polygon)
  }
  if (startArrowhead === 'arrow' || startArrowhead === 'triangle') {
    const [w1, w2] = calculateArrowhead({ x: endX, y: endY }, { x: startX, y: startY }, arrowSize)
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.setAttribute('points', `${startX},${startY} ${w1.x},${w1.y} ${w2.x},${w2.y}`)
    polygon.setAttribute('fill', stroke)
    g.appendChild(polygon)
  }

  return g
}

export function renderPath(shape: PathShape): SVGGElement {
  const { x, y, width, height, rotation, opacity, props } = shape
  const { stroke, strokeWidth, points } = props

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  if (points.length < 2) return g

  if (opacity < 1) g.setAttribute('opacity', String(opacity))
  const transform = rotationTransform(rotation, x, y, width, height)
  if (transform) g.setAttribute('transform', transform)

  const absolutePoints = points.map((p) => ({ x: x + p.x, y: y + p.y, pressure: p.pressure }))
  const hasRealPressure = absolutePoints.some((p) => p.pressure !== undefined && p.pressure !== 0.5)

  const outlinePoints = getStroke(absolutePoints, {
    thinning: 0.5, smoothing: 0.5, streamline: 0.5,
    size: strokeWidth * 3,
    simulatePressure: !hasRealPressure,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
    last: true,
  })

  if (outlinePoints.length < 2) return g

  const first = outlinePoints[0]!
  let d = `M ${first[0]} ${first[1]}`
  for (let i = 1; i < outlinePoints.length; i++) {
    const pt = outlinePoints[i]!
    d += ` L ${pt[0]} ${pt[1]}`
  }
  d += ' Z'

  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  pathEl.setAttribute('d', d)
  pathEl.setAttribute('fill', stroke)
  pathEl.setAttribute('stroke', 'none')
  g.appendChild(pathEl)
  return g
}

export function renderText(shape: TextShape): SVGGElement {
  const { x, y, width, height, rotation, opacity, props } = shape
  const { text, fontSize, color, backgroundColor, align, lineHeight, fontFamily } = props

  const g = createSvgGroup(opacity, rotation, x, y, width, height)

  if (backgroundColor && backgroundColor !== 'transparent') {
    const pad = 4
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', String(x - pad))
    rect.setAttribute('y', String(y - pad))
    rect.setAttribute('width', String(width + pad * 2))
    rect.setAttribute('height', String(height + pad * 2))
    rect.setAttribute('rx', '4')
    rect.setAttribute('fill', backgroundColor)
    g.appendChild(rect)
  }

  const lineSpacing = fontSize * (lineHeight ?? 1.25)
  const { lines } = wrapTextLines(text, width, props)
  const cssFontFamily = FONT_FAMILIES[fontFamily] ?? FONT_FAMILIES.sans

  let textAnchor = 'start'
  let textX = x
  if (align === 'center') { textAnchor = 'middle'; textX = x + width / 2 }
  else if (align === 'right') { textAnchor = 'end'; textX = x + width }

  const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  textEl.setAttribute('font-family', cssFontFamily)
  textEl.setAttribute('font-size', String(fontSize))
  textEl.setAttribute('font-weight', String(props.fontWeight))
  if (props.fontStyle === 'italic') textEl.setAttribute('font-style', 'italic')
  textEl.setAttribute('fill', color)
  textEl.setAttribute('text-anchor', textAnchor)
  textEl.setAttribute('dominant-baseline', 'text-before-edge')

  lines.forEach((line, index) => {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    tspan.setAttribute('x', String(textX))
    tspan.setAttribute('y', String(y + index * lineSpacing))
    tspan.textContent = line || '\u00A0'
    textEl.appendChild(tspan)
  })

  g.appendChild(textEl)
  return g
}

export function renderImage(shape: ImageShape): SVGGElement {
  const { x, y, width, height, rotation, opacity, props } = shape

  const g = createSvgGroup(opacity, rotation, x, y, width, height)
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image')
  img.setAttribute('x', String(x))
  img.setAttribute('y', String(y))
  img.setAttribute('width', String(width))
  img.setAttribute('height', String(height))
  img.setAttribute('href', props.src)
  img.setAttribute('preserveAspectRatio', 'none')
  g.appendChild(img)
  return g
}

function renderBoundText(
  parent: RectangleShape | EllipseShape,
  allShapes: Map<string, Shape>,
): SVGGElement | null {
  const textShape = getBoundTextShape(parent, allShapes)
  if (!textShape) return null

  const { text, fontSize, color, align, lineHeight, fontFamily } = textShape.props
  if (!text) return null

  const pad = BOUND_TEXT_PADDING
  const maxWidth = Math.max(parent.width - pad * 2, 20)
  const { lines, height: textHeight } = wrapTextLines(text, maxWidth, textShape.props)
  const offsetY = centerTextVertically(parent.height, textHeight)
  const lineSpacing = fontSize * (lineHeight ?? 1.25)
  const cssFontFamily = FONT_FAMILIES[fontFamily] ?? FONT_FAMILIES.sans

  let textAnchor = 'start'
  let textX = parent.x + pad
  if (align === 'center') { textAnchor = 'middle'; textX = parent.x + parent.width / 2 }
  else if (align === 'right') { textAnchor = 'end'; textX = parent.x + parent.width - pad }

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  if (textShape.opacity < 1) g.setAttribute('opacity', String(textShape.opacity))

  // Clip to parent shape
  const clipId = `clip-${parent.id}`
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath')
  clipPath.setAttribute('id', clipId)

  if (parent.type === 'ellipse') {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
    el.setAttribute('cx', String(parent.x + parent.width / 2))
    el.setAttribute('cy', String(parent.y + parent.height / 2))
    el.setAttribute('rx', String(parent.width / 2))
    el.setAttribute('ry', String(parent.height / 2))
    clipPath.appendChild(el)
  } else {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    el.setAttribute('x', String(parent.x))
    el.setAttribute('y', String(parent.y))
    el.setAttribute('width', String(parent.width))
    el.setAttribute('height', String(parent.height))
    clipPath.appendChild(el)
  }

  defs.appendChild(clipPath)
  g.appendChild(defs)

  const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  textEl.setAttribute('clip-path', `url(#${clipId})`)
  textEl.setAttribute('font-family', cssFontFamily)
  textEl.setAttribute('font-size', String(fontSize))
  textEl.setAttribute('font-weight', String(textShape.props.fontWeight))
  if (textShape.props.fontStyle === 'italic') textEl.setAttribute('font-style', 'italic')
  textEl.setAttribute('fill', color)
  textEl.setAttribute('text-anchor', textAnchor)
  textEl.setAttribute('dominant-baseline', 'text-before-edge')

  lines.forEach((line, index) => {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    tspan.setAttribute('x', String(textX))
    tspan.setAttribute('y', String(parent.y + offsetY + index * lineSpacing))
    tspan.textContent = line || '\u00A0'
    textEl.appendChild(tspan)
  })

  g.appendChild(textEl)
  return g
}
