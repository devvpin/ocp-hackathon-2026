import { useEffect, useRef, useCallback } from 'react';

export default function useSocket(url, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(false);

  const savedCallback = useRef(onMessage);

  useEffect(() => {
    savedCallback.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
      const derivedWs = apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws');
      const wsUrl = url || import.meta.env.VITE_WS_URL || derivedWs;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          savedCallback.current?.(data);
        } catch {
          savedCallback.current?.(event.data);
        }
      };

      wsRef.current.onclose = () => {
        if (!mountedRef.current) return;
        console.log('[WS] Disconnected, reconnecting in 3s...');
        reconnectRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };
    } catch {
      // WebSocket not available, retry
      if (mountedRef.current) {
        reconnectRef.current = setTimeout(connect, 5000);
      }
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, connect };
}
