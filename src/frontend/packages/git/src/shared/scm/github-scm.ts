import { HttpClient } from '@angular/common/http';
import { Injector } from '@angular/core';
import { EndpointsDataService, flattenPagination } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { HttpOptions } from '../../../../core/src/core/core.types';
import { GitBranch, GitCommit, GitRepo } from '../../store/git.public-types';
import { GitSuggestedRepo } from './../../store/git.public-types';
import {
  GITHUB_PER_PAGE_PARAM,
  GITHUB_PER_PAGE_PARAM_VALUE,
  GithubFlattenerForArrayPaginationConfig,
  GithubFlattenerPaginationConfig,
} from './github-pagination.helper';
import { GitSCM, SCMIcon } from './scm';
import { BaseSCM, GitApiRequest } from './scm-base';
import { GitSCMType } from './scm.service';

export class GitHubSCM extends BaseSCM implements GitSCM {

  // Optional per-request options carrying an Authorization header when a PAT
  // has been supplied. Stored on the instance so all downstream API calls
  // (repos, branches, commits, search) pick it up without threading the token
  // through every method signature.
  private options: HttpOptions;

  constructor(
    gitHubURL: string,
    endpointGuid: string,
    accessToken?: string,
    endpointsData?: EndpointsDataService,
    injector?: Injector,
  ) {
    super(gitHubURL);
    this.endpointGuid = endpointGuid;
    this.endpointsData = endpointsData;
    this.injector = injector;
    if (accessToken && accessToken.trim() !== '') {
      this.setAccessToken(accessToken);
    }
  }

  setAccessToken(token: string) {
    this.options = new HttpOptions();
    this.options.headers = { Authorization: `Bearer ${token}` };
  }

  clearAccessToken() {
    if (this.options) {
      this.options.headers = {};
    }
  }

  getType(): GitSCMType {
    return 'github';
  }

  getLabel(): string {
    return 'GitHub';
  }

  getIcon(): SCMIcon {
    return {
      iconName: 'github',
      fontName: 'stratos-icons'
    };
  }

  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    return this.getAPI(this.options).pipe(
      switchMap(api => httpClient.get<GitRepo>(`${api.url}/repos/${projectName}`, api.requestArgs))
    );
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    return this.getAPI(this.options).pipe(
      switchMap(api => httpClient.get<GitBranch>(`${api.url}/repos/${projectName}/branches/${branchName}`, api.requestArgs))
    );
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    return this.getAPI(this.options).pipe(
      switchMap(api => {
        const url = `${api.url}/repos/${projectName}/branches`;
        const config = new GithubFlattenerForArrayPaginationConfig<GitBranch>(httpClient, url, api.requestArgs);
        const firstRequest = config.fetch(...config.buildFetchParams(1));
        return flattenPagination(
          null,
          firstRequest,
          config
        );
      })
    );
  }

  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit> {
    return this.getCommitApi(projectName, commitSha).pipe(
      switchMap(commit => httpClient.get<GitCommit>(commit.url, commit.requestArgs))
    );
  }

  getCommitApi(projectName: string, commitSha: string): Observable<GitApiRequest> {
    return this.getAPI(this.options).pipe(
      map(api => ({
        ...api,
        url: `${api.url}/repos/${projectName}/commits/${commitSha}`,
      }))
    );
  }

  getCommits(httpClient: HttpClient, projectName: string, ref: string): Observable<GitCommit[]> {
    return this.getAPI(this.options).pipe(
      switchMap(api => httpClient.get<GitCommit[]>(
        `${api.url}/repos/${projectName}/commits?sha=${ref}`, {
        ...api.requestArgs,
        params: {
          ...api.requestArgs.params,
          [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
        }
      }))
    );

  }

  getCompareCommitURL(projectUrl: string, commitSha1: string, commitSha2: string): string {
    return `${projectUrl}/compare/${commitSha1}...${commitSha2}`;
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<GitSuggestedRepo[]> {
    return this.getAPI(this.options).pipe(
      switchMap(api => {
        const prjParts = projectName.split('/');
        let url = `${api.url}/search/repositories?q=${projectName}+in:name+fork:true`;
        if (prjParts.length > 1) {
          url = `${api.url}/search/repositories?q=${prjParts[1]}+in:name+fork:true+user:${prjParts[0]}`;
        }

        const config = new GithubFlattenerPaginationConfig<GitRepo>(httpClient, url, api.requestArgs);
        const firstRequest = config.fetch(...config.buildFetchParams(1));
        return flattenPagination(
          null,
          firstRequest,
          config
        );
      }),
      map(repos => repos.map(item => ({ name: item.full_name, private: item.private })))
    );
  }

  public convertCommit(commit: unknown): GitCommit {
    return commit as GitCommit;
  }

  parseErrorAsString(error: unknown): string {
    const message = super.parseErrorAsString(error);
    const errorResponse = error as { status?: number };
    return errorResponse.status === 403 && message.startsWith('API rate limit exceeded for') ?
      'Git ' + message.substring(0, message.indexOf('(')) :
      'Git request failed' + (errorResponse.status ? `(${errorResponse.status})` : '');
  }
}
