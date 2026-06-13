import { useEffect, useRef, useCallback } from 'react';

export default function useSocket(url, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = url || import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 3s...');
        reconnectRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };
    } catch {
      // WebSocket not available, retry
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, [url, onMessage]);

  useEffect(() => {
    // Don't connect in mock mode since there's no WS server
    // connect();

    return () => {
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
