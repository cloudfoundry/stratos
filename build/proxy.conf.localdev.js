// Defualt proxy conf when running a local backend
// npm install will copy this one to the root of the repository
// if there is not ont there already, as a convenience to quick start

const PROXY_CONFIG = {
  "/pp": {
    "target": {
      "host": "127.0.0.1",
      "protocol": "https:",
      "port": 5443
    },
    "ws": true,
    "secure": false,
    "changeOrigin": true,
  },
  "/api": {
    "target": {
      "host": "127.0.0.1",
      "protocol": "https:",
      "port": 5443
    },
    "ws": true,
    "secure": false,
    "changeOrigin": true,
  }
};

module.exports = PROXY_CONFIG;
