export enum ConnectionStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

export enum StreamType {
  WEBCAM = 'webcam',
  SCREEN = 'screen',
}

export interface VideoPlayerProps {
  stream: MediaStream | null
  label: string
  muted?: boolean
  className?: string
}

export interface StreamCardProps {
  label: string
  status: ConnectionStatus
  stream: MediaStream | null
  streamType: StreamType
}

export interface CanvasConfig {
  width: number
  height: number
  fps: number
  timestamp: {
    font: string
    textColor: string
    bgColor: string
    padding: number
    x: number
    yFromBottom: number
  }
}

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 1280,
  height: 720,
  fps: 30,
  timestamp: {
    font: 'bold 22px monospace',
    textColor: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.72)',
    padding: 10,
    x: 12,
    yFromBottom: 50,
  },
}

export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}
