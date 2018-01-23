import { compose } from '@ngrx/store';
import { CreateNewApplicationState } from '../types/create-application.types';
import { AppState } from '../app-state';
import { DeployApplicationSource, SourceType, DeployApplicationState } from '../types/deploy-application.types';
import { selectNewAppCFDetails } from './create-application.selectors';
export const selectDeployAppState = (state: AppState) => state.deployApplication;

export const getApplicationSource = (state: DeployApplicationState) => state.applicationSource;
export const getBranches = (state: DeployApplicationSource) => state && state.branches;
export const getSourceType = (state: DeployApplicationSource ) => state && state.type;
export const getSourceSubType = (state: SourceType ) => state && state.subType;
export const getApplicationProjectName = (state: DeployApplicationSource) => state.projectName;
export const getProjectExists = (state: DeployApplicationState) => state.projectExists;
export const getCommit = (state: DeployApplicationSource) => state.commit;
export const selectSourceType = compose(
  getSourceType,
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

export const selectProjectBranches = compose(
  getBranches,
  getApplicationSource,
  selectDeployAppState
);

export const selectNewProjectCommit = compose(
  getCommit,
  getApplicationSource,
  selectDeployAppState
);
