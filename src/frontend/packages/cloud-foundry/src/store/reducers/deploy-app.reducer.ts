import {
  CHECK_PROJECT_EXISTS,
  DELETE_DEPLOY_APP_SECTION,
  PROJECT_DOESNT_EXIST,
  PROJECT_EXISTS,
  PROJECT_FETCH_FAILED,
  SAVE_APP_DETAILS,
  SAVE_APP_OVERRIDE_DETAILS,
  SaveAppDetails,
  SET_APP_SOURCE_DETAILS,
  SET_BRANCH,
  SET_DEPLOY_BRANCH,
  SET_DEPLOY_CF_SETTINGS,
  SET_DEPLOY_COMMIT,
} from '../../actions/deploy-applications.actions';
import { DeployApplicationState } from '../types/deploy-application.types';

const defaultState: DeployApplicationState = {
  cloudFoundryDetails: null,
  applicationSource: {
    type: null
  },
  applicationOverrides: null,
  projectExists: {
    checking: false,
    exists: false,
    error: false,
    name: ''
  }
};

export function deployAppReducer(state: DeployApplicationState = defaultState, action): DeployApplicationState {
  switch (action.type) {
    case SET_APP_SOURCE_DETAILS:
      return {
        ...state,
        applicationSource: {
          ...state.applicationSource,
          type: action.sourceType
        }
      };
    case SET_DEPLOY_CF_SETTINGS:
      return {
        ...state,
        cloudFoundryDetails: action.cloudFoundryDetails
      };
    case CHECK_PROJECT_EXISTS:
      return {
        ...state,
        projectExists: {
          checking: true,
          exists: false,
          name: action.projectName,
          error: false
        }
      };
    case PROJECT_EXISTS:
      return {
        ...state,
        projectExists: {
          checking: false,
          exists: true,
          name: action.projectName,
          data: action.projectData,
          error: false,
        }
      };
    case PROJECT_DOESNT_EXIST:
      return {
        ...state, projectExists: {
          checking: false,
          exists: false,
          name: action.projectName,
          error: false,
          data: null
        }
      };
    case PROJECT_FETCH_FAILED:
      return {
        ...state, projectExists: {
          checking: false,
          exists: false,
          name: action.projectName,
          error: true,
          data: action.error
        }
      };
    case SAVE_APP_DETAILS:
      const saveAppDetails = action as SaveAppDetails;
      return {
        ...state,
        applicationSource: {
          ...state.applicationSource,
          gitDetails: saveAppDetails.git || state.applicationSource.gitDetails,
          dockerDetails: saveAppDetails.docker || state.applicationSource.dockerDetails,
        }
      };
    case SAVE_APP_OVERRIDE_DETAILS:
      return {
        ...state,
        applicationOverrides: {
          ...action.appOverrideDetails
        }
      };
    case SET_BRANCH:
      return {
        ...state,
        applicationSource: {
          ...state.applicationSource,
          gitDetails: {
            ...state.applicationSource.gitDetails,
            branch: action.branch
          }
        }
      };
    case SET_DEPLOY_BRANCH:
      return {
        ...state,
        applicationSource: {
          ...state.applicationSource,
          gitDetails: {
            ...state.applicationSource.gitDetails,
            branchName: action.branch
          }
        }
      };
    case SET_DEPLOY_COMMIT:
      return {
        ...state,
        applicationSource: {
          ...state.applicationSource,
          gitDetails: {
            ...state.applicationSource.gitDetails,
            commit: action.commit
          }
        }
      };
    case DELETE_DEPLOY_APP_SECTION:
      return defaultState;
    default:
      return state;
  }
}

