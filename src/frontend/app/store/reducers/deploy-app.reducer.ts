import {
  CHECK_PROJECT_EXISTS,
  DELETE_DEPLOY_APP_SECTION,
  FETCH_BRANCHES_FOR_PROJECT,
  PROJECT_DOESNT_EXIST,
  PROJECT_EXISTS,
  SAVE_APP_DETAILS,
  SAVE_APP_OVERRIDE_DETAILS,
  SET_APP_SOURCE_DETAILS,
  SET_BRANCH,
  SET_DEPLOY_BRANCH,
  SET_DEPLOY_CF_SETTINGS,
  SET_DEPLOY_COMMIT,
  PROJECT_FETCH_FAILED,
} from '../actions/deploy-applications.actions';
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

export function deployAppReducer(state: DeployApplicationState = defaultState, action) {
  switch (action.type) {
    case SET_APP_SOURCE_DETAILS:
      return {
        ...state, applicationSource: { ...state.applicationSource, type: action.sourceType }
      };
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
    case FETCH_BRANCHES_FOR_PROJECT:
      return {
        ...state, applicationSource:
          {
            ...state.applicationSource, branches: {
              fetching: true,
              success: false,
              data: null
            }
          }
      };
    case SAVE_APP_DETAILS:
      return {
        ...state, applicationSource:
          { ...state.applicationSource, ...action.appDetails }
      };
    case SAVE_APP_OVERRIDE_DETAILS:
      return {
        ...state, applicationOverrides: { ...action.appOverrideDetails }
      };
    case SET_BRANCH:
      return {
        ...state, applicationSource:
          { ...state.applicationSource, ...{ branch: action.branch } }
      };
    case SET_DEPLOY_BRANCH:
      return {
        ...state, applicationSource:
          { ...state.applicationSource, ...{ branchName: action.branch } }
      };
    case SET_DEPLOY_COMMIT:
      return {
        ...state, applicationSource:
          { ...state.applicationSource, ...{ commit: action.commit } }
      };
    case DELETE_DEPLOY_APP_SECTION:
      return defaultState;
    default:
      return state;
  }
}

