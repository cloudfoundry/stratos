import { StratosConfig } from './../lib/stratos.config';


export class SassHandler {

  constructor() { }

  public apply(webpackConfig: any, config: StratosConfig) {
    // Find the node-saas plugin and add a custom import resolver
    webpackConfig.module.rules.forEach(rule => {
      if (rule.include) {
        rule.use.forEach(p => {
          if (p.loader && p.loader.indexOf('sass-loader') > 0) {
            p.options.sassOptions = {
              importer: this.customSassImport(config)
            };
          }
        });
      }
    });
  }

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

  private customSassImport(config: StratosConfig) {
    const that = this;
    return (url, resourcePath) => {
      // console.log('Custom import: ' + url + ' from ' + resourcePath);
      const result = url;
      if (url === '~@stratosui/theme/extensions') {
        // Generate SCSS to appy theming to the packages that need to be themed
        return {
          contents: that.getThemingForPackages(config)
        };
      } else if (url === '~@stratosui/theme') {
        // console.log('================================================');
        // console.log(config.theme);
        // console.log('Got theme reference - using theme: ' + config.resolvePackage(config.theme, '_index.scss'));
        // console.log('================================================');
        return {
          file: config.resolvePackage(config.theme, '_index.scss')
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
        const pkgPath = pkgParts.join('/');
        // See if we can resolve the package name
        const knownPath = config.getKnownPackagePath(pkgName);
        if (knownPath) {
          // console.log('GOT OVERRIDE: ' + config.resolve[pkgName]);
          // Should be a directory
          return {
            file: knownPath + '/_' + pkgPath + '.scss'
          };
        }
      }

      // console.log('Leaving as is: ' + path.relative(resourcePath, url));

      // We could not resolve, so leave to the default resolver
      return null;
    };
  }

}
