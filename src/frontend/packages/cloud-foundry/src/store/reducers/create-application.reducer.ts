import {
  CHECK_NAME,
  NAME_FREE,
  NAME_TAKEN,
  SET_CF_DETAILS,
  SET_NAME,
} from '../../actions/create-applications-page.actions';
import { CreateNewApplicationState } from '../types/create-application.types';


const defaultState: CreateNewApplicationState = {
  cloudFoundryDetails: null,
  name: '',
  nameCheck: {
    checking: false,
    available: true,
    name: ''
  }
};

export function createAppReducer(state: CreateNewApplicationState = defaultState, action) {
  switch (action.type) {
    case SET_CF_DETAILS:
      return {
        ...state, cloudFoundryDetails: action.cloudFoundryDetails
      };
    case SET_NAME:
      return {
        ...state, name: action.name
      };
    case CHECK_NAME:
      return {
        ...state, nameCheck: {
          checking: true,
          available: true,
          name: action.name
        }
      };
    case NAME_FREE:
      return {
        ...state, nameCheck: {
          checking: false,
          available: true,
          name: action.name
        }
      };
    case NAME_TAKEN:
      return {
        ...state, nameCheck: {
          checking: false,
          available: false,
          name: action.name
        }
      };
    default:
      return state;
  }
}

