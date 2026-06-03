import { Server } from 'socket.io'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  JoinRoomPayload,
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  ClientInfoPayload,
  HostReadyPayload
} from '../types'

const rooms = new Map<string, Room>()
const socketSessions = new Map<string, { roomId: string; role: 'client' | 'host' }>()

export function registerSignalingHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket) => {
    console.log(`[Signaling] socket ${socket.id} connected`)

    socket.on('join-room', (payload: JoinRoomPayload) => {
      socket.join(payload.roomId)
      socketSessions.set(socket.id, { roomId: payload.roomId, role: payload.role })

      let room = rooms.get(payload.roomId)
      if (!room) {
        room = { hostSocketId: null, clientSocketIds: [] }
        rooms.set(payload.roomId, room)
      }

      console.log(`[Signaling] ${payload.role} ${socket.id} joining room ${payload.roomId}`)

      if (payload.role === 'host') {
        room.hostSocketId = socket.id
        // Notify existing clients in the room that the host has joined
        socket.to(payload.roomId).emit('host-joined', { hostId: socket.id })
      } else {
        if (!room.clientSocketIds.includes(socket.id)) {
          room.clientSocketIds.push(socket.id)
        }
        // Notify the host (and others) in the room that a client has joined
        socket.to(payload.roomId).emit('client-joined', { clientId: socket.id })
      }
    })

    socket.on('host-ready', (payload: HostReadyPayload) => {
      if (payload.targetId) {
        console.log(`[Signaling] Relaying host-ready from host ${socket.id} to client ${payload.targetId}`)
        socket.to(payload.targetId).emit('host-ready', { hostId: socket.id })
      }
    })

    socket.on('offer', (payload: OfferPayload) => {
      if (payload.targetId) {
        console.log(`[Signaling] Relaying offer from client ${socket.id} to host ${payload.targetId}`)
        socket.to(payload.targetId).emit('offer', {
          offer: payload.offer,
          roomId: payload.roomId,
          senderId: socket.id
        })
      }
    })

    socket.on('answer', (payload: AnswerPayload) => {
      if (payload.targetId) {
        console.log(`[Signaling] Relaying answer from host ${socket.id} to client ${payload.targetId}`)
        socket.to(payload.targetId).emit('answer', {
          answer: payload.answer,
          roomId: payload.roomId,
          senderId: socket.id
        })
      }
    })

    socket.on('ice-candidate', (payload: IceCandidatePayload) => {
      if (payload.targetId) {
        socket.to(payload.targetId).emit('ice-candidate', {
          candidate: payload.candidate,
          roomId: payload.roomId,
          senderId: socket.id
        })
      }
    })

    socket.on('client-info', (payload: ClientInfoPayload) => {
      if (payload.targetId) {
        socket.to(payload.targetId).emit('client-info', {
          clientId: payload.clientId,
          clientName: payload.clientName,
          timestamp: payload.timestamp,
          roomId: payload.roomId,
          senderId: socket.id
        })
      }
    })

    socket.on('disconnect', () => {
      console.log(`[Signaling] socket ${socket.id} disconnected`)
      const session = socketSessions.get(socket.id)
      if (session) {
        const { roomId, role } = session
        socketSessions.delete(socket.id)

        const room = rooms.get(roomId)
        if (room) {
          if (role === 'host') {
            room.hostSocketId = null
          } else {
            room.clientSocketIds = room.clientSocketIds.filter((id) => id !== socket.id)
          }

          if (room.hostSocketId === null && room.clientSocketIds.length === 0) {
            rooms.delete(roomId)
          }

          // Broadcast peer-disconnected to remaining clients/host in the room
          socket.to(roomId).emit('peer-disconnected', { senderId: socket.id })
        }
      }
    })
  })
}
