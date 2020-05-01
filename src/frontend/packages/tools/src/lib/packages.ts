import * as path from 'path';
import * as fs from 'fs';
import { StratosConfig, ExtensionMetadata } from './stratos.config';

const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');

export interface PackageBuildInfo {
  command: string;
  args: string[];
}

export interface PackageInfo {
  name: string;
  dir: string;
  stratos: boolean;
  json: any;
  build: PackageBuildInfo;
  ignore: boolean;
  extension?: ExtensionMetadata;
}

export class Packages {

  public packages: PackageInfo[] = [];
  public packageMap: Map<string, PackageInfo>;

   constructor(config: StratosConfig) {

    const dir = config.newProjectRoot;

    this.packageMap = new Map<string, PackageInfo>();

    // Find all local packages in the folder
    const isDirectory = source => lstatSync(source).isDirectory();
    const getDirectories = source =>
      readdirSync(source).map(name => join(source, name)).filter(isDirectory);

    const p = getDirectories(dir).forEach(pkgDir => {
      const pkgInfo: any = {
        dir: pkgDir
      };

      // Read the package file
      const pkgFile = path.join(pkgDir, 'package.json');
      if (fs.existsSync(pkgFile)) {
        pkgInfo.json  = JSON.parse(fs.readFileSync(pkgFile, 'utf8').toString());
        pkgInfo.name = pkgInfo.json.name;
        pkgInfo.stratos = !!pkgInfo.json.stratos;
        pkgInfo.ignore = pkgInfo.json.stratos ? pkgInfo.json.stratos.ignore || false : false;

        if (pkgInfo.stratos) {
          if (pkgInfo.json.stratos.module) {
            pkgInfo.extension = {
              package: pkgInfo.name,
              module: pkgInfo.json.stratos.module,
              routingModule: pkgInfo.json.stratos.routingModule
            };
          }
        }

        if (pkgInfo.json.scripts && pkgInfo.json.scripts.build) {
          pkgInfo.build = {
            command: 'npm',
            args: [ 'run', 'build' ]
          };
        } else {
          // Look for a matching project in the angular.json file
          if (config.angularJson) {
            let ngBuild = false;
            let ngBuildProject = pkgInfo.name;
            // First match on full name
            ngBuild = !!config.angularJson.projects[ngBuildProject];
            if (!ngBuild) {
              // Now try matching on the name without the scope
              const parts = pkgInfo.name.split('/');
              ngBuildProject = parts[1];
              if (parts.length === 2) {
                ngBuild = !!config.angularJson.projects[ngBuildProject];
              }
            }

            if (ngBuild) {
              // Need to verify that
              pkgInfo.build = {
                command: 'ng',
                args: [ 'build', '--project=' + ngBuildProject]
              };
            }
          }
        }
      }

      this.packages.push(pkgInfo);
      this.packageMap.set(pkgInfo.name, pkgInfo);
    });
  }

  public getExtensions(): ExtensionMetadata[] {
    const extensions: ExtensionMetadata[] = [];
    this.packages.forEach(pkg => {
      if (pkg.extension) {
        extensions.push(pkg.extension);
      }
    });

    return extensions;
  }
}
