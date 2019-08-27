//const webpack = require("webpack");
//const pkg = require("./package.json");
const CopyPlugin = require('copy-webpack-plugin');
const yaml       = require('js-yaml');
const fs         = require('fs');
const path       = require('path');

var stratosConfig = {};
var packages = {
  list: [],
  map: {}
}

var resolve = {};
var nodeModulesFolder;

// Packages that need theming
// These are in the form: path#themeMixinName
var themedPackages = [];

// Package that provides the theme
var theme = '@stratos/theme'

// Assets
var assets = [];

// A JavaScript class.
class CleanUpPlugin {
  // Define `apply` as its prototype method which is supplied with compiler as its argument
  apply(compiler) {
    // Specify the event hook to attach to
    compiler.hooks.emit.tapAsync(
      'MyExampleWebpackPlugin',
      (compilation, callback) => {
        console.log('This is an example plugin!');
        //console.log('Here’s the `compilation` object which represents a single build of assets:', compilation);

        // We can clean up any temporary files we created
        callback();
      }
    );
  }
}

const GetPackageJSON = (dir) => {
  var parent = path.dirname(dir);
  var pkgFile = path.join(dir, 'package.json');
  if (fs.existsSync(pkgFile)) {
    return {
      file: pkgFile,
      dir: dir,
      contents: JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
    }
  }

  if (parent === dir) {
    return null;
  }

  return GetPackageJSON(parent);
};

const FindNodeModules = (dir) => {
  var parent = path.dirname(dir);
  var pkgFile = path.join(dir, 'node_modules');
  if (fs.existsSync(pkgFile)) {
    return pkgFile;
  }

  if (parent === dir) {
    return null;
  }

  return FindNodeModules(parent);
};

const CheckAndAddStratosPackage = (name) => {

  if (name.indexOf('@angular') === 0) {
    // We can ignore any angular packages
    return;
  }

  console.log('================================================================================')

  console.log('Checking: ' + name);

  // See if we should be using a different path for this package

  let packagePath = path.join(nodeModulesFolder, name);
  if (resolve[name]) {
    packagePath = resolve[name];

    // Make path absolute
    if (!path.isAbsolute(packagePath)) {
      packagePath = path.resolve(packagePath)
    }
    console.log('[Resolve] Package ' + name + ' from ' + packagePath);
  }

  //console.log('Package ' + name + ' from ' + packagePath);

  // Read the package file for this package
  var pkgFile = path.join(packagePath, 'package.json');
  if (fs.existsSync(pkgFile)) {
    console.log('Read package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
    console.log(pkg);
    if (pkg.stratos) {

      // Is this package themeable?
      if (pkg.stratos.theming) {

        const refParts = pkg.stratos.theming.split('#');
        if (refParts.length === 2) {
          const themingConfig = {
            ref: pkg.stratos.theming,
            package: name,
            scss: refParts[0],
            mixin: refParts[1]
          };

          let importPath = path.join(packagePath, themingConfig.scss);
          console.log(importPath);
          themingConfig.importPath = importPath;


          themedPackages.push(themingConfig);
          console.log('Found themed package: ' + name + '(' + pkg.stratos.theming + ')');
          console.log(themingConfig);

        } else {
          console.log('Invalid theming reference: ' + pkg.stratos.theming);
        }
      }

      // Check for assets
      if (pkg.stratos.assets) {
        console.log('GOT ASSET COMFIG');
        Object.keys(pkg.stratos.assets).forEach(src => {
          console.log("GOT ASSET SRC: " + src);
          const abs = path.join(packagePath, src);
          console.log(abs);
          assets.push({
            from: abs,
            to: pkg.stratos.assets[src],
            force: true
          });

          console.log(assets);
        });
      }
    }
  } else {
    console.log('Warning: Could not find package file for package: ' + name);
  }

  console.log('================================================================================')
}

// Collect a list of all package folders that the Stratos build needs to know about
const GetStratosPackages = (options) => {
  // Options is the angular.json options for the application
  // __dirname should be where the angular.json file is located

  // Read stratos.yaml if we can
  try {
    const stratosYamlFile = path.join(__dirname, 'stratos.yml')
    var doc = yaml.safeLoad(fs.readFileSync(stratosYamlFile, 'utf8'));
    console.log(doc);
    stratosConfig = doc;
    console.log('Read sratos.yml okay from: ' + stratosYamlFile);
  } catch (e) {
    console.log(e);
  }

  // Pull out correct resolve profile
  if (stratosConfig.resolve && stratosConfig.resolveConfig) {
    resolve = stratosConfig.resolveConfig[stratosConfig.resolve];
    if (!resolve) {
      resolve = {};
      console.log('Can not find resolve configuration: ' + stratosConfig.resolve);
    } else {
      console.log('Got resolve configuration');
      console.log(resolve);
    }
  }

  // Set theme to use, or use default
  theme = stratosConfig.theme || '@stratos/theme';

  console.log(stratosConfig);
  console.log(theme);
  console.log('==========================');

  // Find the package.json
  var main = options.main;
  var packageInfo = GetPackageJSON(path.dirname(main));


  if (!packageInfo) {
    console.log('Can not find package.json');
    return
  }

  // Check we have a package.json

  nodeModulesFolder = FindNodeModules(packageInfo.dir)
  console.log('Node Modules folder: ' + nodeModulesFolder);

  if (!nodeModulesFolder) {
    console.log('Can not find node_modules');
  }

  // Collate all of the extensions and the peer dependencies
  // Go through these and record any that have a stratos file (i.e. are a Stratos package)

  // We will pull in assets, styles etc from these packages if they export any

  const packageFile = packageInfo.contents;
  const deps = [];
  Object.keys(packageFile.peerDependencies).forEach(dep => {
    deps.push(dep);
  });

  // Add theme
  deps.push(theme);

  deps.push(packageFile.name);
  console.log('Here are the dependencies we will use to look for Stratos packages:')
  console.log(deps);

  deps.forEach(dep => {
      // TODO: Look for overrides to the default location in node_modules
      CheckAndAddStratosPackage(dep);
  });

}

Debug = (config, options) => {
  console.log('===== WEBPACK CONFIG ======');
  console.log(config);

  console.log('===== Config.Entry');
  console.log(JSON.stringify(config.entry, null, 2));
  console.log('===== Module Rules');
  console.log(JSON.stringify(config.module.rules, null, 2));
  console.log('=====');
  //console.log(JSON.stringify(config.plugins, null, 2));
  console.log('=====');
  console.log('=====');

  console.log('===== OPTIONS ======');
  console.log(options);
}

const GetThemingForPackages = () => {
  var contents = '';
  themedPackages.forEach(themingConfig => {
    contents += `@import '${themingConfig.importPath}';\n`;
    contents += `@include ${themingConfig.mixin}($stratos-theme);\n`;
  });

  console.log(contents);

  return contents;
}

const ResolvePackage = (pkg, name) => {
  let packagePath = path.join(nodeModulesFolder, pkg);
  if (resolve[pkg]) {
    packagePath = resolve[pkg];
    // Make path absolute
    if (!path.isAbsolute(packagePath)) {
      packagePath = path.resolve(packagePath)
    }
  }

  if (name) {
    packagePath = path.join(packagePath, name);
  }

  return packagePath;
}

var AddAssetsCopyPlugin = (config) => {
  const assetsCopyConfig = assets;
  if (assetsCopyConfig.length > 0) {
    // Add a plugin to copy assets - this will ensure we copy the assets
    // from each extension
    console.log('Installing Asset Copy Plugin');
    console.log(assetsCopyConfig);

    const plugins = [
      new CopyPlugin(assetsCopyConfig)
    ];
    config.plugins = config.plugins.concat(plugins);
  }
}

module.exports = (config, options) => {

  console.log('===== WEBPACK CONFIG ======');
  //console.log(JSON.stringify(config, null, 2));

  //Debug(config, options);

  console.log('+++++++ HEY:');

  console.log(options.tsConfig);

  config.plugins.forEach(plugin => {

    if (plugin._lazyRoutes) {
      console.log('Found Angular Compiler Plugin');
      console.log(plugin);

      if (!plugin._compilerOptions.paths) {
        plugin._compilerOptions.paths = {};
      }
      plugin._compilerOptions.paths["@stratos/shared"] = ["/Users/nwm/dev/v3_libs/src/frontend/packages/shared/src/public-api.ts"];
      plugin._compilerOptions.paths["@stratos/core/default-extension.module"] = ["/Users/nwm/test___.ts"];
    }
  });

  // We are going to overide the tsconfig file 

  GetStratosPackages(options);

  // Add a copy plugin if needed to copy assets over from referenced packages
  AddAssetsCopyPlugin(config);

  // Add in the stylesheets for theming
  var CustomSassImport = function(url, prev, done) {
    //console.log('Custom import: ' + url);
    var result = url;
    if (url === '~@stratos/theme/extensions') {
      // Generate SCSS to appy theming to the packages that need to be themed
      return {
        contents: GetThemingForPackages()
      }
    } else if (url === '~@stratos/theme') {
      console.log('================================================');
      console.log(theme);
      console.log('Got theme reference - using theme: ' + ResolvePackage(theme, '_index.scss'));
      console.log('================================================');
      return {
        file: ResolvePackage(theme, '_index.scss')
      }
    } else if (url.indexOf('~') === 0) {
      console.log('=== GOT SQUIGGLE');
      console.log(url);
      // See if we have an override
      const pkg = url.substr(1);
      const pkgParts = pkg.split('/');
      let pkgName = '';
      if (pkgParts[0].indexOf('@') === 0) {
        // Package name has a scope
        pkgName = pkgParts.shift() + '/' + pkgParts.shift();
      } else {
        pkgName = pkgParts.shift();
      }
      const pkgPath = pkgParts.join('/');
      console.log('================================================');
      console.log(pkgName);
      console.log(pkgPath);

      // See if we can resolve the package name
      if (resolve[pkgName]) {
        console.log('GOT OVERRIDE: ' + resolve[pkgName]);
        // Should be a directory
        result = resolve[pkgName] + '/_' + pkgPath + '.scss';
        result = path.resolve(result);
        return {
          file: result
        };
      }

      console.log('Leaing as is: ' + url);
    }

    // Return URL - this tells SASS Loader to use its own resolution mechanism
    return url;
  }

  // Find the node-saas plugin and add a custom import resolver
  config.module.rules.forEach(rule => {
    if (rule.include) {
      rule.use.forEach(p => {
        if (p.loader === 'sass-loader') {
          console.log('GOT SASS LOADER');
          console.log(p);
          p.options.importer = CustomSassImport;
        }
      });
    }
  });

  config.plugins.push(new CleanUpPlugin());

  return config;
};