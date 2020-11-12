import { HttpClient } from '@angular/common/http';
import { flattenPagination } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getGitHubAPIURL } from '../../../../../core/src/core/github.helpers';
import { GitBranch, GitCommit, GitRepo } from '../../../store/types/git.types';
import {
  GITHUB_PER_PAGE_PARAM,
  GITHUB_PER_PAGE_PARAM_VALUE,
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

  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}`) as Observable<GitRepo>;
  }

  getRepositoryApiUrl(projectName: string): string {
    return `${this.gitHubURL}/repos/${projectName}`;
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}/branches/${branchName}`) as Observable<GitBranch>;
  }

  getBranchApiUrl(projectName: string, branchName: string): string {
    return `${this.gitHubURL}/repos/${projectName}/branches/${branchName}`;
  }

  // getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
  //   const url = `${this.gitHubURL}/repos/${projectName}/branches`;
  //   const config = new GithubFlattenerForArrayPaginationConfig<GitBranch>(httpClient, url);
  //   const firstRequest = config.fetch(...config.buildFetchParams(1));
  //   return flattenPagination(
  //     null,
  //     firstRequest,
  //     config
  //   );
  // }

  getBranchesApiUrl(projectName: string): string {
    // TODO: RC Fix This is broken, flatten pagination is not here, flatten config in entity needs access to header
    return `${this.gitHubURL}/repos/${projectName}/branches`;
  }

  getCommitApiUrl(projectName: string, commitSha: string) {
    return `${this.gitHubURL}/repos/${projectName}/commits/${commitSha}`;
  }

  getCommitsApiUrl(projectName: string, ref: string): string {
    return `${this.gitHubURL}/repos/${projectName}/commits?sha=${ref}&${GITHUB_PER_PAGE_PARAM}=${GITHUB_PER_PAGE_PARAM_VALUE.toString()}`;
  }

  getCloneURL(projectName: string): string {
    return `https://github.com/${projectName}`;
  }

  getCommitURL(projectName: string, commitSha: string): string {
    return `https://github.com/${projectName}/commit/${commitSha}`;
  }

  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): string {
    return `https://github.com/${projectName}/compare/${commitSha1}...${commitSha2}`;
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]> {
    // TODO: RC Fix how to integrate with generics?
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

}
