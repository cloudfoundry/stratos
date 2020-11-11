import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GitBranch, GitCommit, GitRepo } from '../../store/git.public-types';
import { GitSCMType } from './scm.service';

export interface SCMIcon {
  iconName: string;
  fontName: string;
}

// Interface that a Git SCM provider must implement
export interface GitSCM {
  endpointGuid: string;
  getType(): GitSCMType;
  getLabel(): string;
  getIcon(): SCMIcon;
  getPublicApiUrl(): string;
  getAPIUrl(endpointGuid: string): Observable<string>;
  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo>;
  getBranch(httpClient: HttpClient, projectName: string, branchId: string): Observable<GitBranch>;
  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]>;
  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit>;
  convertCommit(apiUrl: string, projectName: string, commit: any): GitCommit;
  getCommits(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit[]>;
  getCloneURL(projectName: string): Observable<string>;
  getCommitURL(projectName: string, commitSha: string): Observable<string>;
  getCommitApiUrl(projectName: string, commitSha: string): Observable<string>;
  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): Observable<string>;
  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]>;
  parseErrorAsString(error: any): string;
}

export interface GitMeta {
  projectName: string;
  scm: GitSCM; // FIXME: Remove from action, see #4245
  commitSha?: string;
  branchName?: string;
}