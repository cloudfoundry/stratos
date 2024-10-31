import fs = require('fs');
import path = require('path');

import { StratosConfig } from './lib/stratos.config';

// Generate the go file to include the required backend plugins
const sConfig = new StratosConfig(__dirname, {}, false);
console.log('Checking frontend packages for required backend plugins')

// Generate the go file to import the required backend plugins
const backendFolder = path.join(sConfig.rootDir, 'src', 'jetstream');
const backendPluginsFile = path.join(backendFolder, 'extra_plugins.go');

fs.writeFileSync(backendPluginsFile, 'package main\n\n');
fs.appendFileSync(backendPluginsFile, '// This file is auto-generated - DO NOT EDIT\n\n');

const backendPlugins = sConfig.getBackendPlugins();
if (backendPlugins.length === 0) {
  console.log('No backend plugins');
} else {
  console.log('Backend plugins:');
  sConfig.getBackendPlugins().forEach(pkg => {

    // Check that the plugin exists
    if (fs.existsSync(path.join(backendFolder, 'plugins', pkg))) {
      fs.appendFileSync(backendPluginsFile, `import _ "github.com/cloudfoundry/stratos/src/jetstream/plugins/${pkg}"\n`);
      console.log(` + ${pkg}`)
    } else {
      console.log(` + ${pkg} : WARNING: Backend plugin does not exist`);
    }
  });
}

console.log(`Generated: ${backendPluginsFile}`);
