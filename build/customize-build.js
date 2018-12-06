/**
 * Gulp build file for applying cutomizations
 */

/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions,no-sync */
(function () {
  'use strict';

  var gulp = require('gulp');
  var path = require('path');
  var fs = require('fs-extra');
  var yaml = require('js-yaml');
  var replace = require('replace-in-file');
  var execSync = require('child_process').execSync;

  const CUSTOM_YAML_MANIFEST = path.resolve(__dirname, '../src/frontend/misc/custom/custom.yaml');
  const INDEX_TEMPLATE = path.resolve(__dirname, '../src/frontend/misc/custom/index.html');
  const INDEX_HTML = path.resolve(__dirname, '../src/frontend/index.html');
  const CUSTOM_METADATA = path.resolve(__dirname, '../custom-src/stratos.yaml');
  const GIT_FOLDER = path.resolve(__dirname, '../.git');
  const GIT_METADATA = path.resolve(__dirname, '../.stratos-git-metadata.json');

  // Apply any customizations
  // Symlink customizations of the default resources for Stratos
  gulp.task('customize', function (cb) {
    doShowVersions()
    doCustomize(false);
    doGenerateIndexHtml(true);
    cb();
  });

  // Apply defaults instead of any customizations that are available in custom-src
  gulp.task('customize-default', function (cb) {
    doCustomize(true);
    doGenerateIndexHtml(false);
    cb();
  });

  // Remove all customizations (removes all symlinks as if customize had not been run)
  gulp.task('customize-reset', function (cb) {
    doCustomize(true, true);
    doGenerateIndexHtml(false);
    cb();
  });

  // Store git metadata so we have it when we are running the the non-git world (Docker)
  gulp.task('store-git-metadata', function (cb) {
    storeGitRepositoryMetadata();
    cb();
  });

  function doShowVersions() {
    console.log('Node Version: ' + process.versions.node || 'N/A');
    try {
      var response = execSync('npm --v');
      var npmVersion = response.toString().trim();
      console.log('NPM Version : ' + npmVersion || 'N/A');
    } catch (e) {
      console.log('NPM Version : N/A');
    }
  }

  function doCustomize(forceDefaults, reset) {
    var msg = !forceDefaults ? 'Checking for and applying customizations' : 'Removing customizations and applying defaults';
    var msg = !reset ? msg : 'Removing all customizations';
    console.log(msg);
    var customConfig;

    try {
      customConfig = yaml.safeLoad(fs.readFileSync(CUSTOM_YAML_MANIFEST, 'utf8'));
    } catch (e) {
      console.log('Could not read custom.yaml file');
      console.log(e);
      process.exit(1);
    }

    const baseFolder = path.resolve(__dirname, '../src/frontend');
    const customBaseFolder = path.resolve(__dirname, '../custom-src/frontend');
    doCustomizeFiles(forceDefaults, reset, customConfig, baseFolder, customBaseFolder);
    doCustomizeFolders(forceDefaults, reset, customConfig, baseFolder, customBaseFolder);
    doCustomizeCreateModule(forceDefaults, reset, customConfig, baseFolder, customBaseFolder);

    const backendBaseFolder = path.resolve(__dirname, '../src/jetstream/plugins');
    const backendCustomBaseFolder = path.resolve(__dirname, '../custom-src/jetstream');

    // There are no defaults for the backend - its the same as removing all of the custom plugins that are there
    doCustomizeBackend(forceDefaults || reset, backendBaseFolder, backendCustomBaseFolder);
  };

  function doCustomizeFiles(forceDefaults, reset, customConfig, baseFolder, customBaseFolder) {
    const defaultSrcFolder = path.resolve(__dirname, '../src/frontend/misc/custom');
    // Symlink custom files
    Object.keys(customConfig.files).forEach(file => {
      const dest = customConfig.files[file];

      var srcFile = path.join(defaultSrcFolder, file);
      const destFile = path.join(baseFolder, dest);
      const customSrcFile = path.join(customBaseFolder, dest);

      // Use the custom file if there is one
      if (!forceDefaults && fs.existsSync(customSrcFile)) {
        srcFile = customSrcFile;
      }

      // Doing an exists check on a symlink will tell if the link dest exists, not the link itself
      // So try and delete anyway and catch any exception
      try {
        const existingLink = fs.readlinkSync(destFile);
        fs.unlinkSync(destFile);
      } catch (e) {}

      if (!reset) {
        fs.symlinkSync(srcFile, destFile);
      }
    })

  }

  function doCustomizeFolders(forceDefaults, reset, customConfig, baseFolder, customBaseFolder) {
    // Symlink custom app folders if they are present
    customConfig.folders.forEach(folder => {
      var destFolder = path.join(baseFolder, folder);
      var srcFolder = path.join(customBaseFolder, folder);
      if (fs.existsSync(destFolder)) {
        fs.unlinkSync(destFolder);
      }
      if (!reset && fs.existsSync(srcFolder)) {
        fs.symlinkSync(srcFolder, destFolder);
      }
    });
  }

  // Copy the correct custom module to either import the supplied custom module or provide an empty module
  function doCustomizeCreateModule(forceDefaults, reset, customConfig, baseFolder, customBaseFolder) {
    const defaultSrcFolder = path.resolve(__dirname, '../src/frontend/misc/custom');
    const destFile = path.join(baseFolder, 'app/custom-import.module.ts');
    const customModuleFile = path.join(baseFolder, 'app/custom/custom.module.ts');
    const customRoutingModuleFile = path.join(baseFolder, 'app/custom/custom-routing.module.ts');

    // Delete the existing file if it exists
    if (fs.existsSync(destFile)) {
      fs.unlinkSync(destFile)
    }

    if (!reset) {
      let srcFile = 'custom.module.ts_';
      if (fs.existsSync(customModuleFile)) {
        srcFile = 'custom-src.module.ts_';
        if (fs.existsSync(customRoutingModuleFile)) {
          srcFile = 'custom-src-routing.module.ts_';
        }
      }
      fs.copySync(path.join(defaultSrcFolder, srcFile), destFile);
    }
  }

  function doCustomizeBackend(reset, baseFolder, customBaseFolder) {
    // Symlink custom backend plugin folders if they are present
    // Get all of the sub-folders in the custom-src/backend folder and symlink

    // Update the git metadata if we can
    storeGitRepositoryMetadata();

    // Remove all existing symlinks first
    var existing = fs.readdirSync(baseFolder);
    existing.forEach(file => {
      var pluginPath = path.join(baseFolder, file);
      var stats = fs.lstatSync(pluginPath);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(pluginPath);
      }
    })

    if (reset) {
      // If we are reseting then we are done, just return now
      return;
    }

    // Check if we have a customization folder
    if (!fs.existsSync(customBaseFolder)) {
      return;
    }

    // Symlink any custom plugins
    var plugins = fs.readdirSync(customBaseFolder);
    plugins.forEach(file => {
      var srcFolder = path.join(customBaseFolder, file);
      var stats = fs.statSync(srcFolder);
      var destFolder = path.join(baseFolder, file);
      if (stats.isDirectory()) {
        if (fs.existsSync(destFolder)) {
          fs.unlinkSync(destFolder);
        }
        fs.symlinkSync(srcFolder, destFolder);
      }
    })
  }

  // Generate index.html from template
  function doGenerateIndexHtml(customize) {
    // Copy the default
    fs.copySync(INDEX_TEMPLATE, INDEX_HTML);

    // Read custom metadata if we are customizing and the file is present 
    var metadata = {};
    if (customize && fs.existsSync(CUSTOM_METADATA)) {
      try {
        metadata = yaml.safeLoad(fs.readFileSync(CUSTOM_METADATA, 'utf8'));
      } catch (e) {
        console.log('Could not read stratos.yaml file');
        console.log(e);
        process.exit(1);
      }
    }

    // Patch different page title if there is one
    var title = metadata.title || 'Stratos';
    replace.sync({ files: INDEX_HTML, from: /@@TITLE@@/g, to: title });

    // Read in the stored Git metadata if it is there, default to empty metadata
    var gitMetadata = {
      project: process.env.project || '',
      branch: process.env.branch || '',
      commit: process.env.commit || ''
    };

    if (fs.existsSync(GIT_METADATA)) {
      gitMetadata = JSON.parse(fs.readFileSync(GIT_METADATA));
    }

    // Git Information
    replace.sync({ files: INDEX_HTML, from: '@@stratos_git_project@@', to: gitMetadata.project });
    replace.sync({ files: INDEX_HTML, from: '@@stratos_git_branch@@', to: gitMetadata.branch });
    replace.sync({ files: INDEX_HTML, from: '@@stratos_git_commit@@', to: gitMetadata.commit });

    // Date and Time that the build was made (approximately => it is when this script is run)
    replace.sync({ files: INDEX_HTML, from: '@@stratos_build_date@@', to: new Date() });
  }

  // We can only do this if we have a git repository checkout
  // We'll store this in a file which we will then use - when in environments like Docker, we will run this
  // in the host environment so that we can pick it up when we're running in the Docker world
  function storeGitRepositoryMetadata() {
    // Do we have a git folder?
    if (!fs.existsSync(GIT_FOLDER)) {
      return;
    }
    var gitMetadata = {
      project: execGit('git config --get remote.origin.url'),
      branch: execGit('git rev-parse --abbrev-ref HEAD'),
      commit: execGit('git rev-parse HEAD')
    };

    fs.writeFileSync(GIT_METADATA, JSON.stringify(gitMetadata, null, 2));
  }

  function execGit(cmd) {
    try {
      var response = execSync(cmd + ' 2> /dev/null');
      return response.toString().trim();
    } catch (e) {
      return '';
    }
  }

})();
