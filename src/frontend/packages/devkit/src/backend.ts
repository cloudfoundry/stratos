import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find the project root (directory containing angular.json)
function findRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, 'angular.json'))) {
    return dir;
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    throw new Error('Could not find project root (angular.json)');
  }
  return findRoot(parent);
}

const rootDir = findRoot(__dirname);

// Read plugin list from the backend-owned config file
const backendFolder = path.join(rootDir, 'src', 'jetstream');
const configFile = path.join(backendFolder, 'plugin-config.yaml');
const backendPluginsFile = path.join(backendFolder, 'extra_plugins.go');

console.log('Reading backend plugin list from plugin-config.yaml');

const configData = yaml.load(fs.readFileSync(configFile, 'utf8')) as { plugins: string[] };
const backendPlugins: string[] = configData.plugins || [];

fs.writeFileSync(backendPluginsFile, 'package main\n\n');
fs.appendFileSync(backendPluginsFile, '// This file is auto-generated - DO NOT EDIT\n\n');

if (backendPlugins.length === 0) {
  console.log('No backend plugins');
} else {
  console.log('Backend plugins:');
  backendPlugins.forEach(pkg => {
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
