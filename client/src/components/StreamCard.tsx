import VideoPlayer from './VideoPlayer'
import { ConnectionStatus, StreamType } from '../types'
import type { StreamCardProps } from '../types'

const statusColorMap: Record<ConnectionStatus, string> = {
  [ConnectionStatus.IDLE]: 'gray',
  [ConnectionStatus.CONNECTING]: 'yellow',
  [ConnectionStatus.CONNECTED]: 'green',
  [ConnectionStatus.DISCONNECTED]: 'red',
  [ConnectionStatus.ERROR]: 'red',
}

const StreamCard: React.FC<StreamCardProps> = ({
  label,
  status,
  stream,
  streamType,
}) => {
  const color = statusColorMap[status]

  return (
    <div className={`stream-card stream-card--${streamType}`}>
      {label && (
        <div className="stream-card__header">
          <h3>{label}</h3>
          <span className={`status-badge status-badge--${color}`}>{status}</span>
        </div>
      )}
      <div className="stream-card__video">
        <VideoPlayer stream={stream} label={label} muted />
        {status === ConnectionStatus.DISCONNECTED && (
          <div className="disconnect-overlay">
            <span>Client disconnected</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StreamCard
