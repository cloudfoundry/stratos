/* eslint-disable angular/json-functions,angular/log,no-console,no-process-env,no-process-exit,no-sync */
(function () {
  'use strict';

  // Gulp tasks for dumping the dependencies
  var _ = require('lodash');
  var gulp = require('gulp');
  var path = require('path');
  var runSequence = require('run-sequence');
  var fsx = require('fs-extra');

  var components;
  var depsFolder = path.resolve('./.deps');

  gulp.task('dump-deps-backend-prep', function (cb) {
    process.env.STRATOS_TEMP = path.resolve(__dirname, '../tmp');
    fsx.mkdirpSync(process.env.STRATOS_TEMP);
    return cb();
  });

  gulp.task('dump-deps', function () {
    components = require('./components');
    components.initialize();
    fsx.ensureDirSync(depsFolder);
    fsx.emptyDirSync(depsFolder);
    return runSequence(
      'dump-deps-frontend',
      'dump-deps-backend-prep',
      'cf-get-backend-deps',
      'dump-deps-backend'
    );
  });

  gulp.task('dump-deps-frontend', function (cb) {
    console.log('Dumping front-end dependencies');
    var folders = fsx.readdirSync(components.getBowerFolder());
    var localFolders = _.keys(components.findLocalPathComponentFolders());

    // Exclude local components
    var deps = _.difference(folders, localFolders);
    _.each(deps, function (name) {
      var folder = path.join(components.getBowerFolder(), name);
      if (fsx.lstatSync(folder).isDirectory()) {
        console.log('Storing dependency: ' + name);
        var cmpBower = JSON.parse(fsx.readFileSync(path.join(folder, '.bower.json'), 'utf8'));
        var depName = 'js-' + cmpBower.name;
        fsx.copySync(folder, path.join(depsFolder, depName));

        var version = cmpBower.version;
        var commit = cmpBower._resolution ? cmpBower._resolution.commit || version : version;
        // Write the version and name to a file
        fsx.writeFileSync(path.join(depsFolder, depName, '.stratos-dependency'), cmpBower.name + '\n' + commit + '\n' + version);
      }
    });

    return cb();
  });

  function replaceAll(target, search, replacement) {
    return target.split(search).join(replacement);
  }

  function findStratosDepFiles(results, folder) {
    var strat = path.join(folder, '.stratos-dependency');
    if (fsx.existsSync(strat)) {
      var res = {
        depFile: strat,
        folder: folder
      };
      results.push(res);
    }

    var items = fsx.readdirSync(folder);
    _.each(items, function (f) {
      if (fsx.lstatSync(path.join(folder, f)).isDirectory()) {
        findStratosDepFiles(results, path.join(folder, f));
      }
    });
  }

  gulp.task('dump-deps-backend', function (cb) {
    var yaml = require('js-yaml');
    var imports = {};
    _.each(components.findLocalPathComponentFolders(), function (folder) {
      var glideLockFile = path.join(folder, 'backend', 'glide.lock');
      if (fsx.existsSync(glideLockFile)) {
        // Read the lock file
        var doc = yaml.safeLoad(fsx.readFileSync(glideLockFile, 'utf8'));
        _.each(doc.imports, function (obj) {
          imports[obj.name] = obj.version;
        });
      }

      // Look for local __vendor packages checked in
      var vendorFolder = path.join(folder, 'backend', '__vendor');
      if (fsx.existsSync(vendorFolder)) {
        var deps = [];
        findStratosDepFiles(deps, vendorFolder);
        _.each(deps, function (dep) {
          var lines = fsx.readFileSync(dep.depFile, 'utf-8').split('\n').filter(Boolean);
          imports[lines[0]] = lines[1];
        });
      }
    });

    _.each(imports, function (v, n) {
      console.log('Storing dependency: ' + n);
      var srcFolder = './tmp/src/' + n;
      var depName = 'golang-' + replaceAll(n, '/', '-');
      fsx.copySync(srcFolder, path.join(depsFolder, depName));
      // Write the version and name to a file
      fsx.writeFileSync(path.join(depsFolder, depName, '.stratos-dependency'), n + '\n' + v + '\n' + v.substr(0, 8));
    });
    return cb();
  });
})();
