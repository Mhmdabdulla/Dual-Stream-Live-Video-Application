<div align="center">

<img src="https://img.shields.io/badge/DualStream-Live%20Video-2563EB?style=for-the-badge&logo=webrtc&logoColor=white" alt="DualStream" />

# DualStream Live Vidoe Application

### Real-time dual-stream webcam + screen sharing with live timestamp overlay

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)


<br/>

> A browser-based, zero-plugin application that simultaneously streams a client's **webcam** and **entire screen** to a remote **Host Dashboard** — with a live `HH:MM:SS` timestamp permanently embedded into the video feed. Built on WebRTC for true peer-to-peer transmission with sub-200ms latency.

<br/>

![DualStream Host Dashboard]([https://placeholder.co/900x500/1B2A4A/FFFFFF?text=Host+Dashboard+Screenshot](https://drive.google.com/file/d/1DxeccepcL7sGUtmND4V3okoTBZL_wmuc/view?usp=sharing))

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running in Development](#running-in-development)
  - [Running in Production](#running-in-production)
- [Usage](#usage)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
  - [Signaling Flow](#signaling-flow)
  - [Timestamp Overlay](#timestamp-overlay)
  - [Track Routing](#track-routing)
- [API Reference](#api-reference)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

---

## Overview

DualStream is a real-time video surveillance and monitoring tool, live technical assessments, and supervised collaboration sessions. A single client session transmits two independent live video feeds — the participant's face via webcam and their full screen activity — to a centralized host dashboard, all running natively in the browser with no plugins required.

The architecture is built entirely on open web standards: **WebRTC** for peer-to-peer media transmission, **Socket.IO** for lightweight signaling, and the **Canvas API** for real-time timestamp compositing. No third-party streaming CDN is needed.

---

## Features

| Feature | Description |
|---|---|
| **Dual-stream capture** | Simultaneous webcam (`getUserMedia`) + screen (`getDisplayMedia`) at 1280×720 |
| **Live timestamp overlay** | `HH:MM:SS` clock composited directly into the webcam feed via Canvas API at 30 fps |
| **Peer-to-peer transmission** | Direct WebRTC connection after handshake — zero media routing through the server |
| **Host dashboard** | Side-by-side display of both incoming streams per connected client |
| **Multi-client support** | Host can monitor multiple simultaneous client sessions in one view |
| **Connection status** | Real-time status badges (idle / connecting / connected / disconnected) with elapsed session timer |
| **Kick client** | Host can terminate individual client sessions from the dashboard |
| **Disconnection detection** | `peer-disconnected` event reaches the host within 3 seconds of client leaving |
| **Tab-hidden resilience** | Canvas compositor keeps running when client switches tabs via `setInterval` fallback |
| **Graceful error handling** | Clear, actionable messages for permission denial; no silent failures |
| **Fully typed** | End-to-end TypeScript — client and server share strict interface contracts |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT PAGE                               │
│                     localhost:5173/client                        │
│                                                                  │
│  getUserMedia()  ──►  Canvas Compositor  ──►  RTCPeerConnection  │
│                          + HH:MM:SS                              │
│  getDisplayMedia() ──────────────────────►  RTCPeerConnection    │
└────────────────────────────┬─────────────────────────────────────┘
                             │  Socket.IO (WebSocket)
                             │  Offer / Answer / ICE candidates
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SIGNALING SERVER                             │
│                       localhost:3001                             │
│                                                                  │
│   Node.js + Express + Socket.IO                                  │
│   join-room · offer · answer · ice-candidate · disconnect        │
│   (Zero media routing — pure metadata relay)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │  Socket.IO (WebSocket)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      HOST DASHBOARD                              │
│                     localhost:5173/host                          │
│                                                                  │
│  RTCPeerConnection  ──►  track[0]  ──►  <video> Webcam feed     │
│                    ──►  track[1]  ──►  <video> Screen feed      │
└──────────────────────────────────────────────────────────────────┘
                             ▲
              WebRTC P2P (UDP / DTLS-SRTP)
              After handshake, all media is direct.
              The server is completely out of the media path.
```

---

## Tech Stack

### Frontend (`/client`)

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 18.2 |
| Language | TypeScript | 5.2 |
| Build tool | Vite | 5.0 |
| Routing | React Router DOM | 6.18 |
| Real-time client | Socket.IO Client | 4.6 |
| Media capture | `getUserMedia` / `getDisplayMedia` | Web API |
| Timestamp overlay | Canvas API + `captureStream()` | Web API |
| P2P transmission | `RTCPeerConnection` (WebRTC) | Web API |

### Backend (`/server`)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| HTTP server | Express | 4.18 |
| WebSocket signaling | Socket.IO | 4.6 |
| Language | TypeScript | 5.2 |
| Execution (dev) | tsx + nodemon | 4.0 / 3.0 |

### Infrastructure

| Service | Provider | Purpose |
|---|---|---|
| STUN server | Google (`stun.l.google.com:19302`) | ICE candidate discovery / NAT traversal |
| TURN server | Self-hosted (Coturn) *(optional)* | Relay for symmetric NAT environments |

---

## Project Structure

```
dual-stream-app/
│
├── client/                          # React + TypeScript + Vite frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts               # /socket.io proxy → localhost:3001
│   ├── index.html
│   └── src/
│       ├── main.tsx                 # React entry point (StrictMode)
│       ├── App.tsx                  # Router: / → /client, /host
│       ├── index.css                # Design tokens + component styles
│       │
│       ├── pages/
│       │   ├── ClientPage.tsx       # Broadcaster: capture + transmit
│       │   └── HostPage.tsx         # Viewer: receive + display
│       │
│       ├── components/
│       │   ├── VideoPlayer.tsx      # Reusable <video> with srcObject ref
│       │   └── StreamCard.tsx       # Labeled video card + status badge
│       │
│       ├── services/
│       │   ├── SocketService.ts     # Socket.IO singleton (all emit/on)
│       │   ├── WebRTCService.ts     # RTCPeerConnection full lifecycle
│       │   ├── MediaService.ts      # getUserMedia + getDisplayMedia
│       │   └── CanvasService.ts     # Canvas compositor + clock overlay
│       │
│       └── types/
│           └── index.ts             # Shared enums, interfaces, constants
│
└── server/                          # Node.js + Express + Socket.IO backend
    ├── package.json
    ├── tsconfig.json
    ├── .env
    ├── .env.example
    └── src/
        ├── server.ts                # Express + Socket.IO entry point
        ├── socket/
        │   └── signaling.ts         # All WebSocket event handlers
        └── types/
            └── index.ts             # Server-side typed interfaces
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org) v20 or higher
- [npm](https://npmjs.com) v9 or higher
- A modern browser: Chrome 100+, Firefox 100+, Edge 100+, or Safari 15.4+
- A webcam and microphone connected to your machine

> **Important:** `getDisplayMedia()` (screen capture) requires a **secure context**. `localhost` is automatically exempt. For any other host, you must serve over **HTTPS**.

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/dual-stream-app.git
cd dual-stream-app
```

**2. Install server dependencies**

```bash
cd server
npm install
```

**3. Install client dependencies**

```bash
cd ../client
npm install
```

**4. Configure environment**

```bash
# In the server/ directory
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

### Running in Development

You need **two terminals** running simultaneously.

**Terminal 1 — Start the signaling server:**

```bash
cd server
npm run dev
```

Expected output:
```
[Server] DualStream signaling running on port 3001
```

**Terminal 2 — Start the React frontend:**

```bash
cd client
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Running in Production

**Build the client:**

```bash
cd client
npm run build
# Output → client/dist/
```

**Build the server:**

```bash
cd server
npm run build
# Output → server/dist/
```

**Start the production server:**

```bash
cd server
npm start
```

> In production, serve the built `client/dist/` folder via a static file server (nginx, Caddy) or configure Express to serve it. Ensure your deployment is behind **HTTPS**.

---

## Usage

### Basic flow

```
1. Open the Host Dashboard first
2. Open the Client page (separate tab or device)
3. Enter the same Room ID on both pages
4. Host clicks "Connect to Room"
5. Client clicks "Start Streaming"
6. Allow camera permission → allow screen share permission
7. Both live feeds appear on the Host Dashboard within ~3 seconds
```

### Step-by-step

**Host Dashboard** → `http://localhost:5173/host`

1. Enter a **Room ID** (e.g. `room123`) in the input field
2. Click **Connect to Room**
3. Status changes to `connecting` — waiting for a client

**Client Page** → `http://localhost:5173/client`

1. Enter the **same Room ID** as the host
2. Click **Start Streaming**
3. Allow **camera** permission when the browser prompts
4. Select the screen/window to share and click **Share** when the browser prompts
5. Your local webcam preview appears with the `HH:MM:SS` clock overlaid
6. Status changes to `connected`

**Host Dashboard** (now shows):
- Left panel: live webcam feed with timestamp permanently visible
- Right panel: live screen share feed
- Client metadata: Client ID, socket ID, connected timestamp, elapsed time

---

## Configuration

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port for the Node.js signaling server |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin allowed to connect to the server |

### WebRTC configuration

To add a TURN server for environments behind symmetric NAT, update `client/src/types/index.ts`:

```typescript
export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-credential',
    },
  ],
}
```

### Canvas / timestamp configuration

Customize the timestamp appearance in `client/src/types/index.ts`:

```typescript
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 1280,
  height: 720,
  fps: 30,
  timestamp: {
    font: 'bold 22px monospace',
    textColor: '#FFFFFF',
    bgColor: 'rgba(0, 0, 0, 0.72)',
    padding: 10,
    x: 12,
    yFromBottom: 50,
  },
}
```

---

## How It Works

### Signaling Flow

WebRTC peers cannot connect without exchanging session metadata. The Node.js signaling server acts as a temporary relay — it carries only the handshake messages, never the media.

```
Host                Signaling Server           Client
 │                        │                      │
 │── join-room ──────────►│                      │
 │◄─ host-ready ──────────│                      │
 │                        │◄─── join-room ───────│
 │                        │──── host-ready ──────►│
 │                        │◄─── offer ───────────│
 │◄─────────── offer ─────│                      │
 │── answer ─────────────►│                      │
 │                        │──── answer ──────────►│
 │◄═══════════════ ICE candidates (both ways) ═══►│
 │                        │                      │
 │◄══════════════ WebRTC P2P media (UDP) ════════►│
 │         (server completely out of this path)   │
```

### Timestamp Overlay

The clock cannot be drawn directly onto a `MediaStream`. The implementation uses the Canvas API as a compositor:

```
Webcam MediaStream
        │
        ▼
  Hidden <video>  ──────────────────────────┐
        │                                   ▼
  requestAnimationFrame loop ──► ctx.drawImage(video)
  + setInterval(33ms) fallback     + ctx.fillText(HH:MM:SS)
                                        │
                                        ▼
                            canvas.captureStream(30fps)
                                        │
                                        ▼
                            Composited MediaStream
                         (webcam + clock, transmit-ready)
```

The `setInterval` fallback is critical: `requestAnimationFrame` pauses when the browser tab is hidden. Without the fallback, the transmitted timestamp would freeze whenever the client switches tabs.

### Track Routing

Two video tracks are added to the `RTCPeerConnection` in a guaranteed order:

```typescript
// In WebRTCService.addTracks() — order is contractual
pc.addTrack(compositedWebcamTrack, compositedStream)  // index 0 → webcam
pc.addTrack(screenTrack, screenStream)                // index 1 → screen
pc.addTrack(...audioTracks)                           // index 2+ → audio
```

On the host side, `ontrack` events fire sequentially. A `trackCount` ref routes each track:

```typescript
webrtcService.onTrack((event) => {
  trackCount.current += 1
  if (trackCount.current === 1) setWebcamStream(event.streams[0])
  if (trackCount.current === 2) setScreenStream(event.streams[0])
})
```

> `event.track.label` is **not used** for routing — it is browser-dependent and unreliable across Chrome / Firefox / Safari.

---

## API Reference

### Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client/Host → Server | `{ roomId, role }` | Join a signaling room |
| `host-ready` | Server → Client | — | Tells client the host is ready for an offer |
| `offer` | Client → Server → Host | `{ offer, roomId }` | SDP offer relay |
| `answer` | Host → Server → Client | `{ answer, roomId }` | SDP answer relay |
| `ice-candidate` | Both → Server → Both | `{ candidate, roomId }` | ICE candidate relay |
| `client-info` | Client → Server → Host | `{ clientId, timestamp, roomId }` | Session metadata |
| `peer-disconnected` | Server → remaining peers | — | Peer left the room |

---

## Browser Support

| Browser | Webcam | Screen share | WebRTC | Notes |
|---|---|---|---|---|
| Chrome 100+ | ✅ | ✅ | ✅ | Fully supported |
| Edge 100+ | ✅ | ✅ | ✅ | Fully supported |
| Firefox 100+ | ✅ | ✅ | ✅ | Fully supported |
| Safari 15.4+ | ✅ | ✅ | ✅ | Requires `muted` + `playsInline` on `<video>` |
| Mobile browsers | ✅ | ❌ | ✅ | `getDisplayMedia` not supported on mobile (Try firfox Nightly and change config togetDisplayMedia : true) |

---

## Troubleshooting

### No video appears on the Host Dashboard

- Verify both pages are using the **identical Room ID**
- Check the browser console on both pages for WebRTC errors
- Confirm the signaling server is running on port 3001: `curl http://localhost:3001/`
- If on different networks, you may need a TURN server (see [Configuration](#configuration))

### "Camera permission denied" error

- Open browser settings and allow camera access for `localhost`
- Chrome: `chrome://settings/content/camera`
- Firefox: click the lock icon in the address bar → Permissions

### Screen share not working

- `getDisplayMedia` requires **HTTPS** or **localhost** — plain `http://` on a remote host will fail
- On macOS: System Preferences → Security & Privacy → Screen Recording → allow your browser

### Timestamp freezes when client switches tabs

- This is the tab-hidden canvas issue. Check that `CanvasService` has both:
  - `requestAnimationFrame` loop (primary)
  - `setInterval(drawFrame, 33)` with `document.hidden` check (fallback)
- If both are running and it still freezes, check that the `<canvas>` element is attached to the document

### Host receives only one stream instead of two

- Track order may have been disrupted. Ensure `addTracks()` adds composited webcam first, screen second
- Check browser console for `ontrack` events — there should be exactly 2 video track events

### Connection stuck at "connecting"

- Try refreshing both pages and reconnecting
- Check for CORS errors in the console — verify `CLIENT_URL` in `server/.env` matches your Vite port
- Test with a different Room ID in case a stale socket is occupying the room

### TypeScript compilation errors

- Run `npm install` in both `client/` and `server/` directories
- Ensure Node.js version is 20+: `node --version`
- Delete `node_modules/` and reinstall: `rm -rf node_modules && npm install`

---

## Known Limitations

| Limitation | Impact | Workaround / Roadmap |
|---|---|---|
| **Symmetric NAT** | P2P connection fails behind strict corporate firewalls or VPNs | Add a TURN relay server (Coturn) to `WEBRTC_CONFIG` |
| **No mobile screen share** | `getDisplayMedia` is not available on iOS or Android browsers | Out of scope; native apps would be required |
| **No recording** | Streams are live-only; nothing is stored | Use MediaRecorder API in a v2 feature |
| **No authentication** | Anyone who knows the Room ID can join | Add token-based room auth in a v2 feature with real OTP verification and DB integration|
| **Single SFU for scale** | Direct P2P doesn't scale beyond ~10 clients per host | Replace with mediasoup / LiveKit SFU for large sessions |
| **Timestamp is client-local** | Clock reflects the client's system time, not server-synced UTC | Add NTP sync via a time endpoint for auditable sessions |



<div align="center">

Built with React, TypeScript, WebRTC, and Socket.IO

**DualStream Live Video Application** · Real-time dual video streaming · MIT License

</div>
