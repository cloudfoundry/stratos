// Copy extra files needed as part of the devkit build
// Implemented as a single script here so that it works on Windows, Linux and Mac

const path = require('path');
const fs = require('fs-extra');

console.log('Copying devkit files');

// __dirname is the folder where build.js is located
const STRATOS_DIR= path.resolve(__dirname, '..', '..', '..', '..');
const DEVKIT_DIST_DIR= path.join(STRATOS_DIR, 'dist-devkit');

// Copy package.json but change type to commonjs since we output CommonJS
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
packageJson.type = 'commonjs';
fs.writeFileSync(path.join(DEVKIT_DIST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));

let err = fs.copySync(path.join(__dirname, 'src'), path.join(DEVKIT_DIST_DIR), {
  overwrite: true,
  dereference: true,
  preserveTimestamps: true,
  filter: function(file) {
   return !file.endsWith('.ts');
  }
});
if (err) {
  console.log(err);
}
