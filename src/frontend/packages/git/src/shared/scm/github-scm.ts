import { HttpClient } from '@angular/common/http';
import { flattenPagination } from '@stratosui/store';
import { Observable } from 'rxjs';
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
import { BaseSCM, GitApiRequest } from './scm-base';
import { GitSCMType } from './scm.service';

export class GitHubSCM extends BaseSCM implements GitSCM {

  constructor(gitHubURL: string, endpointGuid: string) {
    super(gitHubURL || getGitHubAPIURL());
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

  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    return this.getAPI().pipe(
      switchMap(api => httpClient.get<GitRepo>(`${api.url}/repos/${projectName}`, api.requestArgs))
    );
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    return this.getAPI().pipe(
      switchMap(api => httpClient.get<GitBranch>(`${api.url}/repos/${projectName}/branches/${branchName}`, api.requestArgs))
    );
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    return this.getAPI().pipe(
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
    return this.getAPI().pipe(
      map(api => ({
        ...api,
        url: `${api.url}/repos/${projectName}/commits/${commitSha}`,
      }))
    );
  }

  getCommits(httpClient: HttpClient, projectName: string, ref: string): Observable<GitCommit[]> {
    return this.getAPI().pipe(
      switchMap(api => httpClient.get<GitCommit[]>(
        `${api.url}/repos/${projectName}/commits?sha=${ref}`, {
        ...api.requestArgs,
        params: {
          [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
        }
      }))
    );

  }

  // TODO: RC fix - these are links are web addresses... shouldn't use api urls... need to fetch using api.
  // fetch project/commit.. get url from there
  getCloneURL(projectName: string): Observable<string> {
    const prjNameEncoded = encodeURIComponent(projectName);// TODO: RC understand - this should be used??
    return this.getAPI().pipe(
      map(api => `https://github.com/${projectName}`)
    );
  }

  getCommitURL(projectName: string, commitSha: string): Observable<string> {
    const prjNameEncoded = encodeURIComponent(projectName);// TODO: RC understand - this should be used??
    return this.getAPI().pipe(
      map(api => `https://github.com/${projectName}/commit/${commitSha}`)
    );
  }

  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): Observable<string> {
    const prjNameEncoded = encodeURIComponent(projectName);// TODO: RC understand - this should be used??
    return this.getAPI().pipe(
      map(api => `https://github.com/${projectName}/compare/${commitSha1}...${commitSha2}`)
    );
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]> {
    return this.getAPI().pipe(
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
      map(repos => {
        return repos.map(item => item.full_name);
      })
    );
  }

  public convertCommit(api: string, projectName: string, commit: any): GitCommit {
    return commit;
  }

  parseErrorAsString(error: any): string {
    // TODO: RC improve - handle permissions errors
    const message = super.parseErrorAsString(error);
    return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
      'Git ' + message.substring(0, message.indexOf('(')) :
      'Git request failed';
  }
}
