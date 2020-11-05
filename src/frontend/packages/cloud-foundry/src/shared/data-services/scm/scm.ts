import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GitCommit, GitRepo } from '../../../store/types/git.types';
import { GitSCMType } from './scm.service';

export interface SCMIcon {
  iconName: string;
  fontName: string;
}

// Interface that a Git SCM provider must implement
export interface GitSCM {
  getType(): GitSCMType;
  getLabel(): string;
  getIcon(): SCMIcon;
  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo>;
  getRepositoryApiUrl(projectName: string): string;
  // getBranch(httpClient: HttpClient, projectName: string, branchId: string): Observable<GitBranch>;
  getBranchApiUrl(projectName: string, branchId: string): string;
  // getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]>;
  getBranchesApiUrl(projectName: string): string;
  // getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit>;
  convertCommit(projectName: string, commit: any): GitCommit;
  // getCommits(httpClient: HttpClient, projectName: string, ref: string): Observable<GitCommit[]>;
  getCommitsApiUrl(projectName: string, ref: string): string;
  getCloneURL(projectName: string): string;
  getCommitURL(projectName: string, commitSha: string): string;
  getCommitApiUrl(projectName: string, commitSha: string): string;
  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): string;
  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]>;
}
