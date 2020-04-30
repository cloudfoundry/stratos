import * as path from 'path';
import * as fs from 'fs';

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
      console.log('Theme has custom loading screen');
      const css = this.config.themePackageJson.stratos.theme.loadingCss;
      const html = this.config.themePackageJson.stratos.theme.loadingHtml;
      const cssFile = path.resolve(this.config.themePackageFolder, css);
      const htmlFile = path.resolve(this.config.themePackageFolder, html);

      const loadingCss = fs.readFileSync(cssFile, 'utf8');
      src = src.replace(/\/\*\* @@LOADING_CSS@@ \*\*\//g, loadingCss);

      const loadingHtml = fs.readFileSync(htmlFile, 'utf8');
      src = src.replace(/<!-- @@LOADING_HTML@@ -->/g, loadingHtml);
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

  // Get the Stratos config
  const sConfig = new StratosConfig(__dirname, this.options);

  const handler = new IndexHtmlHandler(sConfig);
  const modified = handler.apply(content);
  return Promise.resolve(modified);
};

module.exports = indexTransform;
