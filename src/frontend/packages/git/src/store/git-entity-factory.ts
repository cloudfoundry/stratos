import { schema } from 'normalizr';

import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { gitBranchesEntityType, gitCommitEntityType, gitRepoEntityType } from './git.types';

export const GIT_ENDPOINT_TYPE = 'git';

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

const GithubBranchSchema = new GitEntitySchema(gitBranchesEntityType, { idAttribute: 'entityId' });
entityCache[gitBranchesEntityType] = GithubBranchSchema;

const GithubRepoSchema = new GitEntitySchema(gitRepoEntityType);
entityCache[gitRepoEntityType] = GithubRepoSchema;

const GithubCommitSchema = new GitEntitySchema(gitCommitEntityType, { idAttribute: commit => commit.guid });
entityCache[gitCommitEntityType] = GithubCommitSchema;


export function gitEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
