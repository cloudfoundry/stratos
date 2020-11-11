import { HttpClient } from '@angular/common/http';
import { flattenPagination } from '@stratosui/store';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { GitBranch, GitCommit, GitRepo } from '../../store/git.public-types';
import { getGitHubAPIURL } from '../github.helpers';
import {
  GITHUB_PER_PAGE_PARAM,
  GITHUB_PER_PAGE_PARAM_VALUE,
  GithubFlattenerForArrayPaginationConfig,
  GithubFlattenerPaginationConfig,
} from './github-pagination.helper';
import { GitSCM, SCMIcon } from './scm';
import { BaseSCM } from './scm-base';
import { GitSCMType } from './scm.service';

export class GitHubSCM extends BaseSCM implements GitSCM {

  constructor(public gitHubURL: string, endpointGuid: string) {
    super();
    this.gitHubURL = this.gitHubURL || getGitHubAPIURL();
    this.endpointGuid = endpointGuid;
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

  getPublicApiUrl(): string {
    return this.gitHubURL;
  }

  getAPIUrl(): Observable<{
    url: string,
    requestArgs:
  }> {
    // TODO: RC
    // If endpoint has user.... return jetstream url and cnsi-list in header... otherwise endpoint url... otherwise if no endpoint public
    if (this.endpointGuid) {
      return of(this.getPublicApiUrl());
    }
    return this.getEndpoint(this.endpointGuid).pipe(
      map(endpoint => {
        if (endpoint.user) {

        }
      }),
      map(getFullEndpointApiUrl),
      tap(url => { console.log('getAPIUrl: ', url); })
    );
    return super.getAPIUrl() || of(this.getPublicApiUrl());
  }

  // 'x-cap-cnsi-list': cfGuid
  // const requestArgs  = { headers: { 'x-cap-cnsi-list': endpoint !== stratosMonocularEndpointGuid ? endpoint :'' } };


  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => httpClient.get<GitRepo>(`${apiUrl}/repos/${projectName}`))
    );
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => httpClient.get<GitBranch>(`${apiUrl}/repos/${projectName}/branches/${branchName}`))
    );
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => {
        const url = `${apiUrl}/repos/${projectName}/branches`;
        const config = new GithubFlattenerForArrayPaginationConfig<GitBranch>(httpClient, url);
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
    return this.getCommitApiUrl(projectName, commitSha).pipe(
      switchMap(commitUrl => httpClient.get<GitCommit>(commitUrl))
    );
  }

  getCommitApiUrl(projectName: string, commitSha: string) {
    return this.getAPIUrl().pipe(
      map(apiUrl => `${apiUrl}/repos/${projectName}/commits/${commitSha}`)
    );
  }

  getCommits(httpClient: HttpClient, projectName: string, ref: string): Observable<GitCommit[]> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => httpClient.get<GitCommit[]>(
        `${apiUrl}/repos/${projectName}/commits?sha=${ref}`, {
        params: {
          [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
        }
      }))
    );

  }

  // TODO: RC these are links to sites... shouldn't use api urls
  getCloneURL(projectName: string): Observable<string> {
    return this.getAPIUrl().pipe(
      map(apiUrl => `https://github.com/${projectName}`)
    );
  }

  getCommitURL(projectName: string, commitSha: string): Observable<string> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => `https://github.com/${projectName}/commit/${commitSha}`)
    );
  }

  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): Observable<string> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => `https://github.com/${projectName}/compare/${commitSha1}...${commitSha2}`)
    );
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]> {
    return this.getAPIUrl().pipe(
      switchMap(apiUrl => {
        const prjParts = projectName.split('/');
        let url = `${apiUrl}/search/repositories?q=${projectName}+in:name+fork:true`;
        if (prjParts.length > 1) {
          url = `${apiUrl}/search/repositories?q=${prjParts[1]}+in:name+fork:true+user:${prjParts[0]}`;
        }

        const config = new GithubFlattenerPaginationConfig<GitRepo>(httpClient, url);
        const firstRequest = config.fetch(...config.buildFetchParams(1));
        return flattenPagination(
          null,
          firstRequest,
          config
        );
      }),
      map(repos => {
        return repos.map(item => item.full_name);
      })
    );
  }

  public convertCommit(apiUrl: string, projectName: string, commit: any): GitCommit {
    return commit;
  }

  parseErrorAsString(error: any): string {
    // TODO: RC test
    const message = super.parseErrorAsString(error);
    return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
      'Git ' + message.substring(0, message.indexOf('(')) :
      'Git request failed';
  }
}
