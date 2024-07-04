import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { GitMeta, GitSCM } from '../shared/scm/scm';
import { getBranchGuid, getCommitGuid, getRepositoryGuid, GIT_ENDPOINT_TYPE, gitEntityFactory } from './git-entity-factory';
import {
  FETCH_BRANCH_FAILED,
  FETCH_BRANCH_FOR_PROJECT,
  FETCH_BRANCH_START,
  FETCH_BRANCH_SUCCESS,
  FETCH_BRANCHES_FAILED,
  FETCH_BRANCHES_FOR_PROJECT,
  FETCH_BRANCHES_START,
  FETCH_BRANCHES_SUCCESS,
  FETCH_COMMIT,
  FETCH_COMMITS,
  FETCH_GITHUB_REPO,
  GitCommit,
} from './git.public-types';
import { gitBranchesEntityType, gitCommitEntityType, gitRepoEntityType } from './git.types';

export class FetchBranchForProject implements EntityRequestAction {
  constructor(
    public scm: GitSCM,
    public endpointGuid: string,
    public projectName: string,
    public guid: string,
    public branchName: string
  ) {
    this.guid = getBranchGuid(scm.getType(), projectName, branchName);
  }
  actions = [
    FETCH_BRANCH_START,
    FETCH_BRANCH_SUCCESS,
    FETCH_BRANCH_FAILED
  ];
  public endpointType = GIT_ENDPOINT_TYPE;
  type = FETCH_BRANCH_FOR_PROJECT;
  entityType = gitBranchesEntityType;
  entity = [gitEntityFactory(gitBranchesEntityType)];
}

export class FetchBranchesForProject implements PaginatedAction {
  constructor(
    public scm: GitSCM,
    public endpointGuid: string,
    public projectName: string,
  ) {
    this.paginationKey = FetchBranchesForProject.createPaginationKey(scm, projectName);
  }
  actions = [
    FETCH_BRANCHES_START,
    FETCH_BRANCHES_SUCCESS,
    FETCH_BRANCHES_FAILED
  ];
  public endpointType = GIT_ENDPOINT_TYPE;
  type = FETCH_BRANCHES_FOR_PROJECT;
  entityType = gitBranchesEntityType;
  paginationKey: string;
  flattenPagination = true;
  entity = [gitEntityFactory(gitBranchesEntityType)];

  static createPaginationKey = (scm: GitSCM, projectName: string) => scm.getType() + '--' + projectName;
}

export class FetchCommit implements EntityRequestAction {
  commit: GitCommit;
  public endpointType = GIT_ENDPOINT_TYPE;
  constructor(
    public scm: GitSCM,
    public endpointGuid: string,
    public commitSha: string,
    public projectName: string
  ) {
    this.guid = getCommitGuid(scm.getType(), projectName, commitSha);
  }
  type = FETCH_COMMIT;
  entityType = gitCommitEntityType;
  entity = [gitEntityFactory(gitCommitEntityType)];
  guid: string;
}

export class FetchCommits implements PaginatedAction {

  /**
   * Creates an instance of FetchCommits.
   * @param projectName For example `cloudfoundry-community/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(
    public scm: GitSCM,
    public endpointGuid: string,
    public projectName: string,
    public sha: string
  ) {
    this.paginationKey = scm.getType() + '--' + projectName + '--' + sha;
  }
  actions = [
    '[Deploy App] Fetch commits start',
    '[Deploy App] Fetch commits success',
    '[Deploy App] Fetch commits failed',
  ];
  public endpointType = GIT_ENDPOINT_TYPE;
  type = FETCH_COMMITS;
  entityType = gitCommitEntityType;
  paginationKey: string;
  initialParams = {
    'order-direction': 'asc',
    'order-direction-field': 'date',
  };
  entity = [gitEntityFactory(gitCommitEntityType)];
}

export class FetchGitHubRepoInfo implements EntityRequestAction {
  constructor(
    public meta: GitMeta,
    public endpointGuid: string,
  ) {
    this.guid = getRepositoryGuid(meta.scm.getType(), meta.projectName);
  }
  type = FETCH_GITHUB_REPO;
  endpointType = GIT_ENDPOINT_TYPE;
  entityType = gitRepoEntityType;
  public guid: string;
  entity = [gitEntityFactory(gitRepoEntityType)];
}
