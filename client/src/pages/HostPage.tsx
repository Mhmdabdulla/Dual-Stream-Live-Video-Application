import React,{ useState, useRef, useEffect  } from 'react'
import StreamCard from '../components/StreamCard'
import { ConnectionStatus, StreamType } from '../types'
import { WebRTCService } from '../services/WebRTCService'
import socketService from '../services/SocketService'

interface ClientSession {
    socketId: string
    clientId: string
    clientName?: string
    connectedAt: string
    webcamStream: MediaStream | null
    screenStream: MediaStream | null
    status: ConnectionStatus
    elapsedSeconds: number
}

const HostPage: React.FC = () => {
    const [roomId, setRoomId] = useState('room123')
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE)
    const [clients, setClients] = useState<Record<string, ClientSession>>({})
    const [isConnected, setIsConnected] = useState(false)

    const webrtcServices = useRef<Map<string, WebRTCService>>(new Map())
    const trackCounts = useRef<Map<string, number>>(new Map())

    // Increment session timers for all active clients
    useEffect(() => {
        if (!isConnected) return
        const t = setInterval(() => {
            setClients((prev) => {
                const next = { ...prev }
                let updated = false
                for (const id in next) {
                    if (next[id].status === ConnectionStatus.CONNECTED) {
                        next[id] = { ...next[id], elapsedSeconds: next[id].elapsedSeconds + 1 }
                        updated = true
                    }
                }
                return updated ? next : prev
            })
        }, 1000)
        return () => clearInterval(t)
    }, [isConnected])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            webrtcServices.current.forEach((service) => service.close())
            webrtcServices.current.clear()
            trackCounts.current.clear()
            socketService.removeAllListeners()
            socketService.disconnect()
        }
    }, [])

    const clientList = Object.values(clients);

    const setupClientConnection = (clientSocketId: string) => {
        // Create new WebRTC session
        const pcService = new WebRTCService()
        pcService.initialize()
        webrtcServices.current.set(clientSocketId, pcService)
        trackCounts.current.set(clientSocketId, 0)

        // Route incoming tracks
        pcService.onTrack((event) => {
            if (event.track.kind !== 'video') return
            const count = (trackCounts.current.get(clientSocketId) ?? 0) + 1
            trackCounts.current.set(clientSocketId, count)
            const stream = event.streams[0]
            console.log(`[Host] Client ${clientSocketId} track received #${count}`)

            setClients((prev) => {
                const client = prev[clientSocketId]
                if (!client) return prev
                return {
                    ...prev,
                    [clientSocketId]: {
                        ...client,
                        webcamStream: count === 1 ? stream : client.webcamStream,
                        screenStream: count === 2 ? stream : client.screenStream,
                        status: count === 2 ? ConnectionStatus.CONNECTED : client.status
                    }
                }
            })
        })

        pcService.onIceCandidate((candidate) => {
            socketService.sendIceCandidate(candidate, roomId, clientSocketId)
        })

        pcService.onConnectionStateChange((state) => {
            console.log(`[Host] Client ${clientSocketId} WebRTC connection state: ${state}`)
            setClients((prev) => {
                const client = prev[clientSocketId]
                if (!client) return prev
                let newStatus = client.status
                if (state === 'failed') newStatus = ConnectionStatus.ERROR
                if (state === 'disconnected' || state === 'closed') newStatus = ConnectionStatus.DISCONNECTED
                return {
                    ...prev,
                    [clientSocketId]: {
                        ...client,
                        status: newStatus
                    }
                }
            })
        })

        return pcService
    }

    const handleConnect = () => {
        if (!roomId.trim()) return
        socketService.connect()
        socketService.joinRoom(roomId.trim(), 'host')
        setStatus(ConnectionStatus.CONNECTED)
        setIsConnected(true)

        socketService.onClientJoined((info) => {
            const clientSocketId = info.clientId
            console.log('[Host] Client joined:', clientSocketId)

            setClients((prev) => ({
                ...prev,
                [clientSocketId]: {
                    socketId: clientSocketId,
                    clientId: clientSocketId.slice(0, 8),
                    connectedAt: new Date().toISOString(),
                    webcamStream: null,
                    screenStream: null,
                    status: ConnectionStatus.CONNECTING,
                    elapsedSeconds: 0
                }
            }))

            setupClientConnection(clientSocketId)
            // Send host-ready signal to client
            socketService.sendHostReady(clientSocketId)
        })

        socketService.onOffer(async (offer, senderId) => {
            console.log('[Host] Offer received from:', senderId)
            let pcService = webrtcServices.current.get(senderId)
            if (!pcService) {
                console.log('[Host] Offer from unregistered client, creating session...')
                setClients((prev) => ({
                    ...prev,
                    [senderId]: {
                        socketId: senderId,
                        clientId: senderId.slice(0, 8),
                        connectedAt: new Date().toISOString(),
                        webcamStream: null,
                        screenStream: null,
                        status: ConnectionStatus.CONNECTING,
                        elapsedSeconds: 0
                    }
                }))
                pcService = setupClientConnection(senderId)
            }

            const answer = await pcService.handleOffer(offer)
            socketService.sendAnswer(answer, roomId, senderId)
        })

        socketService.onIceCandidate(async (candidate, senderId) => {
            const pcService = webrtcServices.current.get(senderId)
            if (pcService) {
                await pcService.addIceCandidate(candidate)
            }
        })

        socketService.onPeerDisconnected((info) => {
            console.log('[Host] Peer disconnected:', info.senderId)
            const pcService = webrtcServices.current.get(info.senderId)
            if (pcService) {
                pcService.close()
                webrtcServices.current.delete(info.senderId)
            }
            trackCounts.current.delete(info.senderId)
            setClients((prev) => {
                const next = { ...prev }
                delete next[info.senderId]
                return next
            })
        })

        socketService.onClientInfo((info) => {
            setClients((prev) => {
                const client = prev[info.senderId]
                if (!client) return prev
                return {
                    ...prev,
                    [info.senderId]: {
                        ...client,
                        clientId: info.clientId,
                        clientName: info.clientName, 
                        connectedAt: info.timestamp
                    }
                }
            })
        })
    }

    const handleDisconnectClient = (clientSocketId: string) => {
        const pcService = webrtcServices.current.get(clientSocketId)
        if (pcService) {
            pcService.close()
            webrtcServices.current.delete(clientSocketId)
        }
        trackCounts.current.delete(clientSocketId)
        setClients((prev) => {
            const next = { ...prev }
            delete next[clientSocketId]
            return next
        })
    }

    const handleDisconnectAll = () => {
        webrtcServices.current.forEach((pcService) => pcService.close())
        webrtcServices.current.clear()
        trackCounts.current.clear()
        socketService.removeAllListeners()
        socketService.disconnect()
        setClients({})
        setIsConnected(false)
        setStatus(ConnectionStatus.IDLE)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>DualStream — Host Dashboard</h1>
                <div className="header-right">
                    <span className={`status-badge status-badge--${status === ConnectionStatus.CONNECTED ? 'green' :
                        status === ConnectionStatus.CONNECTING ? 'yellow' : 'gray'
                        }`}>{status}</span>
                </div>
            </div>

            <div className="controls">
                <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID"
                    disabled={isConnected}
                    aria-label="Room ID"
                />
                <button
                    onClick={handleConnect}
                    disabled={isConnected}
                    className="btn btn--primary"
                >
                    Connect to Room
                </button>
                <button
                    onClick={handleDisconnectAll}
                    disabled={!isConnected}
                    className="btn btn--danger"
                >
                    Disconnect All
                </button>
            </div>

            {isConnected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4! mb-6! flex justify-between items-center">
                    <span className="text-sm text-blue-900 font-medium">
                        Active Room: <strong className="font-semibold">{roomId}</strong>
                    </span>
                    <span className="text-sm text-blue-900 font-medium">
                        Connected Clients: <strong className="bg-blue-600 text-white px-2! py-0.5! rounded-full text-xs font-semibold">{Object.keys(clients).length}</strong>
                    </span>
                </div>
            )}

            <div className="space-y-12">
                {clientList.map((client, index) => (
                    <React.Fragment key={client.socketId}>

                        <div
                            className="
                    bg-white
                    rounded-2xl
                    shadow-lg
                    border
                    border-gray-200
                    border-l-8
                    border-l-indigo-600
                    overflow-hidden
                    transition-all
                    duration-200
                    hover:shadow-xl
                "
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-5 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                        {(client.clientName || client.clientId)[0].toUpperCase()}
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {client.clientName || `Client ${client.clientId.slice(0, 8)}`}
                                        </h2>

                                        <p className="text-sm text-gray-500 font-mono">
                                            Socket: {client.socketId.slice(0, 10)}...
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            Connected:{" "}
                                            {new Date(client.connectedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-wrap">

                                    <span
                                        className={`status-badge status-badge--${client.status === ConnectionStatus.CONNECTED
                                                ? "green"
                                                : client.status === ConnectionStatus.CONNECTING
                                                    ? "yellow"
                                                    : "red"
                                            }`}
                                    >
                                        {client.status}
                                    </span>

                                    <span className="text-sm font-mono text-gray-600">
                                        Session: {client.elapsedSeconds}s
                                    </span>

                                    <button
                                        onClick={() =>
                                            handleDisconnectClient(client.socketId)
                                        }
                                        className="btn btn--danger"
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        Disconnect Client
                                    </button>
                                </div>
                            </div>

                            {/* Streams */}
                            <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 bg-gray-50/40">

                                <div className="xl:col-span-1">
                                    <StreamCard
                                        label="Webcam Feed"
                                        status={client.status}
                                        stream={client.webcamStream}
                                        streamType={StreamType.WEBCAM}
                                    />
                                </div>

                                <div className="xl:col-span-2">
                                    <StreamCard
                                        label="Screen Share"
                                        status={client.status}
                                        stream={client.screenStream}
                                        streamType={StreamType.SCREEN}
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Separator Between Clients */}
                        {index < clientList.length - 1 && (
                            <div className="flex items-center gap-4 py-2">
                                <div className="flex-1 border-t border-gray-200" />

                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Next Client
                                </span>

                                <div className="flex-1 border-t border-gray-200" />
                            </div>
                        )}

                    </React.Fragment>
                ))}

                {isConnected && clientList.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                        Waiting for clients to join room...
                    </div>
                )}
            </div>

        </div>
    )
}

export default HostPage
