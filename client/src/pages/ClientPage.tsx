import { useState, useRef, useEffect } from 'react'
import VideoPlayer from '../components/VideoPlayer'
import { ConnectionStatus } from '../types'
import { MediaService } from '../services/MediaService'
import { CanvasService } from '../services/CanvasService'
import { WebRTCService } from '../services/WebRTCService'
import socketService from '../services/SocketService'

const ClientPage: React.FC = () => {
  const [roomId, setRoomId] = useState('room123')
  const [clientName,setClientName] = useState('') 
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const mediaService = useRef(new MediaService())
  const canvasService = useRef(new CanvasService())
  const webrtcService = useRef(new WebRTCService())
  const currentHostId = useRef<string | null>(null)
  const clientUuid = useRef('567uui43')
  

  // Auto-dismiss errors after   
  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(null), 5000)
    return () => clearTimeout(t)
  }, [errorMsg])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      canvasService.current.stop()
      mediaService.current.stopAll()
      webrtcService.current.close()
      socketService.removeAllListeners()
      socketService.disconnect()
    }
  }, [])

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setStatus(ConnectionStatus.ERROR)
  }

  const handleStop = () => {
    canvasService.current.stop()
    mediaService.current.stopAll()
    webrtcService.current.close()
    socketService.removeAllListeners()
    socketService.disconnect()
    setLocalStream(null)
    setIsStreaming(false)
    setStatus(ConnectionStatus.IDLE)
    currentHostId.current = null
  }

  const handleStart = async () => {
    if (!roomId.trim()) { showError('Please enter a room ID'); return }
    if (!clientName.trim()) { showError('Please enter a Name'); return }

    setStatus(ConnectionStatus.CONNECTING)
    setErrorMsg(null)

    // Connect
    socketService.connect()

    // Acquire webcam (MUST be first)
    let webcamStream: MediaStream
    try {
      webcamStream = await mediaService.current.requestWebcam()
    } catch (err) {
      showError((err as Error).message)
      return
    }

    // Acquire screen (MUST be second)
    let screenStream: MediaStream
    try {
      screenStream = await mediaService.current.requestScreen()
    } catch (err) {
      mediaService.current.stopAll()
      showError((err as Error).message)
      return
    }

    // Start canvas compositor → get composited stream
    const compositedStream = canvasService.current.start(webcamStream)
    setLocalStream(compositedStream)
    setIsStreaming(true)

    // Init WebRTC + add tracks
    webrtcService.current.initialize()
    webrtcService.current.addTracks(compositedStream, screenStream)

    // Wire WebRTC callbacks
    webrtcService.current.onIceCandidate((candidate) => {
      if (currentHostId.current) {
        socketService.sendIceCandidate(candidate, roomId, currentHostId.current)
      }
    })

    webrtcService.current.onConnectionStateChange((state) => {
      if (state === 'connected') {
        setStatus(ConnectionStatus.CONNECTED)
        if (currentHostId.current) {
          socketService.sendClientInfo(clientUuid.current,clientName, roomId, currentHostId.current)
        }
      }
      if (state === 'failed') webrtcService.current.attemptIceRestart()
      if (state === 'disconnected' || state === 'closed') {
        setStatus(ConnectionStatus.DISCONNECTED)
      }
    })

    // Wire Socket callbacks
    socketService.onAnswer(async (answer, senderId) => {
      if (senderId === currentHostId.current) {
        await webrtcService.current.handleAnswer(answer)
      }
    })

    socketService.onIceCandidate(async (candidate, senderId) => {
      if (senderId === currentHostId.current) {
        await webrtcService.current.addIceCandidate(candidate)
      }
    })

    const startWebRTCHandshake = async (hostId: string) => {
      currentHostId.current = hostId
      try {
        const offer = await webrtcService.current.createOffer()
        socketService.sendOffer(offer, roomId, hostId)
      } catch (err) {
        console.error('[Client] Failed to create offer:', err)
      }
    }

    // Offer is sent when host signals it is ready or has joined
    socketService.onHostReady(async (info) => {
      console.log('[Client] Host ready signal received from:', info.hostId)
      if (info.hostId) {
        await startWebRTCHandshake(info.hostId)
      }
    })

    socketService.onHostJoined(async (info) => {
      console.log('[Client] Host joined signal received from room:', info.hostId)
      if (info.hostId) {
        await startWebRTCHandshake(info.hostId)
      }
    })

    //join room
    socketService.joinRoom(roomId.trim(), 'client')

    // Handle user clicking browser's "Stop sharing" button
    mediaService.current.setupScreenEndedHandler(handleStop)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>DualStream — Client</h1>
        <span className={`status-badge status-badge--${
          status === ConnectionStatus.CONNECTED ? 'green' :
          status === ConnectionStatus.CONNECTING ? 'yellow' :
          status === ConnectionStatus.ERROR ? 'red' : 'gray'
        }`}>{status}</span>
      </div>

      {errorMsg && (
        <div className="error-box">
          <strong>Error: </strong>{errorMsg}
        </div>
      )}

      <div className="controls">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter room ID"
          disabled={isStreaming}
          aria-label="Room ID"
        />
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Enter your name"
          disabled={isStreaming}
          aria-label="Client Name"
        />
        <button
          onClick={handleStart}
          disabled={isStreaming}
          className="btn btn--primary"
        >
          Start Streaming
        </button>
        <button
          onClick={handleStop}
          disabled={!isStreaming}
          className="btn btn--danger"
        >
          Stop Streaming
        </button>
      </div>

      <div className="preview-section">
        <VideoPlayer
          stream={localStream}
          label="Your camera (with timestamp overlay)"
          muted
        />
        {isStreaming && (
          <p className="preview-note">
            Screen is being captured and transmitted to host
          </p>
        )}
      </div>
    </div>
  )
}

export default ClientPage
