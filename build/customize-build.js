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

  const CUSTOM_YAML_MANIFEST = path.resolve(__dirname, '../src/frontend/misc/custom/custom.yaml');

  // Apply any customizations
  // Symlink customizations of the default resources for Stratos
  gulp.task('customize', function (cb) {
    doCustomize(false);
    cb();
  });

  // Apply defaults instead of any customizations that are available in custom-src
  gulp.task('customize-default', function (cb) {
    doCustomize(true);
    cb();
  });

  // Remove all customizations (removes all symlinks as if customize had not been run)
  gulp.task('customize-reset', function (cb) {
    doCustomize(true, true);
    cb();
  });

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

    const backendBaseFolder = path.resolve(__dirname, '../src/backend');
    const backendCustomBaseFolder = path.resolve(__dirname, '../custom-src/backend');

    // There are no defaults for the backend - its the same as removing all of the custom plugins that be there
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

  function doCustomizeBackend(reset, baseFolder, customBaseFolder) {
    // Symlink custom backend plugin folders if they are present
    // Get all of the sub-folders in the custom-src/backend folder and symlink

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

})();
