import { schema } from 'normalizr';

import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { GitBranch, GitCommit, GitRepo } from './git.public-types';
import { gitBranchesEntityType, gitCommitEntityType, gitRepoEntityType } from './git.types';

export const GIT_ENDPOINT_TYPE = 'git';

export enum GIT_ENDPOINT_SUB_TYPES {
  GITHUB = 'github',
  GITLAB = 'gitlab',
}

export const getCommitGuid = (scmType: string, projectName: string, sha: string): string => scmType + '--' + projectName + '--' + sha;
export const getRepositoryGuid = (scmType: string, projectName: string): string => scmType + '--' + projectName;
export const getBranchGuid = (scmType: string, projectName: string, brName: string): string => scmType + '--' + projectName + '--' + brName;

const entityCache: {
  [key: string]: EntitySchema;
} = {};

export class GitEntitySchema extends EntitySchema {
  /**
   * @param entityKey As per schema.Entity ctor
   * @param [definition] As per schema.Entity ctor
   * @param [options] As per schema.Entity ctor
   * @param [relationKey] Allows multiple children of the same type within a single parent entity. For instance user with developer
   * spaces, manager spaces, auditor space, etc
   */
  constructor(
    entityKey: string,
    options?: schema.EntityOptions,
    relationKey?: string
  ) {
    super(entityKey, GIT_ENDPOINT_TYPE, {}, options, relationKey);
  }
}

// , { idAttribute: 'entityId' }
const GithubBranchSchema = new GitEntitySchema(gitBranchesEntityType, {
  idAttribute: (branch: GitBranch) => {
    return getCommitGuid(branch.scmType, branch.projectName, branch.name);
  }
});
entityCache[gitBranchesEntityType] = GithubBranchSchema;

const GithubRepoSchema = new GitEntitySchema(gitRepoEntityType, {
  idAttribute: (repo: GitRepo) => {
    return getRepositoryGuid(repo.scmType, repo.projectName);
  }
});
entityCache[gitRepoEntityType] = GithubRepoSchema;

const GithubCommitSchema = new GitEntitySchema(gitCommitEntityType, {
  idAttribute: (commit: GitCommit) => {
    return getCommitGuid(commit.scmType, commit.projectName, commit.sha);
  }
});
entityCache[gitCommitEntityType] = GithubCommitSchema;


export function gitEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
