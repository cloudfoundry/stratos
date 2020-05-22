import * as fs from 'fs';
import * as path from 'path';

import { StratosConfig } from '../lib/stratos.config';

export class IndexHtmlHandler {

  constructor(public config: StratosConfig) {}

  public apply(src: string): string {

    // Patch different page title if there is one
    const title = this.config.stratosConfig.title || 'Stratos';
    src = src.replace(/@@TITLE@@/g, title);

    // // Git Information
    const gitMetadata = this.config.gitMetadata;
    src = src.replace(/@@stratos_git_project@@/g, gitMetadata.project );
    src = src.replace(/@@stratos_git_branch@@/g, gitMetadata.branch );
    src = src.replace(/@@stratos_git_commit@@/g, gitMetadata.commit );

    // // Date and Time that the build was made (approximately => it is when this script is run)
    src = src.replace(/@@stratos_build_date@@/g, new Date().toString() );

    // Loading view (provided by theme)
    if (this.config.themePackageJson.stratos && this.config.themePackageJson.stratos.theme) {
      const css = this.config.themePackageJson.stratos.theme.loadingCss;
      const html = this.config.themePackageJson.stratos.theme.loadingHtml;

      if (css || html) {
        console.log('Applying custom loading screen/theme to the main index.html page');
      }

      if (css) {
        const cssFile = path.resolve(this.config.themePackageFolder, css);
        if (fs.existsSync(cssFile)) {
          const loadingCss = fs.readFileSync(cssFile, 'utf8');
          src = src.replace(/\/\*\* @@LOADING_CSS@@ \*\*\//g, loadingCss);
        }
      }

      if (html) {
        const htmlFile = path.resolve(this.config.themePackageFolder, html);
        if (fs.existsSync(htmlFile)) {
          const loadingHtml = fs.readFileSync(htmlFile, 'utf8');
          src = src.replace(/<!-- @@LOADING_HTML@@ -->/g, loadingHtml);
        }
      }
    }
    return src;
  }
}

interface TargetOptions {
  configuration?: string;
  project: string;
  target: string;
}

// Transform the index.html
const indexTransform = (options: TargetOptions, content: string) => {

  // Get the Stratos config - don't log a second time
  const sConfig = new StratosConfig(__dirname, this.options, false);

  const handler = new IndexHtmlHandler(sConfig);
  const modified = handler.apply(content);
  return Promise.resolve(modified);
};

module.exports = indexTransform;
