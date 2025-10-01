import { useRef, useCallback, TouchEvent, MouseEvent } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
}

export const useLongPress = ({ onLongPress, delay = 500 }: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    start();
  }, [start]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    clear();
  }, [clear]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    start();
  }, [start]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    clear();
  }, [clear]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    clear();
  }, [clear]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  };
};
