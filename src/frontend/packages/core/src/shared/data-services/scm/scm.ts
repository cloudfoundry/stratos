import { Observable } from 'rxjs';

import { GitBranch, GitCommit, GitRepo } from '../../../../../cloud-foundry/src/store/types/git.types';
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
  getRepository(projectName: string): Observable<GitRepo>;
  getBranches(projectName: string): Observable<GitBranch[]>;
  getCommit(projectName: string, commitSha: string): Observable<GitCommit>;
  getCommits(projectName: string, commitSha: string): Observable<GitCommit[]>;
  getCloneURL(projectName: string): string;
  getCommitURL(projectName: string, commitSha: string): string;
  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): string;
  getMatchingRepositories(projectName: string): Observable<string[]>;
}
