import { useEffect, useRef, useCallback } from 'react';
import { getToken } from '../utils/tokenStorage';

export default function useSocket(url, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const token = getToken();
      if (!token) return; // Don't connect if not authenticated
      const baseUrl = url || import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
      const wsUrl = `${baseUrl}?token=${token}`;
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
    connect();

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
