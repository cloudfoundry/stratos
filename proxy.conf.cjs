// Proxy config for local backend
// Backend port is configurable via BACKEND_PORT env var (default: 5443)
const port = parseInt(process.env.BACKEND_PORT || '5443');

const PROXY_CONFIG = {
  "/pp": {
    "target": {
      "host": "127.0.0.1",
      "protocol": "https:",
      "port": port
    },
    "ws": true,
    "secure": false,
    "changeOrigin": true,
  },
  "/api": {
    "target": {
      "host": "127.0.0.1",
      "protocol": "https:",
      "port": port
    },
    "ws": true,
    "secure": false,
    "changeOrigin": true,
  }
}

module.exports = PROXY_CONFIG;
