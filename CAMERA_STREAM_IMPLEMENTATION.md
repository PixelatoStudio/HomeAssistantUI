# Home Assistant Camera Live Stream Implementation Guide

## Overview
This document explains how to implement HLS (HTTP Live Streaming) camera feeds from Home Assistant using WebSocket authentication. This approach matches how Home Assistant's Lovelace UI handles camera streams internally.

---

## Architecture

### Tech Stack
- **HLS.js** - Browser HLS player library
- **WebSocket API** - Real-time communication with Home Assistant
- **Camera Stream Token** - Temporary, session-specific authentication

### Flow Diagram
```
User Opens Camera → WebSocket Connect → Auth with User Token →
Request camera/stream → HA Generates Camera Token →
Returns HLS URL with Token → HLS.js Plays Stream
```

---

## Implementation Steps

### Step 1: Establish WebSocket Connection

```typescript
const ws = new WebSocket(`ws://${host}/api/websocket`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  // Handle auth_required
  if (msg.type === 'auth_required') {
    ws.send(JSON.stringify({
      type: 'auth',
      access_token: userToken
    }));
  }

  // Handle auth_ok
  if (msg.type === 'auth_ok') {
    // Proceed to request camera stream
  }
};
```

**Key Points:**
- Use `ws://` protocol (not `wss://` unless HA is HTTPS)
- Host format: `hostname:port` (e.g., `192.168.1.100:8123`)
- Extract host from full URL by removing `http://` or `https://`

### Step 2: Request Camera Stream

```typescript
ws.send(JSON.stringify({
  id: 1,
  type: 'camera/stream',
  entity_id: 'camera.front_door'
}));
```

**Important:**
- Always call `camera/stream` BEFORE attempting playback
- HA won't generate the playlist until first request
- Each request gets a unique stream session

### Step 3: Handle Stream Response

```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'result' && msg.success && msg.result?.url) {
    const hlsUrl = `http://${host}${msg.result.url}`;
    // Example: http://192.168.1.100:8123/api/hls/abc123/master_playlist.m3u8?token=xyz

    // Proceed to attach HLS player
  }
};
```

**Camera Token Details:**
- HA generates a **temporary, camera-specific token**
- Token is embedded in the HLS URL: `?token=CAMERA_TOKEN`
- This is NOT the user auth token
- Token is session-specific and auto-expires
- Token validates each HLS segment request

### Step 4: Attach HLS.js Player

```typescript
if (Hls.isSupported()) {
  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90
  });

  hls.loadSource(hlsUrl);
  hls.attachMedia(videoElement);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    videoElement.play();
  });

  // Error recovery
  hls.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls.startLoad();
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          hls.destroy();
          break;
      }
    }
  });
} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
  // Safari native HLS support
  videoElement.src = hlsUrl;
  videoElement.play();
}
```

### Step 5: Cleanup on Close

```typescript
// Stop stream (optional but recommended)
ws.send(JSON.stringify({
  id: 2,
  type: 'camera/stream/stop',
  stream_id: streamId
}));

// Destroy HLS player
hls?.destroy();

// Close WebSocket
ws?.close();
```

---

## Common Gotchas & Solutions

### ❌ Gotcha 1: Using Long-Lived Tokens in HLS URLs
**Problem:** Hardcoding user tokens in HLS URLs won't work.

**Solution:** ✅ Always request fresh stream via WebSocket. HA generates temporary camera tokens automatically.

---

### ❌ Gotcha 2: Caching HLS Playlist URLs
**Problem:** Cached URLs will 404 when they expire.

**Solution:** ✅ Request new stream URL each time. Never cache. Fresh request = fresh token.

---

### ❌ Gotcha 3: Not Calling camera/stream First
**Problem:** HA won't generate playlist until first WebSocket request.

**Solution:** ✅ Always call `camera/stream` via WebSocket BEFORE attempting playback.

---

### ❌ Gotcha 4: CORS Configuration
**Problem:** If UI is hosted separately from HA, requests will be blocked.

**Solution:** ✅ Add CORS config to HA `configuration.yaml`:
```yaml
http:
  cors_allowed_origins:
    - http://localhost:3001
    - http://192.168.1.50:3001
    - https://yourdomain.com
```

---

### ❌ Gotcha 5: Video Element Not Ready
**Problem:** Gray screen because video ref doesn't exist when useEffect runs.

**Solution:** ✅ Use setTimeout to wait for React rendering:
```typescript
useEffect(() => {
  if (open) {
    setTimeout(() => {
      if (videoRef.current) {
        startStream();
      }
    }, 100);
  }
}, [open]);
```

---

### ❌ Gotcha 6: Host Format Issues
**Problem:** `host: undefined` or incorrect WebSocket URL.

**Solution:** ✅ Extract host from full URL:
```typescript
// credentials.url = "http://192.168.1.100:8123"
const host = credentials.url.replace(/^https?:\/\//, '');
// host = "192.168.1.100:8123" ✅
```

---

## Token Flow Explained

### 1. User Authentication Token (Long-Lived)
- Used to authenticate WebSocket connection
- Stored in auth store after login
- Validates user has access to HA

### 2. Camera Stream Token (Temporary)
- Generated by HA when `camera/stream` is called
- Embedded in HLS URL: `/api/hls/{id}/master.m3u8?token={CAMERA_TOKEN}`
- Session-specific, auto-expires
- Validates each HLS segment request
- Different from user token

### Token Lifecycle
```
User Login → User Token Stored →
WebSocket Auth (User Token) →
Request camera/stream →
HA Generates Camera Token →
HLS URL includes Camera Token →
HLS Segments Validated with Camera Token
```

---

## Best Practices

### 1. Always Request Fresh Streams
```typescript
// ❌ BAD - Caching URL
const cachedUrl = localStorage.getItem('camera_url');

// ✅ GOOD - Fresh request every time
const startStream = async () => {
  const ws = new WebSocket(...);
  // Request fresh stream
};
```

### 2. Proper Cleanup
```typescript
// ✅ Clean up on dialog close
useEffect(() => {
  if (open) {
    startStream();
  }

  return () => {
    stopStream(); // Stop stream, destroy HLS, close WS
  };
}, [open]);
```

### 3. Error Recovery
```typescript
// ✅ Implement retry logic
hls.on(Hls.Events.ERROR, (event, data) => {
  if (data.fatal) {
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      hls.startLoad(); // Auto-retry
    }
  }
});
```

### 4. Low-Latency Configuration
```typescript
// ✅ Optimize for live streaming
const hls = new Hls({
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600
});
```

---

## Testing Checklist

- [ ] WebSocket connects successfully
- [ ] User authentication works
- [ ] Camera stream request succeeds
- [ ] HLS URL is received with token
- [ ] Video element receives stream
- [ ] Playback starts automatically
- [ ] Loading state shows while connecting
- [ ] Error state shows on failure
- [ ] Stream stops when dialog closes
- [ ] No memory leaks (HLS destroyed, WS closed)
- [ ] CORS is configured if needed
- [ ] Works on Safari (native HLS)
- [ ] Works on Chrome/Firefox (HLS.js)

---

## Debugging

### Check Console Logs
Look for these messages in order:
1. `🎥 Camera WebSocket connected`
2. `✅ Camera WS authenticated`
3. `📤 Requesting camera stream: { entity_id: ... }`
4. `🎬 HLS URL received: http://...`
5. `✅ HLS manifest parsed, starting playback`

### Common Console Errors

**"WebSocket connection failed"**
- Check host format (should be `hostname:port`, not full URL)
- Verify HA is running and accessible

**"Authentication failed"**
- Check user token is valid
- Verify token hasn't expired

**"Camera stream error"**
- Verify camera entity exists in HA
- Check camera supports HLS streaming
- Ensure camera is online

**"CORS error"**
- Add UI origin to HA CORS config
- Restart HA after config change

**"HLS.js error: manifestLoadError"**
- Stream token expired (request new stream)
- Camera URL changed or stream stopped

---

## File Structure

```
src/
├── lib/
│   └── camera/
│       ├── CameraStreamService.ts      # WebSocket + HLS logic
│       ├── CameraStreamDialog.tsx      # Modal UI component
│       └── LiveCameraCard.tsx          # Dashboard card component
└── pages/
    └── TestDashboard.tsx               # Integration example
```

### CameraStreamService.ts
- WebSocket connection management
- Authentication flow
- Stream request/response handling
- HLS.js player setup
- Cleanup logic

### CameraStreamDialog.tsx
- Modal UI for video display
- Loading/error states
- Video element ref management
- Start/stop controls

### LiveCameraCard.tsx
- Dashboard card showing live camera stream
- Same CameraStreamService approach
- Card-specific UI (compact, hover effects)
- Click handler to open modal

---

## Implementation Example (Complete)

### 1. Service (CameraStreamService.ts)
```typescript
export class CameraStreamService {
  async startStream(videoElement: HTMLVideoElement): Promise<void> {
    const ws = new WebSocket(`ws://${this.host}/api/websocket`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: this.token }));
      }

      if (msg.type === 'auth_ok') {
        ws.send(JSON.stringify({
          id: 1,
          type: 'camera/stream',
          entity_id: this.entityId
        }));
      }

      if (msg.type === 'result' && msg.success) {
        const hlsUrl = `http://${this.host}${msg.result.url}`;
        const hls = new Hls({ lowLatencyMode: true });
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoElement);
      }
    };
  }
}
```

### 2. Modal Dialog (CameraStreamDialog.tsx)
```typescript
export function CameraStreamDialog({ entityId, host, token, open }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (videoRef.current) {
          const service = new CameraStreamService({ entityId, host, token });
          service.startStream(videoRef.current);
        }
      }, 100);
    }
  }, [open]);

  return (
    <video ref={videoRef} autoPlay muted playsInline controls />
  );
}
```

### 3. Dashboard Card (LiveCameraCard.tsx)
```typescript
export function LiveCameraCard({ entityId, name, host, token, onCardClick }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 100ms setTimeout for video ref availability
    const timer = setTimeout(() => {
      if (videoRef.current) {
        startStream();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      stopStream();
    };
  }, [entityId]);

  const startStream = async () => {
    const service = new CameraStreamService({ entityId, host, token });
    await service.startStream(videoRef.current);
    setStreamReady(true);
    setIsLoading(false);
  };

  return (
    <div onClick={onCardClick} className="relative h-48 rounded-2xl overflow-hidden cursor-pointer">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

      {/* Loading spinner */}
      {isLoading && <Loader2 className="animate-spin" />}

      {/* LIVE indicator */}
      {streamReady && <div className="bg-red-500">LIVE</div>}

      {/* Camera name */}
      <h3>{name}</h3>
    </div>
  );
}
```

---

## Security Considerations

1. **Never expose user tokens** in client-side logs (use `token.substring(0,20)+'...'` for debugging)
2. **Camera tokens are temporary** - they expire with the stream session
3. **CORS must be configured** if UI is on different origin than HA
4. **Always use HTTPS in production** for secure token transmission
5. **Clean up streams properly** to prevent resource leaks

---

## Performance Tips

1. **Use low-latency mode** for live cameras: `lowLatencyMode: true`
2. **Limit buffer length** to reduce delay: `maxBufferLength: 30`
3. **Enable workers** for better performance: `enableWorker: true`
4. **Destroy HLS properly** to free memory: `hls.destroy()`
5. **Close WebSocket** when done: `ws.close()`

---

## References

- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [Home Assistant WebSocket API](https://developers.home-assistant.io/docs/api/websocket)
- [Home Assistant Camera Stream](https://www.home-assistant.io/integrations/camera/#play-stream-service)

---

## Rollback Instructions

If experimentation code needs to be removed:

```bash
# Restore from stash
git stash apply 1e1f4c46e269671a63778432724e9494e0889421

# Or remove experiment files manually
rm -rf src/lib/camera/
# Then revert TestDashboard.tsx changes
```

---

**Last Updated:** Dashboard card implementation complete
**Status:** ✅ Working - Modal dialog and dashboard card both functional
**Components:**
- CameraStreamService.ts (WebSocket + HLS logic)
- CameraStreamDialog.tsx (Modal UI)
- LiveCameraCard.tsx (Dashboard card UI)
