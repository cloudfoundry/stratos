// Zip the dist folder
// Implemented as a single script here so that it works on Windows, Linux and Mac

const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

// __dirname is the folder where build.js is located
const STRATOS_DIR= path.resolve(__dirname, '..');
const DIST_DIR= path.join(STRATOS_DIR, 'dist');
const ZIP_FILE= path.join(STRATOS_DIR, 'stratos-frontend-prebuild.zip');

var zip = new AdmZip();

zip.addLocalFolder(DIST_DIR);
zip.writeZip(path.join(ZIP_FILE));