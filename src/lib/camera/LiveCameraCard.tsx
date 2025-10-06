/**
 * LiveCameraCard - Simple live stream card
 * TEST DASHBOARD ONLY
 *
 * Following CAMERA_STREAM_IMPLEMENTATION.md approach
 */

import { useEffect, useRef, useState } from 'react';
import { CameraStreamService } from './CameraStreamService';
import { Loader2, Maximize2 } from 'lucide-react';

interface LiveCameraCardProps {
  entityId: string;
  name: string;
  host: string;
  token: string;
  onCardClick?: () => void;
}

export function LiveCameraCard({
  entityId,
  name,
  host,
  token,
  onCardClick,
}: LiveCameraCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamServiceRef = useRef<CameraStreamService | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Following docs: 100ms setTimeout for video ref availability
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
    if (!videoRef.current) return;

    setIsLoading(true);

    try {
      const streamService = new CameraStreamService({
        entityId,
        host,
        token,
      });

      streamServiceRef.current = streamService;
      await streamService.startStream(videoRef.current);

      setStreamReady(true);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Card stream failed:', err);
      setIsLoading(false);
    }
  };

  const stopStream = () => {
    if (streamServiceRef.current) {
      streamServiceRef.current.stopStream();
      streamServiceRef.current = null;
    }
    setStreamReady(false);
    setIsLoading(false);
  };

  // Expose stream service for modal reuse
  const getStreamService = () => streamServiceRef.current;

  return (
    <div
      className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-accent transition-all"
      onClick={onCardClick}
      data-stream-service={getStreamService() ? 'active' : 'inactive'}
    >
      {/* Live Stream */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Camera Name */}
      <div className="absolute bottom-3 left-3 text-white">
        <h3 className="font-semibold text-sm">{name}</h3>
      </div>

      {/* Live Indicator - Only when stream is active */}
      {streamReady && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-500 rounded text-white text-xs font-medium">
          <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}

      {/* Loading Indicator - While stream is loading */}
      {isLoading && !streamReady && (
        <div className="absolute top-3 right-3">
          <Loader2 className="h-4 w-4 animate-spin text-white/80" />
        </div>
      )}

      {/* Expand Icon - On hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 bg-black/40 rounded-lg backdrop-blur-sm">
          <Maximize2 className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
}
