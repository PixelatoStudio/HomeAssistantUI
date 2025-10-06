/**
 * CameraStreamService - HLS Live Camera Streaming via WebSocket
 * TEST DASHBOARD EXPERIMENT ONLY
 */

import Hls from 'hls.js';

export interface CameraStreamConfig {
  entityId: string;
  host: string;
  token: string;
}

export class CameraStreamService {
  private ws: WebSocket | null = null;
  private hls: Hls | null = null;
  private messageId = 1;
  private streamId: string | null = null;

  constructor(private config: CameraStreamConfig) {}

  async startStream(videoElement: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.config.host}/api/websocket`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🎥 Camera WebSocket connected');
      };

      this.ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        console.log('📨 Camera WS message:', msg);

        // Step 1: Auth required
        if (msg.type === 'auth_required') {
          this.ws?.send(JSON.stringify({
            type: 'auth',
            access_token: this.config.token,
          }));
        }

        // Step 2: Auth OK - request stream
        if (msg.type === 'auth_ok') {
          console.log('✅ Camera WS authenticated');
          this.requestStream();
        }

        // Step 3: Stream result with HLS URL
        if (msg.type === 'result' && msg.success && msg.result?.url) {
          const hlsUrl = `http://${this.config.host}${msg.result.url}`;
          console.log('🎬 HLS URL received:', hlsUrl);

          // Store stream ID for cleanup
          if (msg.id === this.messageId - 1) {
            this.streamId = msg.result.url.split('/')[2]; // Extract stream ID
          }

          this.attachHlsPlayer(videoElement, hlsUrl);
          resolve();
        }

        // Error handling
        if (msg.type === 'result' && !msg.success) {
          console.error('❌ Camera stream error:', msg.error);
          reject(new Error(msg.error?.message || 'Failed to start camera stream'));
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Camera WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('🔌 Camera WebSocket closed');
      };
    });
  }

  private requestStream() {
    if (!this.ws) return;

    const message = {
      id: this.messageId++,
      type: 'camera/stream',
      entity_id: this.config.entityId,
    };

    console.log('📤 Requesting camera stream:', message);
    this.ws.send(JSON.stringify(message));
  }

  private attachHlsPlayer(videoElement: HTMLVideoElement, hlsUrl: string) {
    if (Hls.isSupported()) {
      console.log('🎥 Using HLS.js for playback');
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      this.hls.loadSource(hlsUrl);
      this.hls.attachMedia(videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed, starting playback');
        videoElement.play().catch(err => {
          console.warn('⚠️ Autoplay blocked, user interaction required:', err);
        });
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS.js error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Fatal network error, trying to recover...');
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Fatal media error, trying to recover...');
              this.hls?.recoverMediaError();
              break;
            default:
              console.error('💥 Unrecoverable HLS error, destroying player');
              this.stopStream();
              break;
          }
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('🍎 Using native HLS support');
      videoElement.src = hlsUrl;
      videoElement.play().catch(err => {
        console.warn('⚠️ Autoplay blocked:', err);
      });
    } else {
      console.error('❌ HLS is not supported in this browser');
    }
  }

  stopStream() {
    console.log('🛑 Stopping camera stream');

    // Stop HLS player
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Send stop stream command (optional but recommended)
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.streamId) {
      this.ws.send(JSON.stringify({
        id: this.messageId++,
        type: 'camera/stream/stop',
        stream_id: this.streamId,
      }));
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.streamId = null;
  }
}
