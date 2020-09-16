// Copy files required for developer quick start
// Implemented as a single script here so that it works on Windows, Linux and Mac
import './dist-devkit/backend.js';


const path = require('path');
const fs = require('fs');

// __dirname is the folder where build.js is located
const STRATOS_DIR= path.resolve(__dirname, '..');

// Only copy files if they are not already there - just make sure initial versions are in place for developer

// Proxy config file
const PROXY_CONF = path.join(STRATOS_DIR, 'proxy.conf.js');
if (!fs.existsSync(PROXY_CONF)) {
  let err = fs.copyFileSync(path.join(__dirname, 'proxy.conf.localdev.js'), PROXY_CONF);
  if (err) {
    console.log(err);
  }
}

// config.properties
const BACKEND_DIR = path.join(STRATOS_DIR, 'src', 'jetstream');
const BACKEND_CONF = path.join(BACKEND_DIR, 'config.properties');
const BACKEND_CONF_DEV = path.join(BACKEND_DIR, 'config.dev');
if (!fs.existsSync(BACKEND_CONF)) {
  let err = fs.copyFileSync(BACKEND_CONF_DEV, BACKEND_CONF);
  if (err) {
    console.log(err);
  }
}
