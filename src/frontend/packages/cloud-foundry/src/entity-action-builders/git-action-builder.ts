import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GitSCM } from '../../../core/src/shared/data-services/scm/scm';
import { FetchBranchesForProject, FetchCommit, FetchCommits } from '../actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../actions/github.actions';
import {
  EnvVarStratosProject,
} from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

export const gitRepoActionBuilders = {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => new FetchGitHubRepoInfo(projectEnvVars)
} as OrchestratedActionBuilders;

export interface GitCommitActionBuilders extends OrchestratedActionBuilders {
  get: (commitSha: string, projectName: string, scm: GitSCM) => FetchCommit;
  getAll: (commitSha: string, projectName: string, scm: GitSCM) => FetchCommits;
}

export const gitCommitActionBuilders: GitCommitActionBuilders = {
  get: (
    commitSha: string,
    projectName: string,
    scm: GitSCM
  ) => new FetchCommit(scm, commitSha, projectName),
  getAll: (
    commitSha: string,
    projectName: string,
    scm: GitSCM
  ) => new FetchCommits(scm, commitSha, projectName)
};

export interface GitBranchActionBuilders extends OrchestratedActionBuilders {
  getProjectBranches: (projectName: string, scm: GitSCM) => FetchBranchesForProject;
}

export const gitBranchActionBuilders: GitBranchActionBuilders = {
  getProjectBranches: (
    projectName: string,
    scm: GitSCM
  ) => new FetchBranchesForProject(scm, projectName)
};
