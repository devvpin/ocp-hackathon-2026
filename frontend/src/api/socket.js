const listeners = {};
let ws = null;

function connect() {
  if (ws) return;
  
  let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  baseUrl = baseUrl.replace(/\/api\/?$/, ''); // Remove trailing /api
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';
  
  ws = new WebSocket(wsUrl);

  ws.onmessage = (message) => {
    try {
      const data = JSON.parse(message.data);
      if (data.event && listeners[data.event]) {
        listeners[data.event].forEach(cb => cb(data.payload));
      }
    } catch (err) {
      console.error('WS Parse Error:', err);
    }
  };

  ws.onclose = () => {
    ws = null;
    setTimeout(connect, 5000); // Reconnect
  };
}

connect();

export default {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  },
  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
};
