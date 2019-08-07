import { StratosOrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import {
  EnvVarStratosProject,
} from '../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { GitSCM } from '../../../core/src/shared/data-services/scm/scm';
import { FetchBranchesForProject, FetchCommit, FetchCommits } from '../actions/deploy-applications.actions';
import { FetchGitHubRepoInfo } from '../actions/github.actions';

export const gitRepoActionBuilders = {
  getRepoInfo: (
    projectEnvVars: EnvVarStratosProject
  ) => new FetchGitHubRepoInfo(projectEnvVars)
} as StratosOrchestratedActionBuilders;

export interface GitCommitActionBuilders extends StratosOrchestratedActionBuilders {
  get: (commitSha: string, endpointGuid: string, projectName: string, scm: GitSCM) => FetchCommit;
  getMultiple: (commitSha: string, endpointGuid: string, projectName: string, scm: GitSCM) => FetchCommits;
}

export const gitCommitActionBuilders: GitCommitActionBuilders = {
  get: (
    commitSha: string,
    endpointGuid: string,
    projectName: string,
    scm: GitSCM
  ) => new FetchCommit(scm, commitSha, projectName),
  getMultiple: (
    commitSha: string,
    endpointGuid: string,
    projectName: string,
    scm: GitSCM
  ) => new FetchCommits(scm, commitSha, projectName)
};

export interface GitBranchActionBuilders extends StratosOrchestratedActionBuilders {
  getProjectBranches: (projectName: string, scm: GitSCM) => FetchBranchesForProject;
}

export const gitBranchActionBuilders: GitBranchActionBuilders = {
  getProjectBranches: (
    projectName: string,
    scm: GitSCM
  ) => new FetchBranchesForProject(scm, projectName)
};
