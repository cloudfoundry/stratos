import {
  SET_APP_SOURCE_SUB_TYPE,
  PROJECT_EXISTS,
  PROJECT_DOESNT_EXIST,
  CHECK_PROJECT_EXISTS,
  FETCH_BRANCHES_FOR_PROJECT,
  SAVE_APP_DETAILS,
  DELETE_CACHED_BRANCHES,
  SET_DEPLOY_CF_SETTINGS,
  SET_APP_SOURCE_DETAILS,
  DELETE_DEPLOY_APP_SECTION,
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
      const sourceType = { ...state.applicationSource.type, subType: action.subType.id};
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
    case DELETE_DEPLOY_APP_SECTION:
      return defaultState;
    default:
      return state;
  }
}

