import { CanvasConfig, DEFAULT_CANVAS_CONFIG } from '../types'

export class CanvasService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private videoEl: HTMLVideoElement | null = null
  private compositedStream: MediaStream | null = null
  private rafId: number | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private config: CanvasConfig

  constructor(config: CanvasConfig = DEFAULT_CANVAS_CONFIG) {
    this.config = config
  }

  start(webcamStream: MediaStream): MediaStream {
    // 1. Create canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height
    this.ctx = this.canvas.getContext('2d')!

    // 2. Create hidden video element fed by webcam
    this.videoEl = document.createElement('video')
    this.videoEl.srcObject = webcamStream
    this.videoEl.muted = true
    this.videoEl.playsInline = true
    this.videoEl.play().catch(console.error)

    // 3. Start draw loops
    this.startRafLoop()
    this.startIntervalFallback()

    // 4. Capture composited stream from canvas
    this.compositedStream = this.canvas.captureStream(this.config.fps)
    console.log('[Canvas] Compositor started at', this.config.fps, 'fps')
    return this.compositedStream
  }

  private drawFrame(): void {
    if (!this.ctx || !this.canvas || !this.videoEl) return

    // Draw webcam frame
    this.ctx.drawImage(this.videoEl, 0, 0, this.canvas.width, this.canvas.height)

    // Compute timestamp
    const timeStr = new Date().toLocaleTimeString('en-GB') // HH:MM:SS

    // Measure text for background rect
    this.ctx.font = this.config.timestamp.font
    const textWidth = this.ctx.measureText(timeStr).width
    const pad = this.config.timestamp.padding
    const rectX = this.config.timestamp.x
    const rectY = this.canvas.height - this.config.timestamp.yFromBottom
    const rectW = textWidth + pad * 2
    const rectH = 34

    // Draw semi-transparent background
    this.ctx.fillStyle = this.config.timestamp.bgColor
    this.ctx.fillRect(rectX, rectY, rectW, rectH)

    // Draw timestamp text
    this.ctx.fillStyle = this.config.timestamp.textColor
    this.ctx.fillText(timeStr, rectX + pad, rectY + 24)
  }

  private startRafLoop(): void {
    const loop = () => {
      this.drawFrame()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private startIntervalFallback(): void {
    // Only draws when tab is hidden (RAF pauses in hidden tabs)
    const intervalMs = Math.round(1000 / this.config.fps)
    this.intervalId = setInterval(() => {
      if (document.hidden) this.drawFrame()
    }, intervalMs)
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    if (this.intervalId !== null) clearInterval(this.intervalId)
    this.compositedStream?.getTracks().forEach((t) => t.stop())
    this.canvas = null
    this.ctx = null
    this.videoEl = null
    this.compositedStream = null
    this.rafId = null
    this.intervalId = null
    console.log('[Canvas] Compositor stopped')
  }

  getCompositedStream(): MediaStream | null {
    return this.compositedStream
  }
}
