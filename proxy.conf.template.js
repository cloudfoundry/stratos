const PROXY_CONFIG = {
  "/pp": {
    "target": {
      "host": "stratos-ui.ngrok.io",
      "protocol": "https:",
      "port": 443
    },
    "ws": true,
    "secure": false,
    "changeOrigin": true,
    "ws": true
  }
}

module.exports = PROXY_CONFIG;
