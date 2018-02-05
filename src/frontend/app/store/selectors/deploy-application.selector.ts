import { compose } from '@ngrx/store';
import { CreateNewApplicationState } from '../types/create-application.types';
import { AppState } from '../app-state';
import { DeployApplicationSource, SourceType, DeployApplicationState, ProjectExists } from '../types/deploy-application.types';
import { selectNewAppCFDetails } from './create-application.selectors';
export const selectDeployAppState = (state: AppState) => state.deployApplication;

export const getApplicationSource = (state: DeployApplicationState) => state.applicationSource;
export const getSourceType = (state: DeployApplicationSource ) => state && state.type;
export const getSourceSubType = (state: SourceType ) => state && state.subType;
export const getApplicationProjectName = (state: DeployApplicationSource) => state && state.projectName;
export const getProjectExists = (state: DeployApplicationState) => state && state.projectExists;
export const getCommit = (state: DeployApplicationSource) => state && state.commit;
export const getBranch = (state: DeployApplicationSource) => state && state.branch;
export const getDeployBranchName = (state: DeployApplicationSource) => state && state.branchName;
export const getCFDetails = (state: DeployApplicationState) => state && state.cloudFoundryDetails;
export const getProjectName = (state: ProjectExists) => state && state.name;

export const selectSourceType = compose(
  getSourceType,
  getApplicationSource,
  selectDeployAppState
);
export const selectApplicationSource = compose(
  getApplicationSource,
  selectDeployAppState
);

export const selectSourceSubType = compose(
  getSourceSubType,
  getSourceType,
  getApplicationSource,
  selectDeployAppState
);

export const selectProjectName = compose(
  getApplicationProjectName,
  getApplicationSource,
  selectDeployAppState
);

export const selectProjectExists = compose(
  getProjectExists,
  selectDeployAppState
);

export const selectNewProjectCommit = compose(
  getCommit,
  getApplicationSource,
  selectDeployAppState
);

export const selectNewProjectBranch = compose(
  getBranch,
  getApplicationSource,
  selectDeployAppState
);

export const selectCfDetails = compose(
  getCFDetails,
  selectDeployAppState
);

export const selectDeployBranchName = compose(
  getDeployBranchName,
  getApplicationSource,
  selectDeployAppState
);

export const selectPEProjectName = compose(
  getProjectName,
  getProjectExists,
  selectDeployAppState
);
