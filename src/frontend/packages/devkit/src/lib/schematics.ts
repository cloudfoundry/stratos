import { normalize, split, tags, virtualFs, workspaces } from '@angular-devkit/core';
import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';


export const Builders = {
  Theme: '@stratosui/devkit:stratos-theme'
}

export const Versions = {
  Stratos: '0.1.0',
}

export const ProjectType = {
  Theme: 'library',
}

// =========================================================================================================
// Utilities from the Angular Schema repository
// =========================================================================================================

// See: https://github.com/angular/angular-cli/blob/master/packages/schematics/angular/utility/validation.ts

export function validateProjectName(projectName: string) {
  const errorIndex = getRegExpFailPosition(projectName);
  const unsupportedProjectNames: string[] = [];
  const packageNameRegex = /^(?:@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+$/;
  if (errorIndex !== null) {
    const firstMessage = tags.oneLine`
    Project name "${projectName}" is not valid. New project names must
    start with a letter, and must contain only alphanumeric characters or dashes.
    When adding a dash the segment after the dash must also start with a letter.
    `;
    const msg = tags.stripIndent`
    ${firstMessage}
    ${projectName}
    ${Array(errorIndex + 1).join(' ') + '^'}
    `;
    throw new SchematicsException(msg);
  } else if (unsupportedProjectNames.indexOf(projectName) !== -1) {
    throw new SchematicsException(
      `Project name ${JSON.stringify(projectName)} is not a supported name.`);
  } else if (!packageNameRegex.test(projectName)) {
    throw new SchematicsException(`Project name ${JSON.stringify(projectName)} is invalid.`);
  }
}


function getRegExpFailPosition(str: string): number | null {
  const isScope = /^@.*\/.*/.test(str);
  if (isScope) {
    // Remove starting @
    str = str.replace(/^@/, '');
    // Change / to - for validation
    str = str.replace(/\//g, '-');
  }

  const parts = str.indexOf('-') >= 0 ? str.split('-') : [str];
  const matched: string[] = [];

  const projectNameRegexp = /^[a-zA-Z][.0-9a-zA-Z]*(-[.0-9a-zA-Z]*)*$/;

  parts.forEach(part => {
    if (part.match(projectNameRegexp)) {
      matched.push(part);
    }
  });

  const compare = matched.join('-');

  return (str !== compare) ? compare.length : null;
}


// See: https://github.com/angular/angular-cli/blob/master/packages/schematics/angular/utility/paths.ts

export function relativePathToWorkspaceRoot(projectRoot: string | undefined): string {
  const normalizedPath = split(normalize(projectRoot || ''));

  if (normalizedPath.length === 0 || !normalizedPath[0]) {
    return '.';
  } else {
    return normalizedPath.map(() => '..').join('/');
  }
}

// See: https:// github.com/angular/angular-cli/blob/master/packages/schematics/angular/utility/workspace.ts
export function updateWorkspace(
  updater: (workspace: workspaces.WorkspaceDefinition) => void | PromiseLike<void>,
): Rule;
export function updateWorkspace(
  updaterOrWorkspace: workspaces.WorkspaceDefinition
    | ((workspace: workspaces.WorkspaceDefinition) => void | PromiseLike<void>),
): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);

    if (typeof updaterOrWorkspace === 'function') {

      const { workspace } = await workspaces.readWorkspace('/', host);

      const result = updaterOrWorkspace(workspace);
      if (result !== undefined) {
        await result;
      }

      await workspaces.writeWorkspace(workspace, host);
    } else {
      await workspaces.writeWorkspace(updaterOrWorkspace, host);
    }
  };
}

export async function getWorkspace(tree: Tree, path = '/') {
  const host = createHost(tree);
  const { workspace } = await workspaces.readWorkspace(path, host);
  return workspace;
}

function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new Error('File not found.');
      }

      return virtualFs.fileBufferToString(data);
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      // approximate a directory check
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}