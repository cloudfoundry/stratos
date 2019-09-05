import { StratosConfig } from './../lib/stratos.config';

import { RawSource } from 'webpack-sources';

export class IndexHtmlHandler {

  private outputFile = 'index.html';

  constructor(public webpackConfig: any, public config: StratosConfig) {}

  public install() {
    // Index HTML modifier
    const index = this.webpackConfig.plugins.findIndex(plugin => plugin.constructor.name === 'IndexHtmlWebpackPlugin');
    if (index >= 0) {
      const plugin = this.webpackConfig.plugins[index];
      if (plugin._options) {
        this.outputFile = plugin._options.output || 'index.html';
      }
      this.webpackConfig.plugins.splice(index + 1, 0, this);
      console.log('Installed index.html modifier');
    }
  }

  public apply(compiler) {
    const that = this;

    compiler.hooks.emit.tapAsync(
      'StratosIndexHtmlPlugin',
      (compilation, callback) => {
        const indexFile = compilation.assets[this.outputFile];
        let src = indexFile.source();

        // Patch different page title if there is one
        const title = that.config.stratosConfig.title || 'Stratos';
        src = src.replace(/@@TITLE@@/g, title);

        // // Git Information
        const gitMetadata = that.config.gitMetadata;
        src = src.replace(/@@stratos_git_project@@/g, gitMetadata.project );
        src = src.replace(/@@stratos_git_branch@@/g, gitMetadata.branch );
        src = src.replace(/@@stratos_git_commit@@/g, gitMetadata.commit );

        // // Date and Time that the build was made (approximately => it is when this script is run)
        src = src.replace(/@@stratos_build_date@@/g, new Date() );

        compilation.assets[this.outputFile] = new RawSource(src);

        callback();
      }
    );
  }
}
