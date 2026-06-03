import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private static instance: SocketService

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  connect(serverUrl: string = window.location.origin): void {
    // Connect to origin — Vite proxy routes /socket.io to port 3001
    this.socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    })
    this.socket.on('connect', () =>
      console.log('[Socket] Connected:', this.socket?.id)
    )
    this.socket.on('disconnect', () =>
      console.log('[Socket] Disconnected')
    )
  }

  disconnect(): void { this.socket?.disconnect(); this.socket = null }
  isConnected(): boolean { return this.socket?.connected ?? false }

  joinRoom(roomId: string, role: 'client' | 'host'): void {
    this.socket?.emit('join-room', { roomId, role })
  }

  sendHostReady(targetId: string): void {
    this.socket?.emit('host-ready', { targetId })
  }

  sendOffer(offer: RTCSessionDescriptionInit, roomId: string, targetId: string): void {
    this.socket?.emit('offer', { offer, roomId, targetId })
  }

  sendAnswer(answer: RTCSessionDescriptionInit, roomId: string, targetId: string): void {
    this.socket?.emit('answer', { answer, roomId, targetId })
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, roomId: string, targetId: string): void {
    this.socket?.emit('ice-candidate', { candidate, roomId, targetId })
  }

  sendClientInfo(clientId: string,clientName:string, roomId: string, targetId: string): void {
    this.socket?.emit('client-info', {
      clientId,
      clientName,
      timestamp: new Date().toISOString(),
      roomId,
      targetId
    })
  }

  onOffer(cb: (offer: RTCSessionDescriptionInit, senderId: string) => void): void {
    this.socket?.on('offer', (payload) => {
      if (payload.senderId) {
        cb(payload.offer, payload.senderId)
      }
    })
  }

  onAnswer(cb: (answer: RTCSessionDescriptionInit, senderId: string) => void): void {
    this.socket?.on('answer', (payload) => {
      if (payload.senderId) {
        cb(payload.answer, payload.senderId)
      }
    })
  }

  onIceCandidate(cb: (candidate: RTCIceCandidateInit, senderId: string) => void): void {
    this.socket?.on('ice-candidate', (payload) => {
      if (payload.senderId) {
        cb(payload.candidate, payload.senderId)
      }
    })
  }

  onPeerDisconnected(cb: (info: { senderId: string }) => void): void {
    this.socket?.on('peer-disconnected', cb)
  }

  onHostReady(cb: (info: { hostId: string }) => void): void {
    this.socket?.on('host-ready', cb)
  }

  onClientJoined(cb: (info: { clientId: string }) => void): void {
    this.socket?.on('client-joined', cb)
  }

  onHostJoined(cb: (info: { hostId: string }) => void): void {
    this.socket?.on('host-joined', cb)
  }

  onClientInfo(cb: (info: { clientId: string; clientName:string; timestamp: string; senderId: string }) => void): void {
    this.socket?.on('client-info', (payload) => {
      if (payload.senderId) {
        cb({
          clientId: payload.clientId ?? payload.senderId,
          clientName:payload.clientName,
          timestamp: payload.timestamp,
          senderId: payload.senderId
        })
      }
    })
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners()
  }
}

const socketServiceInstance = SocketService.getInstance()
export default socketServiceInstance
