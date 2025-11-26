import { type BuilderContext, type BuilderOutput, createBuilder } from '@angular-devkit/architect';
import type { JsonObject } from '@angular-devkit/core';
// @ts-expect-error - fs-extra doesn't have types but skipLibCheck handles this
import * as FS from 'fs-extra';
import * as Path from 'node:path';

import { Packages } from '../lib/packages.js';

export interface ThemeOptions extends JsonObject {
  outputPath: string;
}

export default createBuilder(commandBuilder);

async function commandBuilder(
  options: ThemeOptions,
  context: BuilderContext,
  ): Promise<BuilderOutput> {
    // A theme 'just' contains assets, so copy these to the dist folder
    const outPath = Path.join(context.workspaceRoot, options.outputPath);

    // Remove the dist folder and recreate it fresh
    FS.removeSync(outPath);
    FS.ensureDir(outPath);

    // Get project root
    const prjMetadata = await context.getProjectMetadata(context.target);

    // Copy all files from root to the outPath

    FS.copySync(prjMetadata.root as string, outPath);

    // We can remove scripts from the package.json file
    const pkgFile = Packages.loadPackageFile(outPath);
    if (pkgFile !== null) {
      delete pkgFile.scripts;
      const pkgFilePath = Path.join(outPath, 'package.json');
      FS.writeJsonSync(pkgFilePath, pkgFile, { spaces: 2});
    }

    return Promise.resolve(
      { success: true}
    );
}
