import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { getGitHubAPIURL } from '../../../../../core/src/core/github.helpers';
import { GitBranch, GitCommit, GitRepo } from '../../../store/types/git.types';
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

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}/branches/${branchName}`) as Observable<GitBranch>;
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}/branches`) as Observable<GitBranch[]>;
  }

  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit> {
    return httpClient.get<GitCommit>(this.getCommitApiUrl(projectName, commitSha)) as Observable<GitCommit>;
  }

  getCommitApiUrl(projectName: string, commitSha: string) {
    return `${this.gitHubURL}/repos/${projectName}/commits/${commitSha}`;
  }

  getCommits(httpClient: HttpClient, projectName: string, ref: string): Observable<GitCommit[]> {
    return httpClient.get(`${this.gitHubURL}/repos/${projectName}/commits?sha=${ref}`) as Observable<GitCommit[]>;
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
    const prjParts = projectName.split('/');
    let url = `${this.gitHubURL}/search/repositories?q=${projectName}+in:name+fork:true`;
    if (prjParts.length > 1) {
      url = `${this.gitHubURL}/search/repositories?q=${prjParts[1]}+in:name+fork:true+user:${prjParts[0]}`;
    }
    return httpClient.get(url).pipe(
      filter((repos: any) => !!repos.items),
      map(repos => {
        return repos.items.map(item => item.full_name);
      })
    );
  }

}
