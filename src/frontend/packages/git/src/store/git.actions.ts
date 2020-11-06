import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { GitMeta, GitSCM } from '../shared/scm/scm';
import { GIT_ENDPOINT_TYPE } from './git-entity-factory';
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


// TODO: RC 1) Add endpoint guid to all of these
// TODO: RC 2) use endpoint guid in scm(?) to get entity from store (for url and type/subtype)
// TODO: RC 3) in scm(?) if subtype is private use proxy to jetstream
// TODO: RC 4) in scm(?) if subtype is public use endpoint url

export class FetchBranchForProject implements EntityRequestAction {
  constructor(public scm: GitSCM, public projectName: string, public guid: string, public branchName: string) {
    this.guid = this.guid || `${scm.getType()}-${this.projectName}-${this.branchName}`;
  }
  actions = [
    FETCH_BRANCH_START,
    FETCH_BRANCH_SUCCESS,
    FETCH_BRANCH_FAILED
  ];
  public endpointType = GIT_ENDPOINT_TYPE;
  type = FETCH_BRANCH_FOR_PROJECT;
  entityType = gitBranchesEntityType;
}

export class FetchBranchesForProject implements PaginatedAction {
  constructor(public scm: GitSCM, public projectName: string) {
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

  static createPaginationKey = (scm: GitSCM, projectName: string) => scm.getType() + ':' + projectName;
}

export class FetchCommit implements EntityRequestAction {
  commit: GitCommit;
  public endpointType = GIT_ENDPOINT_TYPE;
  constructor(public scm: GitSCM, public commitSha: string, public projectName: string) { }
  type = FETCH_COMMIT;
  entityType = gitCommitEntityType;
}

export class FetchCommits implements PaginatedAction {

  /**
   * Creates an instance of FetchCommits.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(public scm: GitSCM, public projectName: string, public sha: string) {
    this.paginationKey = scm.getType() + projectName + sha;
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
}

export class FetchGitHubRepoInfo implements EntityRequestAction {
  constructor(public meta: GitMeta) {
    this.guid = this.meta.scm.getType() + '-' + this.meta.projectName;
  }
  type = FETCH_GITHUB_REPO;
  endpointType = GIT_ENDPOINT_TYPE;
  entityType = gitRepoEntityType;
  public guid: string;
}