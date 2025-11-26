import { compose } from '@ngrx/store';

import type { CFAppState } from '../../cf-app-state';
import type { DeployApplicationSource, DeployApplicationState, ProjectExists } from '../types/deploy-application.types';

export const selectDeployAppState = (state: CFAppState) => {
  return state.deployApplication;
};

export const getApplicationSource = (state: DeployApplicationState) => state.applicationSource;
export const getSourceType = (state: DeployApplicationSource) => state?.type;
export const getGitProjectName = (state: DeployApplicationSource) => state?.gitDetails?.projectName;
export const getGitProjectExists = (state: DeployApplicationState) => state?.projectExists;
export const getGitCommit = (state: DeployApplicationSource) => state?.gitDetails?.commit;
export const getGitBranch = (state: DeployApplicationSource) => state?.gitDetails?.branch;
export const getGitDeployBranchName = (state: DeployApplicationSource) => state?.gitDetails?.branchName;
export const getCFDetails = (state: DeployApplicationState) => state?.cloudFoundryDetails;
export const getProjectName = (state: ProjectExists) => state?.name;

export const selectSourceType = compose(
  getSourceType,
  getApplicationSource,
  selectDeployAppState
);
export const selectApplicationSource = compose(
  getApplicationSource,
  selectDeployAppState
);

export const selectProjectName = compose(
  getGitProjectName,
  getApplicationSource,
  selectDeployAppState
);

export const selectProjectExists = compose(
  getGitProjectExists,
  selectDeployAppState
);

export const selectNewProjectCommit = compose(
  getGitCommit,
  getApplicationSource,
  selectDeployAppState
);

export const selectNewProjectBranch = compose(
  getGitBranch,
  getApplicationSource,
  selectDeployAppState
);

export const selectCfDetails = compose(
  getCFDetails,
  selectDeployAppState
);

export const selectDeployBranchName = compose(
  getGitDeployBranchName,
  getApplicationSource,
  selectDeployAppState
);

export const selectPEProjectName = compose(
  getProjectName,
  getGitProjectExists,
  selectDeployAppState
);
