import { useRef, useEffect } from 'react'
import type { VideoPlayerProps } from '../types'

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  label,
  muted = true,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className={`video-player ${className ?? ''}`}>
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        playsInline
        aria-label={label}
        controls={true}
      />
      {!stream && (
        <div className="video-placeholder">
          <span>Waiting for {label}...</span>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
