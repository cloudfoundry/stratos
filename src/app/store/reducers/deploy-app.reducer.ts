import {
  ,
  SET_APP_SOURCE_SUB_TYPE,
  PROJECT_EXISTS,
  PROJECT_DOESNT_EXIST,
  CHECK_PROJECT_EXISTS,
  SAVE_BRANCHES_FOR_PROJECT,
  FETCH_BRANCHES_FOR_PROJECT,
  FAILED_TO_FETCH_BRANCHES,
  SAVE_APP_DETAILS,
  DELETE_CACHED_BRANCHES,
  SAVE_COMMIT,
  SET_DEPLOY_CF_SETTINGS,
  SET_APP_SOURCE_DETAILS,
} from '../actions/deploy-applications.actions';
import { DeployApplicationState } from '../types/deploy-application.types';


const defaultState: DeployApplicationState = {
  cloudFoundryDetails: null,
  applicationSource: null,
  projectExists: null
};

export function deployAppReducer(state: DeployApplicationState = defaultState, action) {
  switch (action.type) {
    case SET_APP_SOURCE_DETAILS:
      return {
        ...state, applicationSource: action.applicationSource, projectExists: {checking: false, exists: false, name: ''}
      };
    case SET_APP_SOURCE_SUB_TYPE:
      const sourceType = { ...state.applicationSource.type, subType: action.subType};
      const appSource = { ...state.applicationSource, type: sourceType};
      return { ...state, applicationSource: appSource};
    case SET_DEPLOY_CF_SETTINGS:
        return {
          ...state, cloudFoundryDetails: action.cloudFoundryDetails
        };
    case CHECK_PROJECT_EXISTS:
      return {
        ...state, projectExists: {
          checking: true,
          exists: false,
          name: action.projectName
        }
      };
    case PROJECT_EXISTS:
      return {
        ...state, projectExists: {
          checking: false,
          exists: true,
          name: action.projectName,
          data: action.projectData
        }
      };
    case PROJECT_DOESNT_EXIST:
      return {
        ...state, projectExists: {
          checking: false,
          exists: false,
          name: action.projectName
        }
      };
    case SAVE_BRANCHES_FOR_PROJECT:
        return {
          ...state, applicationSource:
          { ...state.applicationSource, branches: {
            fetching: false,
            success: true,
            data: action.branches
          }}
        };
    case FAILED_TO_FETCH_BRANCHES || DELETE_CACHED_BRANCHES:
        return {
          ...state, applicationSource:
          { ...state.applicationSource, branches: {
            fetching: false,
            success: false,
            data: null
          }}
        };
    case FETCH_BRANCHES_FOR_PROJECT:
      return {
        ...state, applicationSource:
        { ...state.applicationSource, branches: {
          fetching: true,
          success: false,
          data: null
        }}
      };
    case SAVE_APP_DETAILS:
      return {
        ...state, applicationSource:
        { ...state.applicationSource, ...action.appDetails}
      };
    case SAVE_COMMIT:
      return {
        ...state, applicationSource:
        { ...state.applicationSource, commit: action.commitData}
      };
    default:
      return state;
  }
}

