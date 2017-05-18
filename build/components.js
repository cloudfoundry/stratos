/* eslint-disable no-sync,angular/json-functions,angular/typecheck-array */
(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var _ = require('lodash');
  var minimatch = require('minimatch');
  var globLib = require('glob');
  var fsx = require('fs-extra');
  var utils = require('./gulp.utils');
  var config = require('./gulp.config');
  // var buildConfig = require('./build_config.json');

  var mainBowerFile, buildConfig, components;
  var baseFolder = path.resolve(__dirname, '..');
  var bowerFolder = path.join(baseFolder, 'bower_components');
  var wildBowerFolder = path.join(bowerFolder, '**');

  // Initialization when first brought in via require
  initialize();

  function initialize() {
    mainBowerFile = JSON.parse(fs.readFileSync(path.join(baseFolder, 'bower.json'), 'utf8'));
    buildConfig = JSON.parse(fs.readFileSync(path.join(baseFolder, 'build_config.json'), 'utf8'));
    components = findComponents();
  }

  function findComponents() {
    var components = {};
    var files = fs.readdirSync(bowerFolder);
    _.each(files, function (f) {
      var folder = path.join(bowerFolder, f);
      if (fs.lstatSync(folder).isDirectory()) {
        // Check for a bower file
        var bowerFile = path.join(folder, 'bower.json');
        if (fs.existsSync(bowerFile)) {
          var bower = JSON.parse(fs.readFileSync(bowerFile, 'utf8'));
          var componentFile = path.join(folder, bower.name + '.component.json');
          if (fs.existsSync(componentFile)) {
            var component = JSON.parse(fs.readFileSync(componentFile, 'utf8'));
            components[bower.name] = component;
            component.bower = bower;
            component.folder = folder;
            component.name = bower.name;
          }
        }
      }
    });
    return components;
  }

  // Find local components referenced in the main bower.json
  // Assumes the location if a path starting with '.'
  function findLocalComponents() {
    var components = {};
    _.each(mainBowerFile.dependencies, function (location, name) {
      if (location.indexOf('.') === 0) {
        var componentFolder = path.resolve(location);
        if (fs.lstatSync(componentFolder).isDirectory()) {
          components[name] = {
            name: name,
            folder: location,
            path: componentFolder
          };
        }
      }
    });
    return components;
  }

  function findLocalComponentFolders() {
    var local = {};
    var files = globLib.sync('./components/**/bower.json');
    _.each(files, function (f) {
      var bower = JSON.parse(fs.readFileSync(f, 'utf8'));
      var folder = path.dirname(f);
      local[bower.name] = folder;
    });
    return local;
  }

  function syncLocalComponents() {
    var c = findLocalComponents(baseFolder);
    _.each(c, function (localComponent, name) {
      fsx.emptyDirSync(path.join(bowerFolder, name));
      utils.copySingleBowerFolder(localComponent.path, bowerFolder);
    });

    // Prune components that should no longer be in bower_components
    _.each(components, function (component) {
      if (!c[component.name]) {
        fsx.removeSync(component.folder);
      }
    });
  }

  function getGlobs(pattern) {
    var c = findComponentsDependencySorted();
    var local = findLocalComponents();

    var globs = {
      dist: [],
      bower: [],
      bowerFull: [],
      local: []
    };

    if (!Array.isArray(pattern)) {
      pattern = [pattern];
    }

    _.each(pattern, function (g) {
      var inverse = g.indexOf('!') === 0;
      g = !inverse ? g : g.substring(1);
      _.each(c, function (v) {
        var dPath = path.relative(baseFolder, path.join(config.paths.dist, v.rootDir ? v.rootDir : v.name, g));
        var bPath = path.relative(baseFolder, path.join(bowerFolder, v.name, g));
        var bfPath = path.relative(baseFolder, path.join(wildBowerFolder, v.name, g));
        globs.dist.push(inverse ? '!' + dPath : dPath);
        globs.bower.push(inverse ? '!' + bPath : bPath);
        globs.bowerFull.push(inverse ? '!' + bfPath : bfPath);
        if (local[v.name]) {
          var lPath = path.join(local[v.name].folder, g);
          globs.local.push(inverse ? '!' + lPath : lPath);
        }
      });
    });
    return globs;
  }

  function addWiredep(config) {
    var wiredep = config.overrides;
    _.each(components, function (component) {
      _.each(component.dependencies, function (o, name) {
        var componentBower = JSON.parse(fs.readFileSync(path.join(config.directory, name, 'bower.json'), 'utf8'));
        var deps = componentBower.dependencies || {};
        _.defaults(deps, o);
        wiredep[name] = { dependencies: deps };
      });
    });
    return config;
  }

  function getDependencies(cpmnts) {
    var depends = {};
    _.each(cpmnts, function (component) {
      _.each(component.dependencies, function (o, name) {
        var componentBower = JSON.parse(fs.readFileSync(path.join('./bower_components', name, 'bower.json'), 'utf8'));
        var deps = componentBower.dependencies || {};
        _.defaults(deps, o);
        depends[name] = deps;
      });
    });
    return depends;
  }

  function findComponentsDependencySorted() {
    var depends = getDependencies(components);
    var names = _.map(components, 'name');
    var list = resolve(depends, components, names);
    return _.map(list, function (name) {
      return components[name];
    });
  }

  function resolve(depends, cpmnts, names) {
    var list = [];
    _.each(names, function (name) {
      if (cpmnts[name]) {
        var deps = _.keys(depends[name]);
        list = _.concat(resolve(depends, cpmnts, deps), list);
        list.push(name);
        list = _.uniqBy(list);
      }
    });

    return list;
  }

  function findMainFile(pattern) {
    var dependencies = findComponentsDependencySorted();
    var files = [];
    _.each(dependencies, function (defn) {
      _.each(defn.bower.main, function (file) {
        if (minimatch(file, pattern)) {
          files.push(path.join(defn.folder, file));
        }
      });
    });

    return files;
  }

  function transformPath(p) {
    var parts = p.split(path.sep);
    var name = parts[0];
    parts.splice(1,1);
    if (components[name] && components[name].rootDir) {
      parts[0] = components[name].rootDir;
    }
    return parts.join(path.sep);
  }

  function transformDirname(p) {
    p.dirname = transformPath(p.dirname);
    return p;
  }

  function getBuildConfig() {
    return buildConfig;
  }

  function getBowerConfig() {
    return mainBowerFile;
  }

  function getBowerFolder() {
    return bowerFolder;
  }

  function removeEmptyGlobs(globs) {
    var filtered = [];
    _.each(globs, function (pattern) {
      var files = globLib.sync(pattern);
      if (files.length > 0) {
        filtered.push(pattern);
      }
    });
    return filtered;
  }

  module.exports.initialize = initialize;
  module.exports.getBuildConfig = getBuildConfig;
  module.exports.getBowerConfig = getBowerConfig;
  module.exports.getBowerFolder = getBowerFolder;
  module.exports.syncLocalComponents = syncLocalComponents;
  module.exports.getGlobs = getGlobs;
  module.exports.addWiredep = addWiredep;
  module.exports.findMainFile = findMainFile;
  module.exports.transformDirname = transformDirname;
  module.exports.transformPath = transformPath;
  module.exports.removeEmptyGlobs = removeEmptyGlobs;
  module.exports.findLocalComponentFolders = findLocalComponentFolders;

})();
