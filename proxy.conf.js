const PROXY_CONFIG = {
    "/pp": {
      "target": {
          "host": "localhost",
          "protocol": "https:",
          "port": 4443
        },
      "secure": false,
      "changeOrigin": true
    }
}

module.exports = PROXY_CONFIG;