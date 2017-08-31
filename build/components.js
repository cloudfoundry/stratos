/* eslint-disable no-sync,angular/json-functions,angular/typecheck-array */
(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var _ = require('lodash');
  var minimatch = require('minimatch');
  var globLib = require('glob');
  var fsx = require('fs-extra');
  var utils = require('./utils');
  var config = require('./gulp.config');

  var mainBowerFile, buildConfig, components, localComponents;
  var baseFolder = path.resolve(__dirname, '..');
  var bowerFolder = path.join(baseFolder, 'bower_components');
  var wildBowerFolder = path.join(bowerFolder, '**');

  // Initialization when first brought in via require
  initialize();

  function initialize() {
    mainBowerFile = JSON.parse(fs.readFileSync(path.join(baseFolder, 'bower.json'), 'utf8'));
    buildConfig = mainBowerFile.config || {};
    components = findComponents();
    localComponents = findLocalPathComponents();
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
            component.frontend = component.frontend || {};
            component.bower = bower;
            component.folder = folder;
            component.base = bower.name;
            if (component.frontend && component.frontend.base) {
              component.base = path.join(bower.name, component.frontend.base);
            }
            component.name = bower.name;
            component.src = component.src || 'src';
          }
        }
      }
    });
    return components;
  }

  function getComponents() {
    return components;
  }

  // Find local path components referenced in the main bower.json
  // Assumes the location if a path starting with '.'
  // Only used to ensure that these are synced into the bower_components folder when
  // files are changed - bower update won't do this.
  function findLocalPathComponents() {
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

  function findLocalPathComponentFolders() {
    var local = {};
    var files = globLib.sync('./components/**/bower.json');
    _.each(files, function (f) {
      var bower = JSON.parse(fs.readFileSync(f, 'utf8'));
      local[bower.name] = path.dirname(f);
    });
    return local;
  }

  function syncLocalPathComponents() {
    _.each(localComponents, function (localComponent, name) {
      fsx.emptyDirSync(path.join(bowerFolder, name));
      utils.copySingleBowerFolder(localComponent.path, bowerFolder);
    });

    // Prune components that should no longer be in bower_components
    _.each(components, function (component) {
      if (!localComponents[component.name]) {
        fsx.removeSync(component.folder);
      }
    });
  }

  function getGlobs(pattern) {
    var c = findComponentsDependencySorted();
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
        var dPath = path.relative(baseFolder, path.join(config.paths.dist, v.frontend.root ? v.frontend.root : v.name, g));
        var bPath = path.relative(baseFolder, path.join(bowerFolder, v.base, g));
        var bfPath = path.relative(baseFolder, path.join(wildBowerFolder, v.base, g));
        globs.dist.push(inverse ? '!' + dPath : dPath);
        globs.bower.push(inverse ? '!' + bPath : bPath);
        globs.bowerFull.push(inverse ? '!' + bfPath : bfPath);
        if (localComponents[v.name]) {
          var lPath;
          if (v.frontend.base) {
            lPath = path.join(localComponents[v.name].folder, v.frontend.base, g);
          } else {
            lPath = path.join(localComponents[v.name].folder, g);
          }
          globs.local.push(inverse ? '!' + lPath : lPath);
        }
      });
    });
    // Exclude backend/vendor folder from bower_component plugins
    globs.bowerFull.push('!' + path.relative(baseFolder,path.join(wildBowerFolder, '**/backend/vendor/**')));
    return globs;
  }

  function getWiredep() {
    var wiredep = _.clone(config.bower);
    _.assign(wiredep.overrides, getDependencies());
    return wiredep;
  }

  function getDependencies() {
    var depends = {};
    _.each(components, function (component) {
      _.each(component.frontend.dependencies, function (o, name) {
        var componentBower = JSON.parse(fs.readFileSync(path.join(config.bower.directory, name, 'bower.json'), 'utf8'));
        var deps = componentBower.dependencies || {};
        _.defaults(deps, o);
        depends[name] = { dependencies: deps };
      });
      // Allow the main files for a component to be overridden
      _.each(component.frontend.overrides, function (o, name) {
        if (o.main) {
          if (!depends[name]) {
            depends[name] = {};
          }
          depends[name].main = o.main;
        }
      });
    });
    return depends;
  }

  function findComponentsDependencySorted() {
    var depends = getDependencies();
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
        var deps = _.keys(depends[name] ? depends[name].dependencies : []);
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
    var skip = components[name].base.split(path.sep).length;
    parts.splice(1, skip);
    if (components[name] && components[name].frontend.root) {
      parts[0] = components[name].frontend.root;
    }
    return parts.join(path.sep);
  }

  function transformDirname(p) {
    p.dirname = transformPath(p.dirname);
    return p;
  }

  function reverseTransformPath(p) {
    _.each(localComponents, function (cmpnt) {
      var c = components[cmpnt.name];
      if (c) {
        var root = c.frontend.root ? c.frontend.root : c.name;
        if (_.startsWith(p, root + path.sep)) {
          p = path.join(cmpnt.name, c.src, p.substr(root.length + 1));
        }
      }
    });
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
  module.exports.syncLocalPathComponents = syncLocalPathComponents;
  module.exports.getGlobs = getGlobs;
  module.exports.getWiredep = getWiredep;
  module.exports.findMainFile = findMainFile;
  module.exports.transformPath = transformPath;
  module.exports.transformDirname = transformDirname;
  module.exports.reverseTransformPath = reverseTransformPath;
  module.exports.removeEmptyGlobs = removeEmptyGlobs;
  module.exports.findLocalPathComponentFolders = findLocalPathComponentFolders;
  module.exports.getComponents = getComponents;

})();
