import { ExtensionsHandler } from './extensions';
import { AssetsHandler } from './assets';
import { SassHandler } from './sass';
import { StratosConfig } from '../lib/stratos.config';
import { IndexHtmlHandler } from './index.html';

class StratosBuilder {

  constructor(public webpackConfig, public options) { }

  public run() {

    const sConfig = new StratosConfig(__dirname, this.options);

    // Sass handler for themes and themable packages
    const sass = new SassHandler();
    sass.apply(this.webpackConfig, sConfig);

    // Assets from extensions
    const assets = new AssetsHandler();
    assets.apply(this.webpackConfig, sConfig);

    // Index HTML modifier
    // this.webpackConfig.plugins.push(new IndexHtmlHandler(this.webpackConfig, sConfig));
    // const index = new IndexHtmlHandler(this.webpackConfig, sConfig);
    // index.install();

    // Extensions (code)
    const ext = new ExtensionsHandler();
    ext.apply(this.webpackConfig, sConfig, this.options);
  }
}

const runBuilder = (config, options) => {

  const builder = new StratosBuilder(config, options);
  builder.run();

  return config;
};

module.exports = runBuilder;
