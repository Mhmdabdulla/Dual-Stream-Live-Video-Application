export class MediaService {
  private webcamStream: MediaStream | null = null
  private screenStream: MediaStream | null = null

  async requestWebcam(): Promise<MediaStream> {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      console.log('[Media] Webcam acquired')
      return this.webcamStream
    } catch {
      throw new Error(
        'Camera permission denied. Please allow camera access and try again.'
      )
    }
  }

  async requestScreen(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      } as DisplayMediaStreamOptions)
      console.log('[Media] Screen acquired')
      return this.screenStream
    } catch(screenError) {

      // Catch the mobile/permission error and attempt a fallback
    console.warn('[Media] Screen share failed or unsupported, trying mobile camera fallback...', screenError);

    try {
      // Use the environment (rear) camera to simulate a "screen share" stream
      this.screenStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' } 
        },
        audio: false,
      });

      console.log('[Media] Mobile camera fallback acquired');
      return this.screenStream;

    } catch (fallbackError) {
      // Both methods failed (User completely denied permission)
      console.error('[Media] Both screen share and camera fallback failed', fallbackError);
      throw new Error(
        'Media access denied. Please allow camera/screen access and try again.'
      );
    }
    }
  }

  setupScreenEndedHandler(callback: () => void): void {
    this.screenStream?.getVideoTracks().forEach((track) => {
      track.onended = () => {
        console.log('[Media] Screen track ended by user')
        callback()
      }
    })
  }

  stopAll(): void {
    this.webcamStream?.getTracks().forEach((t) => t.stop())
    this.screenStream?.getTracks().forEach((t) => t.stop())
    this.webcamStream = null
    this.screenStream = null
    console.log('[Media] All tracks stopped')
  }

  getWebcamStream(): MediaStream | null { return this.webcamStream }
  getScreenStream(): MediaStream | null { return this.screenStream }
}
