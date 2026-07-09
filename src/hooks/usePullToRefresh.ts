import { useCallback, useEffect, useRef, useState } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

interface PullToRefreshResult {
  pullDistance: number;
  isRefreshing: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function usePullToRefresh({ onRefresh, disabled }: PullToRefreshOptions): PullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stateRef = useRef({ startY: 0, pulling: false, refreshing: false, dist: 0 });

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || stateRef.current.refreshing) return;
    if (window.scrollY > 10) return;
    stateRef.current.startY = e.touches[0].clientY;
    stateRef.current.pulling = true;
    stateRef.current.dist = 0;
    setPullDistance(0);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const s = stateRef.current;
    if (!s.pulling || disabled || s.refreshing) return;
    const dy = e.touches[0].clientY - s.startY;
    if (dy <= 0) {
      s.dist = 0;
      setPullDistance(0);
      return;
    }
    const damped = Math.min(dy * 0.35, 140);
    s.dist = damped;
    setPullDistance(damped);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    const s = stateRef.current;
    if (!s.pulling || disabled) return;
    s.pulling = false;

    if (s.dist >= THRESHOLD && !s.refreshing) {
      s.refreshing = true;
      setIsRefreshing(true);
      Promise.resolve(onRefresh()).finally(() => {
        s.refreshing = false;
        s.dist = 0;
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      s.dist = 0;
      setPullDistance(0);
    }
  }, [disabled, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}