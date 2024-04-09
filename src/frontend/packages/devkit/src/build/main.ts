import { StratosConfig } from "../lib/stratos.config";
import { AssetsHandler } from "./assets";
import { ExtensionsHandler } from "./extensions";
import { SassHandler } from "./sass";

/**
 * Webpack customizations for Stratos
 *
 * The runBuilder function is exported and used as the function to apply
 * customizations to the Webpack configuration
 */

class StratosBuilder {
  constructor(public webpackConfig, public options) {}

  public run() {
    const dir = this.webpackConfig.context || __dirname;

    // Read in the Stratos config file if present (and do so config initialization)
    const sConfig = new StratosConfig(dir, this.options);

    // Sass handler for themes and themable packages
    const sass = new SassHandler();
    sass.apply(this.webpackConfig, sConfig);

    // Assets from extensions or theme
    const assets = new AssetsHandler();
    assets.apply(this.webpackConfig, sConfig);

    // Extensions (code)
    const ext = new ExtensionsHandler();
    ext.apply(this.webpackConfig, sConfig, this.options);
  }
}

// TODO: tmp solution until webpack is updated to v5
// This resolves the following error:
// Error: error:0308010C:digital envelope routines::unsupported
const crypto = require("crypto");
const cryptoOrigCreateHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  cryptoOrigCreateHash(algorithm == "md4" ? "sha256" : algorithm);

// Apply the Stratos customizations to the webpack configuration
const runBuilder = (config, options) => {
  const builder = new StratosBuilder(config, options);
  builder.run();
  // TODO: also remove with update to webpack v5
  config.output.hashFunction = "sha256";
  return config;
};

module.exports = runBuilder;
