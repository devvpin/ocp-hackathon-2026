'use strict';

// Load env first — before any other module that reads process.env
require('./config/env');

const http = require('http');
const createApp = require('./app');
const { initWebSocket } = require('./websocket/index');
const env = require('./config/env');

async function start() {
  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach WebSocket server to the same HTTP server
  initWebSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log(`║  🚀  Odoo Cafe POS Backend                   ║`);
    console.log(`║      HTTP  → http://localhost:${env.PORT}           ║`);
    console.log(`║      WS    → ws://localhost:${env.PORT}/ws          ║`);
    console.log(`║      Env   → ${env.NODE_ENV.padEnd(32)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
