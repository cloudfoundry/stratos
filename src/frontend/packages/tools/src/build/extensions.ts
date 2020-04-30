import * as path from 'path';
import * as fs from 'fs';

import { NormalModuleReplacementPlugin } from 'webpack';

import { StratosConfig } from './../lib/stratos.config';

const importModuleRegex = /src\/frontend\/packages\/core\/src\/custom-import.module.ts/;

export class ExtensionsHandler {

  constructor() {}

  // Write out the _custom-import.module.ts file importing all of the required extensions
  public apply(webpackConfig: any, config: StratosConfig, options: any) {

    // Generate the module file to import the appropriate extensions
    const dir = path.dirname(options.main);
    const overrideFile = path.resolve(path.join(dir, './_custom-import.module.ts'));

    // console.log('-------');
    // console.log(overrideFile);

    fs.writeFileSync(overrideFile, '// This file is auto-generated - DO NOT EDIT\n\n');
    fs.appendFileSync(overrideFile, 'import { NgModule } from \'@angular/core\';\n');

    const moduleImports = {
      imports: []
    };

    const routingMmoduleImports = {
      imports: []
    };

    config.extensions.forEach(e => {
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
