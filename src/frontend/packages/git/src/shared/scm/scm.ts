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
  setEndpointGuid(endpointGuid: string);
  getEndpointGuid(endpointGuid: string): string;
  getType(): GitSCMType;
  getLabel(): string;
  getIcon(): SCMIcon;
  getPublicApiUrl(): string;
  getAPIUrl(endpointGuid: string): Observable<string>;
  getRepository(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<GitRepo>;
  getBranch(httpClient: HttpClient, endpointGuid: string, projectName: string, branchId: string): Observable<GitBranch>;
  getBranches(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<GitBranch[]>;
  getCommit(httpClient: HttpClient, endpointGuid: string, projectName: string, commitSha: string): Observable<GitCommit>;
  convertCommit(apiUrl: string, projectName: string, commit: any): GitCommit;
  getCommits(httpClient: HttpClient, endpointGuid: string, projectName: string, commitSha: string): Observable<GitCommit[]>;
  getCloneURL(endpointGuid: string, projectName: string): Observable<string>;
  getCommitURL(endpointGuid: string, projectName: string, commitSha: string): Observable<string>;
  getCommitApiUrl(endpointGuid: string, projectName: string, commitSha: string): Observable<string>;
  getCompareCommitURL(endpointGuid: string, projectName: string, commitSha1: string, commitSha2: string): Observable<string>;
  getMatchingRepositories(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<string[]>;
  parseErrorString(error: any, message: string): string;
}

export interface GitMeta {
  projectName: string;
  scm: GitSCM; // FIXME: Remove from action, see #4245
  commitSha?: string;
  branchName?: string;
}