// Generate the git metadata file

// Implemented as a single script here so that it works on Windows, Linux and Mac

const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

// __dirname is the folder where build.js is located
const STRATOS_DIR = path.resolve(__dirname, '..');
const GIT_FOLDER = path.join(STRATOS_DIR, '.git');
const GIT_METADATA = path.join(STRATOS_DIR, '.stratos-git-metadata.json');

function execGit(cmd) {
  try {
    var response = execSync(cmd);
    return response.toString().trim();
  } catch (e) {
    console.log(e)
    return '';
  }
}

// We can only do this if we have a git repository checkout
// We'll store this in a file which we will then use - when in environments like Docker, we will run this
// in the host environment so that we can pick it up when we're running in the Docker world
// Do we have a git folder?
if (!fs.existsSync(GIT_FOLDER)) {
  console.log('  + Unable to store git repository metadata - .git folder not found');
  return;
}
var gitMetadata = {
  project: execGit('git config --get remote.origin.url'),
  branch: execGit('git rev-parse --abbrev-ref HEAD'),
  commit: execGit('git rev-parse HEAD')
};

fs.writeFileSync(GIT_METADATA, JSON.stringify(gitMetadata, null, 2));
