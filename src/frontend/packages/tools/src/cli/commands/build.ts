import { Packages } from './../../lib/packages';
import { StratosConfig } from './../../lib/stratos.config';
import * as child_process from 'child_process';
//import spawn = require('child_process');

//import 
export class BuildCommand {

  public run(args) {
    console.log('====================================');
    console.log('Building all local packages:');

    const cwd = process.cwd();
    const config = new StratosConfig(cwd);

    console.log(config.theme);
    console.log(config.newProjectRoot);

    const pkgs = new Packages(config);
    console.log('====================================');

    //console.log(pkgs.packages);

    const pkgName = (args.length === 1) ? args[0] : null;

    pkgs.packages.forEach(pkg => {

      if (!pkgName || pkgName === pkg.name) {
        console.log('Building package: ' + pkg.name);
        if (pkg.ignore) {
          console.log('Ignoring package: ' + pkg.name);
        }

        if (pkg.build && !pkg.ignore) {
          // Run the build command in the package's folder
          const build = child_process.spawnSync(pkg.build.command, pkg.build.args, {
            cwd: pkg.dir,
            stdio: [
              'inherit',
              'inherit',
              'inherit'
            ]
           });
          if (build.status !== 0) {
            console.log('BUILD ERROR');
          }

        }
      }
    });
  }
}
