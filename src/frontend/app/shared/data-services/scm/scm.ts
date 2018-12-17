import { Observable } from 'rxjs';
import { GitSCMType } from './scm.service';
import { GitRepo, GitCommit, GitBranch } from '../../../store/types/git.types';

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
}
