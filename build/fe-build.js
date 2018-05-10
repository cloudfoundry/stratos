/**
 * Gulp build file for Angular 2 Front End UI Code
 */
/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions,no-sync */
(function () {
  'use strict';

  var gulp = require('gulp');
  // var _ = require('lodash');
  var del = require('delete');
  var spawn = require('child_process').spawn;
  var path = require('path');
  var os = require('os');

  var config = require('./gulp.config');
  var paths = config.paths;
  var fs = require('fs-extra');
  var yaml = require('js-yaml');

  const CUSTOM_YAML_MANIFEST = path.resolve(__dirname, '../src/frontend/misc/custom/custom.yaml');

  // Clean dist dir
  gulp.task('clean', function (next) {
    del(paths.dist + '**/*', {
      force: true
    }, next);
  });

  // Legacy task name
  gulp.task('clean:dist', gulp.series('clean'));

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
      } catch(e) {}
        
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
  

  gulp.task('ng-build', function (cb) {
    var rootFolder = path.resolve(__dirname, '..');
    var cmd = 'npm';
    var windowsEnvironment = os.platform().startsWith('win');
    if (windowsEnvironment) {
      cmd = 'npm.cmd';
    }
    var child = spawn(cmd, ['run', 'build'], {
      cwd: rootFolder
    });
    child.stdout.on('data', function (data) {
      console.log(data.toString());
    });
    child.stderr.on('data', function (data) {
      console.log(data.toString());
    });
    child.on('error', function (err) {
      console.log(err);
      cb(err);
    });
    child.on('close', function (code) {
      var err = code === 0 ? undefined : 'Build exited with code: ' + code;
      cb(err);
    });
  });

  // Production build
  gulp.task('build', gulp.series(
    'clean',
    'ng-build'
  ));

  // Default task is to build for production
  gulp.task('default', gulp.series('build'));

})();
