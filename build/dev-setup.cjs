// Copy files required for developer quick start
// Implemented as a single script here so that it works on Windows, Linux and Mac

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// __dirname is the folder where build.js is located
const STRATOS_DIR= path.resolve(__dirname, '..');
const LOCALDEV_PATH = path.join(__dirname, 'proxy.conf.localdev.js')
const OLD_TEMPLATE_DIGEST = '8ee6fa35784909f985f1a00daacadc08'

// Only copy files if they are not already there - just make sure initial versions are in place for developer

// Proxy config file
const PROXY_CONF = path.join(STRATOS_DIR, 'proxy.conf.js');
if (!fs.existsSync(PROXY_CONF)) {
  let err = fs.copyFileSync(LOCALDEV_PATH, PROXY_CONF);
  if (err) {
    console.log(err);
  }
} else {
  let fileContents = fs.readFileSync(PROXY_CONF, 'utf8');
  let digest = crypto.createHash('md5').update(fileContents).digest("hex");

  if (digest == OLD_TEMPLATE_DIGEST) {
    // overwriting the file with a new template if it is identical to the old template
    let err = fs.copyFileSync(LOCALDEV_PATH, PROXY_CONF);
    if (err) {
      console.log(err);
    }
  } else if (!fileContents.includes('"/api"')) {
    console.warn('"/api" section is missing in proxy.conf.js, please add it manually (see proxy.conf.localdev.js)');
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
