import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { GitMetadata } from './git.metadata';
import { Logger } from './log';
import { AssetConfig, DEFAULT_THEME, ExtensionMetadata, PackageInfo, Packages, ThemingConfig } from './packages';

/**
 * Represents the startos.yaml file or the defaults if not found
 * Also includes related cofnig such as node_modules dirpath and angular.json file path
 */

export class StratosConfig implements Logger {

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

  // Git Metadata
  public gitMetadata: GitMetadata;

  // Extra files for webpack to watch
  public watches: string[] = [];

  private loggingEnabled = true;

  private packages: Packages;


  constructor(dir: string, options?: any, loggingEnabled = true) {
    this.angularJsonFile = this.findFileOrFolderInChain(dir, 'angular.json');
    this.angularJson = JSON.parse(fs.readFileSync(this.angularJsonFile, 'utf8').toString());
    this.loggingEnabled = loggingEnabled;

    // The Stratos config file is optional - allows overriding default behaviour
    this.stratosConfig = {};
    if (this.angularJsonFile) {
      // Read stratos.yaml if we can
      const stratosYamlFile = path.join(path.dirname(this.angularJsonFile), 'stratos.yaml');
      if (fs.existsSync(stratosYamlFile)) {
        try {
          this.stratosConfig = yaml.safeLoad(fs.readFileSync(stratosYamlFile, 'utf8'));
          // this.log(this.stratosConfig);
          this.log('Read stratos.yaml okay from: ' + stratosYamlFile);
          this.watches.push(stratosYamlFile);
        } catch (e) {
          this.log(e);
        }
      } else {
        this.log('No stratos.yaml file found');
      }
    }

    const mainDir = options ? path.dirname(options.main) : dir;

    this.packageJsonFile = this.findFileOrFolderInChain(mainDir, 'package.json');
    if (this.packageJsonFile !== null) {
      this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonFile, 'utf8').toString());
    }

    this.nodeModulesFile = this.findFileOrFolderInChain(mainDir, 'node_modules');

    this.gitMetadata = new GitMetadata(path.dirname(this.angularJsonFile));
    // this.log(this.gitMetadata);
    if (this.gitMetadata.exists) {
      this.log('Read git metadata file');
    }

    this.newProjectRoot = this.angularJson.newProjectRoot;

    // Discover all packages

    // Helper to discover and interpret packages
    this.packages = new Packages(this, this.nodeModulesFile, this.newProjectRoot);
    this.packages.setLogger(this);
    this.packages.scan(this.packageJson);

    this.log('Using theme ' + this.packages.theme.name);

    // Always copy the assets fromt the default theme first
    // If a custom theme is then used, it does not have to provide all of the images
    // just those that it wishes to change
    // this.addUnique(pkgs, '@stratosui/theme');

    // // Add the specifief theme in
    // this.addUnique(pkgs, this.theme);

    // // Add theme - Note: Dont' need to do this - we will look for code and assets
    // // separately
    // this.addUnique(pkgs, this.packageJson.name);
    // console.log('Here are the dependencies we will use to look for Stratos packages:')
    // console.log(deps);

    const extensions = this.getExtensions();

    if (extensions.length === 0) {
      this.log('Building without any extensions');
    } else {
      this.log('Building with these extensions:');
      extensions.forEach(ext => console.log( ' + ' + ext));
    }
  }

  public log(msg: any) {
    if (this.loggingEnabled) {
      console.log(msg);
    }
  }

  public getTheme(): PackageInfo {
    return this.packages.theme;
  }

  public getDefaultTheme(): PackageInfo {
    return this.packages.packageMap[DEFAULT_THEME];
  }

  public getExtensions(): ExtensionMetadata[] {
    return this.packages.packages.filter(p => !!p.extension).map(pkg => pkg.extension);
  }

  public getAssets(): AssetConfig[] {
    const assets: AssetConfig[] = [];
    this.packages.packages.forEach(pkg => {
      if (pkg.assets) {
        assets.push(...pkg.assets);
      }
    });

    return assets;
  }

  public getThemedPackages(): ThemingConfig[] {
    return this.packages.packages.filter(p => !!p.theming).map(pkg => pkg.theming);
  }

  public getPackageJsonFolder() {
    return path.dirname(this.packageJsonFile);
  }

  public getNodeModulesFolder() {
    return path.dirname(this.nodeModulesFile);
  }

  public getKnownPackagePath(pkg: string): string {
    const p = this.packages.packageMap[pkg];
    if (p) {
      let packagePath = p.dir;
      if (!path.isAbsolute(packagePath)) {
        packagePath = path.resolve(packagePath);
      }
      return packagePath;
    }

    return null;
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
    let packagePath;
    const pkgInfo = this.packages.packageMap[pkg];
    if (pkgInfo) {
      packagePath = pkgInfo.dir;
    } else {
      // Default to getting the package from the node_modules folder
      packagePath = path.join(this.getNodeModulesFolder(), pkg);
    }

    if (!path.isAbsolute(packagePath)) {
      packagePath = path.resolve(packagePath);
    }

    if (name) {
      packagePath = path.join(packagePath, name);
    }
    return packagePath;
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
