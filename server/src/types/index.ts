export interface RTCSessionDescriptionInit {
  type: 'offer' | 'pranswer' | 'answer' | 'rollback';
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export interface JoinRoomPayload {
  roomId: string
  role: 'client' | 'host'
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit
  roomId: string
  targetId?: string
  senderId?: string
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit
  roomId: string
  targetId?: string
  senderId?: string
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit
  roomId: string
  targetId?: string
  senderId?: string
}

export interface ClientInfoPayload {
  clientId?: string
  clientName?: string
  timestamp: string
  roomId: string
  targetId?: string
  senderId?: string
}

export interface HostReadyPayload {
  targetId?: string
  hostId?: string
}

export interface PeerDisconnectedPayload {
  senderId: string
}

export interface ClientJoinedPayload {
  clientId: string
}

export interface HostJoinedPayload {
  hostId: string
}

export interface ServerToClientEvents {
  offer: (payload: OfferPayload) => void
  answer: (payload: AnswerPayload) => void
  'ice-candidate': (payload: IceCandidatePayload) => void
  'peer-disconnected': (payload: PeerDisconnectedPayload) => void
  'client-info': (payload: ClientInfoPayload) => void
  'host-ready': (payload: HostReadyPayload) => void
  'client-joined': (payload: ClientJoinedPayload) => void
  'host-joined': (payload: HostJoinedPayload) => void
}

export interface ClientToServerEvents {
  'join-room': (payload: JoinRoomPayload) => void
  offer: (payload: OfferPayload) => void
  answer: (payload: AnswerPayload) => void
  'ice-candidate': (payload: IceCandidatePayload) => void
  'client-info': (payload: ClientInfoPayload) => void
  'host-ready': (payload: HostReadyPayload) => void
}

export interface Room {
  hostSocketId: string | null
  clientSocketIds: string[]
}
