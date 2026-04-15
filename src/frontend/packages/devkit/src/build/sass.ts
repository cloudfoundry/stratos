import * as path from 'path';
import { StratosConfig } from '../lib/stratos.config.js';

/**
 * Sass Handler
 *
 * Provides some custom resolution of sass files so that the theming
 * is applied to components and that the chosen theme is used.
 *
 * Essentially intercepts package imports of the form ~@startosui/theme
 * and ensures the correct packaeg is used.
 */
export class SassHandler {

  constructor() { }

  //  Set options on the Webpack sass-loader plugin to use us as a custom importer
  public apply(webpackConfig: any, config: StratosConfig) {
    // Find the node-saas plugin and add a custom import resolver
    webpackConfig.module.rules.forEach(rule => {
      if (rule.rules !== undefined) {
        rule.rules.forEach(innerRule => {
          if (innerRule.use !== undefined) {
            innerRule.use.forEach(p => {
              if (p.loader && p.loader.indexOf('sass-loader') > 0) {
                // Ensure options exists
                if (!p.options) p.options = {};
                if (!p.options.sassOptions) p.options.sassOptions = {};
                
                // Configure SASS with custom importer for modern Angular Material v20
                try {
                  // Don't override implementation, let Angular CLI handle it
                  // Just set up our custom importer for theme resolution
                  p.options.sassOptions.importer = this.customSassImport(config);
                } catch (e) {
                  console.warn('Could not configure SASS importer:', e);
                }
              }
            });
          }
        });
      }
    });
  }

  private customSassImport(config: StratosConfig) {
    const that = this;
    return (url, _resourcePath) => {
      if (url === '~@stratosui/theme/extensions') {
        // Generate SCSS to appy theming to the packages that need to be themed
        return {
          contents: that.getThemingForPackages(config)
        };
      } else if (url === '~@stratosui/theme') {
        return {
          file: config.resolvePackage(config.getTheme().name, '_index.scss')
        };
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
        const pkgPath = pkgParts.join(path.sep);
        // See if we can resolve the package name
        const knownPath = config.resolveKnownPackage(pkgName);
        if (knownPath) {
          return {
            file: path.join(knownPath, pkgPath + '.scss')
          };
        }
      }

      // We could not resolve, so leave to the default resolver
      return null;
    };
  }

  // Generate an import and include for each themable package so that we theme
  // its components when the application is built.
  private getThemingForPackages(c: StratosConfig): string {
    let contents = '';
    const themedPackages = c.getThemedPackages();
    themedPackages.forEach(themingConfig => {
      contents += `@import '${themingConfig.importPath}';\n`;
    });

    contents += '\n@mixin apply-theme($stratos-theme) {\n';
    themedPackages.forEach(themingConfig => {
      contents += `  @include ${themingConfig.mixin}($stratos-theme);\n`;
    });
    contents += '}\n';

    return contents;
  }

}
