import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { GitMetadata } from './git.metadata';
import { Packages } from './packages';

// Default theme to use
// Assests are always copied from this theme
// Then, if a different theme is being used, its assets
// are overlayed on top
const DEFAULT_THEME = '@stratos/theme';

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

  // newProjectRoot from the angular.json file
  // Used as the directory to check for local packages
  public newProjectRoot: string;

  // Stratos config file
  public stratosConfig: any;

  // Local resolution overrides
  public resolve: any;

  // Assets collected from packages
  public assets = [];

  // Git Metadata
  public gitMetadata: GitMetadata;

  // Extensions
  public extensions: ExtensionMetadata[] = [];

  constructor(dir: string, options?: any) {
    this.angularJsonFile = this.findFileOrFolderInChain(dir, 'angular.json');
    this.angularJson = JSON.parse(fs.readFileSync(this.angularJsonFile, 'utf8').toString());

    // The Stratos config file is optional - allows overriding default behaviour
    this.stratosConfig = {};
    if (this.angularJsonFile) {
      // Read stratos.yaml if we can
      try {
        const stratosYamlFile = path.join(path.dirname(this.angularJsonFile), 'stratos.yml');
        this.stratosConfig = yaml.safeLoad(fs.readFileSync(stratosYamlFile, 'utf8'));
        console.log(this.stratosConfig);
        console.log('Read sratos.yml okay from: ' + stratosYamlFile);
      } catch (e) {
        console.log(e);
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

    this.selectResolveConfig();

    this.gitMetadata = new GitMetadata(path.dirname(this.angularJsonFile));
    console.log(this.gitMetadata);

    this.newProjectRoot = this.angularJson.newProjectRoot;

    // TODO: This needs tidying up

    if (!this.packageJson.peerDependencies) {
      return;
    }

    const deps = [];
    Object.keys(this.packageJson.peerDependencies).forEach(dep => {
      deps.push(dep);
    });

    // Add theme - Note: Dont' need to do this - we will look for code and assets
    // separately
    deps.push(this.theme);
    deps.push(this.packageJson.name);
    console.log('Here are the dependencies we will use to look for Stratos packages:')
    console.log(deps);

    deps.forEach(dep => {
        // TODO: Look for overrides to the default location in node_modules
        this.processPackage(dep);
    });

    this.extensions = this.determineExtensions();

    if (this.extensions.length === 0) {
      console.log('Compiling without any extensions');
    } else {
      console.log('Compiling with these extensions:');
      this.extensions.forEach(ext => console.log( ' + ' + ext));
    }
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

  private selectResolveConfig() {
    // Pull out correct resolve profile
    if (this.stratosConfig.resolve && this.stratosConfig.resolveConfig) {
      this.resolve = this.stratosConfig.resolveConfig[this.stratosConfig.resolve];
      if (!this.resolve) {
        this.resolve = {};
        console.log('Can not find resolve configuration: ' + this.stratosConfig.resolve);
      } else {
        console.log('Got resolve configuration');
        console.log(this.resolve);
      }
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

  public resolvePackage(pkg, name) {
    // console.log('=== ResolvePackage');
    // console.log(pkg);
    // console.log(name);
    let packagePath = path.join(this.getNodeModulesFolder(), pkg);
    if (this.resolve[pkg]) {
      // console.log('GOT AN OVERRIDE');
      packagePath = this.resolve[pkg];
      // console.log(packagePath);
      // Make path absolute
      if (!path.isAbsolute(packagePath)) {
        packagePath = path.resolve(packagePath);
      }
    }

    if (name) {
      packagePath = path.join(packagePath, name);
    }
    return packagePath;
  }

  private processPackage(name: string) {

    if (name.indexOf('@angular') === 0) {
      // We can ignore any angular packages
      return;
    }

    // console.log('================================================================================');
    // console.log('Checking: ' + name);

    // See if we should be using a different path for this package
    let packagePath = path.join(this.getNodeModulesFolder(), name);
    if (this.resolve[name]) {
      packagePath = this.resolve[name];

      // Make path absolute
      if (!path.isAbsolute(packagePath)) {
        packagePath = path.resolve(packagePath);
      }
      console.log('[Resolve] Package ' + name + ' from ' + packagePath);
    }

    // Read the package file for this package
    const pkgFile = path.join(packagePath, 'package.json');
    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      // console.log('Read package.json');
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
            console.log('Found themed package: ' + name + '(' + pkg.stratos.theming + ')');
            // console.log(themingConfig);
          } else {
            console.log('Invalid theming reference: ' + pkg.stratos.theming);
          }
        }

        // Check for assets
        if (pkg.stratos.assets) {
          console.log('GOT ASSET CONFIG');
          Object.keys(pkg.stratos.assets).forEach(src => {
            console.log("GOT ASSET SRC: " + src);
            const abs = path.join(packagePath, src);
            console.log(abs);
            this.assets.push({
              from: abs,
              to: pkg.stratos.assets[src],
              force: true
            });
            // console.log(assets);
          });
        }
      }
    } else {
      console.log('Warning: Could not find package file for package: ' + name);
    }
    // console.log('================================================================================')
  }
}
