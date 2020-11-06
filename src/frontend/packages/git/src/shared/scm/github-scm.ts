import { HttpClient } from '@angular/common/http';
import { flattenPagination } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GitBranch, GitCommit, GitRepo } from '../../store/git.public-types';
import { getGitHubAPIURL } from '../github.helpers';
import {
  GITHUB_PER_PAGE_PARAM,
  GITHUB_PER_PAGE_PARAM_VALUE,
  GithubFlattenerForArrayPaginationConfig,
  GithubFlattenerPaginationConfig,
} from './github-pagination.helper';
import { GitSCM, SCMIcon } from './scm';
import { GitSCMType } from './scm.service';

export class GitHubSCM implements GitSCM {

  constructor(public gitHubURL: string) {
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

  getAPIUrl(): string {
    return this.gitHubURL;
  }

  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}`) as Observable<GitRepo>;
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}/branches/${branchName}`) as Observable<GitBranch>;
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    const url = `${this.gitHubURL}/repos/${projectName}/branches`;
    const config = new GithubFlattenerForArrayPaginationConfig<GitBranch>(httpClient, url);
    const firstRequest = config.fetch(...config.buildFetchParams(1));
    return flattenPagination(
      null,
      firstRequest,
      config
    );
  }

  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit> {
    return httpClient.get<GitCommit>(this.getCommitApiUrl(projectName, commitSha)) as Observable<GitCommit>;
  }

  getCommitApiUrl(projectName: string, commitSha: string) {
    return `${this.gitHubURL}/repos/${projectName}/commits/${commitSha}`;
  }

  getCommits(httpClient: HttpClient, projectName: string, ref: string): Observable<GitCommit[]> {
    return httpClient.get<GitCommit[]>(
      `${this.gitHubURL}/repos/${projectName}/commits?sha=${ref}`, {
      params: {
        [GITHUB_PER_PAGE_PARAM]: GITHUB_PER_PAGE_PARAM_VALUE.toString()
      }
    });
  }

  getCloneURL(projectName: string): string {
    return `https://github.com/${projectName}`; // TODO: RC API VS NON API. What to do for public/private git that isn't github? Another scm?
  }

  getCommitURL(projectName: string, commitSha: string): string {
    return `https://github.com/${projectName}/commit/${commitSha}`;
  }

  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): string {
    return `https://github.com/${projectName}/compare/${commitSha1}...${commitSha2}`;
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]> {
    const prjParts = projectName.split('/');
    let url = `${this.gitHubURL}/search/repositories?q=${projectName}+in:name+fork:true`;
    if (prjParts.length > 1) {
      url = `${this.gitHubURL}/search/repositories?q=${prjParts[1]}+in:name+fork:true+user:${prjParts[0]}`;
    }

    const config = new GithubFlattenerPaginationConfig<GitRepo>(httpClient, url);
    const firstRequest = config.fetch(...config.buildFetchParams(1));
    return flattenPagination(
      null,
      firstRequest,
      config
    ).pipe(
      map(repos => {
        return repos.map(item => item.full_name);
      })
    );
  }

  public convertCommit(projectName: string, commit: any): GitCommit {
    return commit;
  }

  parseErrorString(error: any, message: string): string {
    return error.status === 403 && message.startsWith('API rate limit exceeded for') ?
      'Git ' + message.substring(0, message.indexOf('(')) :
      'Git request failed';
  }
}
