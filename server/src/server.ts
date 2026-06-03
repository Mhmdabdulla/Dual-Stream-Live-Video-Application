import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { registerSignalingHandlers } from './socket/signaling'
import type { ServerToClientEvents, ClientToServerEvents } from './types'

const PORT = process.env.PORT ?? 3001
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CLIENT_URL, methods: ['GET', 'POST'] }))
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'DualStream Signaling Server', port: PORT })
})

const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*", methods: ['GET', 'POST'] },
})

registerSignalingHandlers(io)

httpServer.listen(PORT, () => {
  console.log(`[Server] DualStream signaling running on port ${PORT}`)
})
