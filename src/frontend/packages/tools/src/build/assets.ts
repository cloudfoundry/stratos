import CopyPlugin = require('copy-webpack-plugin');

import { StratosConfig } from '../lib/stratos.config';


export class AssetsHandler {

  constructor() {}

  public apply(webpackConfig: any, config: StratosConfig) {
    const assetsCopyConfig = config.getAssets();

    if (assetsCopyConfig.length > 0) {
      // Add a plugin to copy assets - this will ensure we copy the assets from each extension and the theme
      const plugins = [
        new CopyPlugin(assetsCopyConfig)
      ];
      webpackConfig.plugins = webpackConfig.plugins.concat(plugins);
    }
  }
}