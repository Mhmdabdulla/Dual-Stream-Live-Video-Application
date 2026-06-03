import { WEBRTC_CONFIG } from '../types'

export class WebRTCService {
  private pc: RTCPeerConnection | null = null

  initialize(): void {
    this.pc = new RTCPeerConnection(WEBRTC_CONFIG)
    console.log('[WebRTC] PeerConnection initialized')
  }

  addTracks(compositedStream: MediaStream, screenStream: MediaStream): void {
    // CRITICAL: order determines track index on the host side
    // Track 0 = composited webcam (with timestamp)
    const webcamTrack = compositedStream.getVideoTracks()[0]
    if (webcamTrack) this.pc?.addTrack(webcamTrack, compositedStream)

    // Track 1 = screen
    const screenTrack = screenStream.getVideoTracks()[0]
    if (screenTrack) this.pc?.addTrack(screenTrack, screenStream)

    // Audio tracks (if any)
    compositedStream.getAudioTracks().forEach((t) => {
      this.pc?.addTrack(t, compositedStream)
    })

    console.log('[WebRTC] Tracks added: webcam, screen, audio')
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized')
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    console.log('[WebRTC] Offer created')
    return this.pc.localDescription as RTCSessionDescriptionInit
  }

  async handleOffer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized')
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    console.log('[WebRTC] Answer created')
    return this.pc.localDescription as RTCSessionDescriptionInit
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc?.setRemoteDescription(new RTCSessionDescription(answer))
    console.log('[WebRTC] Remote description set (answer)')
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc?.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.warn('[WebRTC] Failed to add ICE candidate:', err)
    }
  }

  onTrack(callback: (event: RTCTrackEvent) => void): void {
    if (this.pc) this.pc.ontrack = callback
  }

  onConnectionStateChange(
    callback: (state: RTCPeerConnectionState) => void
  ): void {
    if (this.pc) {
      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState
        if (state) {
          console.log('[WebRTC] Connection state:', state)
          callback(state)
        }
      }
    }
  }

  onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void): void {
    if (this.pc) {
      this.pc.onicecandidate = (event) => {
        if (event.candidate) callback(event.candidate.toJSON())
      }
    }
  }

  attemptIceRestart(): void {
    console.log('[WebRTC] Attempting ICE restart')
    this.pc?.restartIce()
  }

  close(): void {
    this.pc?.close()
    this.pc = null
    console.log('[WebRTC] PeerConnection closed')
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.pc?.connectionState ?? null
  }
}
