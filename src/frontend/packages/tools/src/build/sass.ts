
import * as path from 'path';

import { StratosConfig } from './../lib/stratos.config';

export class SassHandler {

  constructor() { }

  public apply(webpackConfig: any, config: StratosConfig) {
    // Find the node-saas plugin and add a custom import resolver
    webpackConfig.module.rules.forEach(rule => {
      if (rule.include) {
        rule.use.forEach(p => {
          if (p.loader === 'sass-loader') {
            p.options.importer = this.customSassImport(config);
          }
        });
      }
    });
  }

  private getThemingForPackages(c: StratosConfig): string {
    let contents = '';
    c.themedPackages.forEach(themingConfig => {
      contents += `@import '${themingConfig.importPath}';\n`;
      contents += `@include ${themingConfig.mixin}($stratos-theme);\n`;
    });

    return contents;
  }

  private customSassImport(config: StratosConfig) {
    const that = this;
    return (url, prev, done) => {
      // console.log('Custom import: ' + url);
      let result = url;
      if (url === '~@stratos/theme/extensions') {
        // Generate SCSS to appy theming to the packages that need to be themed
        return {
          contents: that.getThemingForPackages(config)
        };
      } else if (url === '~@stratos/theme') {
        // console.log('================================================');
        // console.log(config.theme);
        // console.log('Got theme reference - using theme: ' + config.resolvePackage(config.theme, '_index.scss'));
        // console.log('================================================');
        return {
          file: config.resolvePackage(config.theme, '_index.scss')
        }
      } else if (url.indexOf('~') === 0) {
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
        // See if we can resolve the package name
        if (config.resolve[pkgName]) {
          // console.log('GOT OVERRIDE: ' + resolve[pkgName]);
          // Should be a directory
          result = config.resolve[pkgName] + '/_' + pkgPath + '.scss';
          result = path.resolve(result);
          return {
            file: result
          };
        }
        // console.log('Leaving as is: ' + url);
      }

      // Return URL - this tells SASS Loader to use its own resolution mechanism
      return url;
    };
  }

}
