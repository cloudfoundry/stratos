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
  // var config = require('./gulp.config');
  // var buildConfig = require('./build_config.json');

  var mainBowerFile, buildConfig, components;
  var baseFolder = path.resolve(__dirname, '..');
  var bowerFolder = path.join(baseFolder, 'bower_components');

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
    _.each(c, function (localComponent) {
      utils.copySingleBowerFolder(localComponent.path, bowerFolder);
    });

    // Prune components that should no longer be in bower_components
    _.each(components, function (component) {
      if (!c[component.name]) {
        fsx.removeSync(component.folder);
      }
    });

  }

  function getGlobs(glob, skipName, absolute) {
    var c = findComponentsDependencySorted();
    var n = [];
    if (!Array.isArray(glob)) {
      glob = [glob];
    }
    _.each(glob, function (g) {
      _.each(c, function (v) {
        var inverse = g.indexOf('!') === 0;
        g = !inverse ? g : g.substring(1);
        var f = skipName ? path.join(bowerFolder, v.name, g) : path.join(bowerFolder, '**', v.name, g);
        if (absolute) {
          f = path.resolve(__dirname, f);
        } else {
          f = './' + path.relative(baseFolder, f);
        }
        n.push(inverse ? '!' + f : f);
      });
    });

    return n;
  }

  function getSourceGlobs(glob, prefix) {
    var c = findComponentsDependencySorted();
    var n = [];
    if (!Array.isArray(glob)) {
      glob = [glob];
    }
    _.each(glob, function (g) {
      _.each(c, function (v) {
        var inverse = g.indexOf('!') === 0;
        g = !inverse ? g : g.substring(1);
        var f;
        if (!prefix) {
          f = path.join('./components', v.name, g);
        } else {
          var name = v.templatePrefix ? v.templatePrefix : v.name;
          f = path.join(prefix, name, g);
        }
        n.push(inverse ? '!' + f : f);
      });
    });
    return n;
  }

  function getLocalGlobs(glob) {
    var c = findComponentsDependencySorted();
    var local = findLocalComponents();
    var n = [];
    if (!Array.isArray(glob)) {
      glob = [glob];
    }
    _.each(c, function (v) {
      // Check that v is a local component
      if (local[v.name]) {
        _.each(glob, function (g) {
          var inverse = g.indexOf('!') === 0;
          g = !inverse ? g : g.substring(1);
          var f = path.join(local[v.name].folder, g);
          n.push(inverse ? '!' + f : f);
        });
      }
    });
    return n;
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
    if (components[name] && components[name].templatePrefix) {
      parts[0] = components[name].templatePrefix;
    }
    return parts.join(path.sep);
  }

  function renamePath(p) {
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
  module.exports.findComponents = findComponents;
  module.exports.syncLocalComponents = syncLocalComponents;
  module.exports.getGlobs = getGlobs;
  module.exports.getSourceGlobs = getSourceGlobs;
  module.exports.getLocalGlobs = getLocalGlobs;
  module.exports.addWiredep = addWiredep;
  module.exports.findMainFile = findMainFile;
  module.exports.renamePath = renamePath;
  module.exports.transformPath = transformPath;
  module.exports.findComponentsDependencySorted = findComponentsDependencySorted;
  module.exports.removeEmptyGlobs = removeEmptyGlobs;
  module.exports.findLocalComponentFolders = findLocalComponentFolders;

})();
