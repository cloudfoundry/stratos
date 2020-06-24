import * as fs from 'fs';
import * as path from 'path';
import { NormalModuleReplacementPlugin } from 'webpack';

import { StratosConfig } from '../lib/stratos.config';

const importModuleRegex = /src\/frontend\/packages\/core\/src\/custom-import.module.ts/;

/**
 * Generates the file _custom-import.module.ts containing the code to import
 * the extensions modules discovered from the packages being included.
 *
 * This also adds a module replacement into the build process, so that this generated file
 * is used instead of the default one in the repository, which does not import
 * any extensions.
 */

export class ExtensionsHandler {

  constructor() {}

  // Write out the _custom-import.module.ts file importing all of the required extensions
  public apply(webpackConfig: any, config: StratosConfig, options: any) {

    // Generate the module file to import the appropriate extensions
    const dir = path.dirname(options.main);
    const overrideFile = path.resolve(path.join(dir, './_custom-import.module.ts'));

    fs.writeFileSync(overrideFile, '// This file is auto-generated - DO NOT EDIT\n\n');
    fs.appendFileSync(overrideFile, 'import { NgModule } from \'@angular/core\';\n');

    const moduleImports = {
      imports: []
    };

    const routingMmoduleImports = {
      imports: []
    };

    config.getExtensions().forEach(e => {
      let modules = e.module;
      moduleImports.imports.push(e.module);
      if (e.routingModule) {
        routingMmoduleImports.imports.push(e.routingModule);
        modules += ', ' + e.routingModule;
      }

      fs.appendFileSync(overrideFile, 'import { ' + modules + ' } from \'' + e.package + '\';\n');
    });

    this.writeModule(overrideFile, 'CustomImportModule', moduleImports);
    this.writeModule(overrideFile, 'CustomRoutingImportModule', routingMmoduleImports);

    webpackConfig.plugins.push(new NormalModuleReplacementPlugin(
      importModuleRegex,
      overrideFile
    ));
  }

  private writeModule(file: string, name: string, imports: any) {
    fs.appendFileSync(file, '\n@NgModule(\n');
    let json = JSON.stringify(imports, null, 2);
    json = json.replace(/['"]+/g, '');
    fs.appendFileSync(file, json);
    fs.appendFileSync(file, ')\n');
    fs.appendFileSync(file, 'export class ' + name + ' {}\n\n');
  }
}
