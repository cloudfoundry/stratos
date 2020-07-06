import { join, normalize, strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';

import {
  Builders,
  getWorkspace,
  ProjectType,
  relativePathToWorkspaceRoot,
  updateWorkspace,
  validateProjectName,
} from '../../lib/schematics';
import { Versions } from './../../lib/schematics';
import { ThemeOptionsSchema } from './schema';

// Reference: https://github.com/angular/angular-cli/tree/master/packages/schematics/angular

function addThemeToWorkspaceFile(
  options: ThemeOptionsSchema,
  projectRoot: string,
  projectName: string,
  distRoot: string,
): Rule {
  return updateWorkspace(workspace => {
    if (workspace.projects.size === 0) {
      workspace.extensions.defaultProject = projectName;
    }

    workspace.projects.add({
      name: projectName,
      root: projectRoot,
      sourceRoot: `${projectRoot}/src`,
      projectType: ProjectType.Theme,
      targets: {
        build: {
          builder: Builders.Theme,
          options: {
            outputPath: `${distRoot}`,
          },
        },
      }
    });
  });
}

export default function (options: ThemeOptionsSchema): Rule {
  return async (host: Tree, context: SchematicContext) => {
    if (!options.name) {
      throw new SchematicsException(`Invalid options, "name" is required.`);
    }
    validateProjectName(options.name);

    // If scoped project (i.e. "@foo/bar"), convert projectDir to "foo/bar".
    const projectName = options.name;
    const packageName = strings.dasherize(projectName);
    let scopeName = null;
    if (/^@.*\/.*/.test(options.name)) {
      const [scope, name] = options.name.split('/');
      scopeName = scope.replace(/^@/, '');
      options.name = name;
    }

    const workspace = await getWorkspace(host);
    const newProjectRoot = workspace.extensions.newProjectRoot as (string | undefined) || '';

    const scopeFolder = scopeName ? strings.dasherize(scopeName) + '/' : '';
    const folderName = `${scopeFolder}${strings.dasherize(options.name)}`;
    const projectRoot = join(normalize(newProjectRoot), folderName);
    const distRoot = `dist/${folderName}`;

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...strings,
        ...options,
        packageName,
        projectRoot,
        distRoot,
        relativePathToWorkspaceRoot: relativePathToWorkspaceRoot(projectRoot),
        folderName,
        startosLatestVersion: Versions.Stratos,
      }),
      move(projectRoot),
    ]);

    const optional = [];
    if (options.includeLoader) {
      optional.push(mergeWith(apply(url('./loader-files'), [ applyTemplates({}), move(`${projectRoot}/loader`)])));
    }
    if (options.includeAssets) {
      optional.push(mergeWith(apply(url('./asset-files'), [ applyTemplates({}), move(`${projectRoot}/assets`)])));
    }

    return chain([
      mergeWith(templateSource),
      ...optional,
      addThemeToWorkspaceFile(options, projectRoot, projectName, distRoot),
    ]);
  };
}

