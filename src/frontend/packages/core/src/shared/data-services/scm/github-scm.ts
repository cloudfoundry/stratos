import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { GitBranch, GitCommit, GitRepo } from '../../../../../cloud-foundry/src/store/types/git.types';
import { GitSCM, SCMIcon } from './scm';
import { GitSCMType } from './scm.service';

export class GitHubSCM implements GitSCM {

  constructor(public httpClient: HttpClient, public gitHubURL: string) { }

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

  getRepository(projectName: string): Observable<GitRepo> {
    return this.httpClient.get(`${this.gitHubURL}/repos/${projectName}`) as Observable<GitRepo>;
  }

  getBranches(projectName: string): Observable<GitBranch[]> {
    return this.httpClient.get(`${this.gitHubURL}/repos/${projectName}/branches`) as Observable<GitBranch[]>;
  }

  getCommit(projectName: string, commitSha: string): Observable<GitCommit> {
    return this.httpClient.get(`${this.gitHubURL}/repos/${projectName}/commits/${commitSha}`) as Observable<GitCommit>;
  }

  getCommits(projectName: string, commitSha: string): Observable<GitCommit[]> {
    return this.httpClient.get(`${this.gitHubURL}/repos/${projectName}/commits?sha=${commitSha}`) as Observable<GitCommit[]>;
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

  getMatchingRepositories(projectName: string): Observable<string[]> {
    const prjParts = projectName.split('/');
    let url = `${this.gitHubURL}/search/repositories?q=${projectName}+in:name+fork:true`;
    if (prjParts.length > 1) {
      url = `${this.gitHubURL}/search/repositories?q=${prjParts[1]}+in:name+fork:true+user:${prjParts[0]}`;
    }
    return this.httpClient.get(url).pipe(
      filter((repos: any) => !!repos.items),
      map(repos => {
        return repos.items.map(item => item.full_name);
      })
    );
  }

}
