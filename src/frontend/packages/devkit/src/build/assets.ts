import CopyPlugin from 'copy-webpack-plugin';

import type { StratosConfig } from '../lib/stratos.config.js';

// Handler ensures all assets from packages are copied as part of the build
export class AssetsHandler {

  public apply(webpackConfig: { plugins: unknown[] }, config: StratosConfig) {
    const assetsCopyConfig = config.getAssets();
    if (assetsCopyConfig.length > 0) {
      // Add a plugin to copy assets - this will ensure we copy the assets from each extension and the theme
      const plugins = [
        new CopyPlugin({
          patterns: assetsCopyConfig
        })
      ];
      webpackConfig.plugins = webpackConfig.plugins.concat(plugins);
    }
  }
}
