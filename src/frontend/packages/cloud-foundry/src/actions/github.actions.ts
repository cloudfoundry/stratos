import { EntityRequestAction } from '../../../store/src/types/request.types';
import { gitRepoEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { GitMeta } from '../entity-action-builders/git-action-builder';

export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export class FetchGitHubRepoInfo implements EntityRequestAction {
  constructor(public meta: GitMeta) {
    this.guid = this.meta.scm.getType() + '-' + this.meta.projectName;
  }
  type = FETCH_GITHUB_REPO;
  endpointType = CF_ENDPOINT_TYPE;
  entityType = gitRepoEntityType;
  public guid: string;
}
