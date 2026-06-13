/**
 * index.js — WebSocket server setup.
 * Event format: JSON string { "event": "<name>", "payload": {...} }
 */

const { WebSocketServer } = require('ws');

let wss;

/**
 * Attaches a WebSocket server to an existing HTTP server.
 * @param {import('http').Server} httpServer
 */
function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    // Send a welcome ping
    ws.send(JSON.stringify({ event: 'connected', payload: { status: 'ok' } }));
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
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { initWebSocket, broadcast };
