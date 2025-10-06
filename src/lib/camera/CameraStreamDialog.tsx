/**
 * CameraStreamDialog - Live Camera Feed Modal
 * TEST DASHBOARD EXPERIMENT ONLY
 */

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CameraStreamService } from './CameraStreamService';
import { Video, VideoOff, Loader2, AlertCircle } from 'lucide-react';

interface CameraStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  snapshotEntity: string;
  entityName: string;
  host: string;
  token: string;
}

export function CameraStreamDialog({
  open,
  onOpenChange,
  entityId,
  snapshotEntity,
  entityName,
  host,
  token,
}: CameraStreamDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamServiceRef = useRef<CameraStreamService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Snapshot URL for fallback
  const snapshotUrl = `http://${host}/api/camera_proxy/${snapshotEntity}?token=${token}`;

  useEffect(() => {
    console.log('📺 CameraStreamDialog useEffect', { open, hasVideoRef: !!videoRef.current, entityId });

    if (open) {
      // Wait for video ref to be available (React rendering)
      const timer = setTimeout(() => {
        if (videoRef.current) {
          console.log('✅ Video ref now available, starting stream');
          startStream();
        } else {
          console.error('❌ Video ref still not available after timeout');
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        stopStream();
      };
    }

    return () => {
      stopStream();
    };
  }, [open, entityId]);

  const startStream = async () => {
    console.log('🎬 startStream called', {
      hasVideoRef: !!videoRef.current,
      entityId,
      host,
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20) + '...'
    });

    if (!videoRef.current) {
      console.warn('⚠️ No video ref, cannot start stream');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Creating CameraStreamService...');
      const streamService = new CameraStreamService({
        entityId,
        host,
        token,
      });

      streamServiceRef.current = streamService;
      console.log('🚀 Starting stream...');
      await streamService.startStream(videoRef.current);
      setIsStreaming(true);
      setIsLoading(false);
      console.log('✅ Camera stream started successfully');
    } catch (err) {
      console.error('❌ Failed to start camera stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera stream');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (streamServiceRef.current) {
      streamServiceRef.current.stopStream();
      streamServiceRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
    setError(null);
  };

  const handleClose = () => {
    stopStream();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {entityName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Video Player */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
            {/* Snapshot - Shows while stream loads */}
            {!isStreaming && !error && (
              <img
                src={snapshotUrl}
                alt={entityName}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}

            {/* Live Stream - Fades in when ready */}
            <video
              ref={videoRef}
              className={`w-full h-full object-contain transition-opacity duration-500 ${
                isStreaming ? 'opacity-100' : 'opacity-0'
              }`}
              controls
              autoPlay
              muted
              playsInline
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg">Connecting to camera...</p>
                  <p className="text-sm text-gray-300 mt-2">Loading HLS stream</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white max-w-md">
                  <VideoOff className="h-16 w-16 mx-auto mb-4 text-red-500" />
                  <p className="text-lg font-semibold mb-2">Stream Error</p>
                  <p className="text-sm text-gray-300">{error}</p>
                  <Button
                    onClick={startStream}
                    className="mt-4"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Stream Info Overlay */}
            {isStreaming && !isLoading && !error && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
              </div>
            )}
          </div>

          {/* Info & Controls */}
          <div className="space-y-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Experiment Mode:</strong> Testing HLS live camera streaming via WebSocket.
                Entity: <code className="bg-muted px-1 rounded">{entityId}</code>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Using HLS.js for browser compatibility</span>
              <div className="flex gap-2">
                <Button
                  onClick={stopStream}
                  variant="outline"
                  size="sm"
                  disabled={!isStreaming}
                >
                  <VideoOff className="h-4 w-4 mr-2" />
                  Stop Stream
                </Button>
                <Button
                  onClick={handleClose}
                  variant="default"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
