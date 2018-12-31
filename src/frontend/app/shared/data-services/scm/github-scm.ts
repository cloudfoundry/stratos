import { GitSCM, SCMIcon } from './scm';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Http } from '@angular/http';
import { GitSCMType } from './scm.service';
import { GitRepo, GitCommit, GitBranch } from '../../../store/types/git.types';

export class GitHubSCM implements GitSCM {

  constructor(public http: Http, public gitHubURL: string) {}

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
    return this.http.get(`${this.gitHubURL}/repos/${projectName}`).pipe(
      map(response => response.json())
    );
  }

  getBranches(projectName: string): Observable<GitBranch[]> {
    return this.http.get(`${this.gitHubURL}/repos/${projectName}/branches`).pipe(
      map(response => response.json())
    );
  }

  getCommit(projectName: string, commitSha: string): Observable<GitCommit> {
    return this.http.get(`${this.gitHubURL}/repos/${projectName}/commits/${commitSha}`).pipe(
      map(response => response.json())
    );
  }

  getCommits(projectName: string, commitSha: string): Observable<GitCommit[]> {
    return this.http.get(`${this.gitHubURL}/repos/${projectName}/commits?sha=${commitSha}`).pipe(
      map(response => response.json())
    );
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

}
