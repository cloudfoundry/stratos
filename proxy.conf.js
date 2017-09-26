const PROXY_CONFIG = {
  "/pp": {
    "target": {
      "host": "localhost",
      "protocol": "https:",
      "port": 443
    },
    "secure": false,
    "changeOrigin": true
  }
}
//stratos-ui.ngrok.io

module.exports = PROXY_CONFIG;
