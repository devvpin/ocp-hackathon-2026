/**
 * index.js — WebSocket server setup.
 * Event format: JSON string { "event": "<name>", "payload": {...} }
 */

const { WebSocket, WebSocketServer } = require('ws');

let wss;
let heartbeatInterval;

/**
 * Attaches a WebSocket server to an existing HTTP server.
 * @param {import('http').Server} httpServer
 */
function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

    const params = new URLSearchParams(req.url.split('?')[1] || '');
    const token = params.get('token');
    
    if (!token) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    try {
      const { verifyToken } = require('../config/jwt');
      verifyToken(token);
    } catch (err) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    // Send a welcome ping
    ws.send(JSON.stringify({ event: 'connected', payload: { status: 'ok' } }));
  });

  heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WS] WebSocket server ready at ws://host/ws');
  return wss;
}

/**
 * Broadcasts a structured event to all connected WS clients.
 * @param {string} event    Event name, e.g. 'kds:order_received'
 * @param {object} payload  Event payload
 */
function broadcast(event, payload) {
  if (!wss) return;

  const message = JSON.stringify({ event, payload });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { initWebSocket, broadcast };
