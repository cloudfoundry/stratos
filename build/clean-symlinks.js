// Clean any symlinks from a pre 4.0 Stratos
// These are no longer used for customization and need to be removed

// Implemented as a single script here so that it works on Windows, Linux and Mac

const path = require('path');
const fs = require('fs-extra');

// __dirname is the folder where build.js is located
const STRATOS_DIR= path.resolve(__dirname, '..');
const DEVKIT_DIST_DIR= path.join(STRATOS_DIR, 'dist-devkit');

function processFile(filepath) {
  if (fs.existsSync(filepath)) {
    const stats = fs.lstatSync(filepath);
    if (stats.isSymbolicLink()) {
      console.log(`Removing symlink ${filepath}`);
      fs.unlinkSync(filepath);
    }
  }
}

function processFolder(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    const realPath = fs.realpathSync(dirPath);
    const stats = fs.lstatSync(realPath);
    if (stats.isDirectory()) {
      processFolder(dirPath);
    } else {
      processFile(dirPath);
    }
  });
};

processFolder(path.join(STRATOS_DIR, 'src', 'frontend', 'packages', 'core', 'sass'));
processFolder(path.join(STRATOS_DIR, 'src', 'frontend', 'packages', 'core', 'assets'));
processFile(path.join(STRATOS_DIR, 'src', 'frontend', 'packages', 'core', 'favicon.ico'));
