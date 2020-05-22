import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { GitMetadata } from './git.metadata';
import { Packages } from './packages';

// Default theme to use
// Assests are always copied from this theme
// Then, if a different theme is being used, its assets
// are overlayed on top
const DEFAULT_THEME = '@stratosui/theme';

export interface ThemingConfig {
  ref: string;
  package: string;
  scss: string;
  mixin: string;
  importPath: string;
}

export interface ExtensionMetadata {
  package: string;
  module: string;
  routingModule?: string;
}

/**
 * Represents the startos.yaml file or the defaults if not found
 * Also includes related cofnig such as node_modules dirpath and angular.json file path
 */
export class StratosConfig {

  // Theme to use - defualts to this value:
  public theme = DEFAULT_THEME;

  // Packages that need theming
  // These are in the form: path#themeMixinName
  public themedPackages: ThemingConfig[] = [];

  // File paths to a few files we need access to
  public packageJsonFile: string;
  public nodeModulesFile: string;
  public angularJsonFile: string;

  // angular.json contents
  public angularJson: any;

  // package.json contents
  public packageJson: any;

  // theme package.json contents;
  public themePackageJson: any;
  public themePackageFolder: string;

  // newProjectRoot from the angular.json file
  // Used as the directory to check for local packages
  public newProjectRoot: string;

  // Stratos config file
  public stratosConfig: any;

  // Local resolution overrides (map of package to folder)
  public resolve: { [name: string]: string } = {};

  // Assets collected from packages
  public assets = [];

  // Git Metadata
  public gitMetadata: GitMetadata;

  // Extensions
  public extensions: ExtensionMetadata[] = [];

  // Extra files for webpack to watch
  public watches: string[] = [];

  private loggingEnabled = true;

  constructor(dir: string, options?: any, loggingEnabled = true) {
    this.angularJsonFile = this.findFileOrFolderInChain(dir, 'angular.json');
    this.angularJson = JSON.parse(fs.readFileSync(this.angularJsonFile, 'utf8').toString());
    this.loggingEnabled = loggingEnabled;

    // The Stratos config file is optional - allows overriding default behaviour
    this.stratosConfig = {};
    if (this.angularJsonFile) {
      // Read stratos.yaml if we can
      const stratosYamlFile = path.join(path.dirname(this.angularJsonFile), 'stratos.yml');
      if (fs.existsSync(stratosYamlFile)) {
        try {
          this.stratosConfig = yaml.safeLoad(fs.readFileSync(stratosYamlFile, 'utf8'));
          this.log(this.stratosConfig);
          this.log('Read stratos.yml okay from: ' + stratosYamlFile);
          this.watches.push(stratosYamlFile);
        } catch (e) {
          this.log(e);
        }
      } else {
        this.log('No stratos.yml file found');
      }
    }

    // Set theme to use, or use default
    this.theme = this.stratosConfig.theme || DEFAULT_THEME;

    const mainDir = options ? path.dirname(options.main) : dir;

    this.packageJsonFile = this.findFileOrFolderInChain(mainDir, 'package.json');
    if (this.packageJsonFile !== null) {
      this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonFile, 'utf8').toString());
    }

    this.nodeModulesFile = this.findFileOrFolderInChain(mainDir, 'node_modules');

    this.scanLocalPackages();

    this.gitMetadata = new GitMetadata(path.dirname(this.angularJsonFile));
    this.log(this.gitMetadata);

    this.newProjectRoot = this.angularJson.newProjectRoot;

    // TODO: This needs tidying up

    // TODO: Do we need this exclusion?
    // if (!this.packageJson.peerDependencies) {
    //   return;
    // }

    const deps = [];
    if (this.packageJson.peerDependencies) {
      Object.keys(this.packageJson.peerDependencies).forEach(dep => {
        this.addUnique(deps, dep)
      });
    }

    // Always copy the assets fromt the default theme first
    // If a custom theme is then used, it does not have to provide all of the images
    // just those that it wishes to change
    this.addUnique(deps, '@stratosui/theme');

    this.addUnique(deps, this.theme);

    // Add theme - Note: Dont' need to do this - we will look for code and assets
    // separately
    this.addUnique(deps, this.packageJson.name);
    // console.log('Here are the dependencies we will use to look for Stratos packages:')
    // console.log(deps);

    // Add all local packages as well
    this.addUnique(deps, Object.keys(this.resolve));

    this.log('-----');
    this.log(deps);

    deps.forEach(dep => {
        // TODO: Look for overrides to the default location in node_modules
        this.processPackage(dep);
    });

    // Todo - only add package if it is not already there

    this.extensions = this.determineExtensions();

    if (this.extensions.length === 0) {
      this.log('Compiling without any extensions');
    } else {
      this.log('Compiling with these extensions:');
      this.extensions.forEach(ext => console.log( ' + ' + ext));
    }

      // Get the package info for the theme
    const themePkgFile = this.resolvePackage(this.theme, 'package.json');
    if (themePkgFile && fs.existsSync(themePkgFile)) {
      this.themePackageFolder = path.dirname(themePkgFile);
      this.themePackageJson = JSON.parse(fs.readFileSync(themePkgFile, 'utf8'));
    } else {
      this.log('Could not find package.json for the theme');
    }
  }

  // Try and find and load a package.json file in the specified folder
  private loadPackageFile(dir: string) {
    const pkgFile = path.join(dir, 'package.json');
    let pkg = null;
    if (fs.existsSync(pkgFile)) {
      try {
        pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8').toString());
      } catch(e) {}
    }
    return pkg;
  }

  private log(msg: any) {
    if (this.loggingEnabled) {
      console.log(msg);
    }
  }

  // Scan for local packages in the source tree
  private scanLocalPackages() {

    // Go through all folders
    const getDirectories = source => fs.readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(source, dirent.name));

    getDirectories(this.angularJson.newProjectRoot).forEach(dir => {
      this.log(dir);
      const pkg = this.loadPackageFile(dir);
      if (pkg && pkg.name) {
        // Make a note of the package name and the local folder for it
        this.resolve[pkg.name] = dir;
      }
    });
  }

  private determineExtensions() {

    const pkgs = new Packages(this);
    const all = pkgs.getExtensions();

    // If we don't have any explicit includes, then find all local extensions
    if (!this.stratosConfig.extensions) {
      return all;
    }

    // Default to all local packages
    let ext = all;

    // Use the include set if one is specified
    if (this.stratosConfig.extensions.include) {
      ext = all.filter(e => this.stratosConfig.extensions.include.includes(e.package));
    }

    // Remove andy excluded extensions
    if (this.stratosConfig.extensions.exclude) {
      ext = ext.filter(e => !this.stratosConfig.extensions.exclude.includes(e.package));
    }

    return ext;
  }

  private addUnique(items: string[], item: string | string[]) {
    if (Array.isArray(item)) {
      items.forEach(i => this._addUnique(items, i));
    } else {
      this._addUnique(items, item);
    }
  }

  private _addUnique(items: string[], item: string) {
    if (items.findIndex((i) => i === item) === -1) {
      items.push(item);
    }
  }


  public getPackageJsonFolder() {
    return path.dirname(this.packageJsonFile);
  }

  public getNodeModulesFolder() {
    return path.dirname(this.nodeModulesFile);
  }

  // Go up the directory hierarchy and look for the named file or folder
  private findFileOrFolderInChain(dir: string, name: string): string {
    const parent = path.dirname(dir);
    const itemPath = path.join(dir, name);
    if (fs.existsSync(itemPath)) {
      return itemPath;
    }

    if (parent === dir) {
      return null;
    }

    return this.findFileOrFolderInChain(parent, name);
  }

  // Resolve a package to a directory to a file path, if name is given
  public resolvePackage(pkg, name) {
    // console.log('=== ResolvePackage');
    // console.log(pkg);
    // console.log(name);

    let packagePath;
    // Do we have a local package?
    if (this.resolve[pkg]) {
      packagePath = this.resolve[pkg];
      // Make path absolute
      if (!path.isAbsolute(packagePath)) {
        packagePath = path.resolve(packagePath);
      }
    } else {
      // Default to getting the package from the node_modules folder
      packagePath = path.join(this.getNodeModulesFolder(), pkg);
    }

    if (name) {
      packagePath = path.join(packagePath, name);
    }
    return packagePath;
  }

  // Process a package
  private processPackage(name: string) {

    if (name.indexOf('@angular') === 0) {
      // We can ignore any angular packages
      return;
    }

    // console.log('================================================================================');
    // console.log('Checking: ' + name);

    // Read the package file for this package
    const pkgFile = this.resolvePackage(name, 'package.json');
    const packagePath = path.dirname(pkgFile);
    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      // console.log('Read package.json for ' + name);
      // console.log(pkg);
      if (pkg.stratos) {
        // Is this package themeable?
        if (pkg.stratos.theming) {
          const refParts = pkg.stratos.theming.split('#');
          if (refParts.length === 2) {
            const themingConfig: ThemingConfig = {
              ref: pkg.stratos.theming,
              package: name,
              scss: refParts[0],
              mixin: refParts[1],
              importPath: path.join(packagePath, refParts[0])
            };
            this.themedPackages.push(themingConfig);
            this.log('Found themed package: ' + name + '(' + pkg.stratos.theming + ')');
            // console.log(themingConfig);
          } else {
            this.log('Invalid theming reference: ' + pkg.stratos.theming);
          }
        }

        // Check for assets
        if (pkg.stratos.assets) {
          Object.keys(pkg.stratos.assets).forEach(src => {
            const abs = path.join(packagePath, src);
            console.log(abs);
            this.assets.push({
              from: abs,
              to: pkg.stratos.assets[src],
              force: true
            });
          });
        }
      }
    }
    // console.log('================================================================================')
  }

  // public addWatches(webpackConfig: any) {
  //   if (this.watches.length> 0) {
  //     const watchPlugin = new ExtraWatchWebpackPlugin({
  //       files: this.watches,
  //     });
  //     webpackConfig.plugins = webpackConfig.plugins.concat([watchPlugin]);
  //   }
  // }
}
