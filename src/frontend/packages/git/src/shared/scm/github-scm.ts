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

  constructor(public gitHubURL: string) {
    super();
    this.gitHubURL = this.gitHubURL || getGitHubAPIURL();
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

  getAPIUrl(endpointGuid: string): Observable<string> {
    return super.getAPIUrl(endpointGuid) || of(this.getPublicApiUrl());
  }

  getRepository(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<GitRepo> {
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => httpClient.get<GitRepo>(`${apiUrl}/repos/${projectName}`))
    );
  }

  getBranch(httpClient: HttpClient, endpointGuid: string, projectName: string, branchName: string): Observable<GitBranch> {
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => httpClient.get<GitBranch>(`${apiUrl}/repos/${projectName}/branches/${branchName}`))
    );
  }

  getBranches(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<GitBranch[]> {
    return this.getAPIUrl(endpointGuid).pipe(
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

  getCommit(httpClient: HttpClient, endpointGuid: string, projectName: string, commitSha: string): Observable<GitCommit> {
    return this.getCommitApiUrl(endpointGuid, projectName, commitSha).pipe(
      switchMap(commitUrl => httpClient.get<GitCommit>(commitUrl))
    );
  }

  getCommitApiUrl(projectName: string, endpointGuid: string, commitSha: string) {
    return this.getAPIUrl(endpointGuid).pipe(
      map(apiUrl => `${apiUrl}/repos/${projectName}/commits/${commitSha}`)
    );
  }

  getCommits(httpClient: HttpClient, endpointGuid: string, projectName: string, ref: string): Observable<GitCommit[]> {
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => httpClient.get<GitCommit[]>(
        `${apiUrl}/repos/${projectName}/commits?sha=${ref}`, {
        params: {
          [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
        }
      }))
    );

  }

  // TODO: RC these are links to sites... shouldn't use api urls
  getCloneURL(endpointGuid: string, projectName: string): Observable<string> {
    return this.getAPIUrl(endpointGuid).pipe(
      map(apiUrl => `https://github.com/${projectName}`)
    );
  }

  getCommitURL(endpointGuid: string, projectName: string, commitSha: string): Observable<string> {
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => `https://github.com/${projectName}/commit/${commitSha}`)
    );
  }

  getCompareCommitURL(endpointGuid: string, projectName: string, commitSha1: string, commitSha2: string): Observable<string> {
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => `https://github.com/${projectName}/compare/${commitSha1}...${commitSha2}`)
    );
  }

  getMatchingRepositories(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<string[]> {
    return this.getAPIUrl(endpointGuid).pipe(
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

  parseErrorString(error: any, message: string): string {
    return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
      'Git ' + message.substring(0, message.indexOf('(')) :
      'Git request failed';
  }
}
