import { useEffect, useRef } from 'react';
import { getAuthToken } from '../services/api';

interface RealtimeCallbacks {
  onLocationUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onConnected?: (data: any) => void;
}

export function useRealtime(callbacks: RealtimeCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    function connect() {
      const token = getAuthToken();
      const url = token ? `/api/realtime/stream?token=${encodeURIComponent(token)}` : '/api/realtime/stream';

      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[SSE] Live stream connected');
      };

      eventSource.addEventListener('location_update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacksRef.current.onLocationUpdate?.(data);
        } catch (err) {
          console.error('[SSE] Failed to parse location_update:', err);
        }
      });

      eventSource.addEventListener('notification', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacksRef.current.onNotification?.(data);
        } catch (err) {
          console.error('[SSE] Failed to parse notification:', err);
        }
      });

      eventSource.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'connected') {
            callbacksRef.current.onConnected?.(data);
          }
        } catch {
          // ignore heartbeats
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3 seconds
        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, []);
}
