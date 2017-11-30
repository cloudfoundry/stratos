// import { WrapperCFActionSuccess } from '../types/request.types';
// import { CfEntitiesState } from '../types/entity.types';
// import { RequestMethod } from '@angular/http';

// import { ApiActionTypes } from './../actions/request.actions';
// import { mergeState } from './../helpers/reducer.helper';


// export const defaultEntitiesState = {
//   application: {},
//   stack: {},
//   space: {},
//   organization: {},
//   route: {},
//   event: {}
// };

// export function entitiesReducer(state: CfEntitiesState = defaultEntitiesState, action: WrapperCFActionSuccess) {
//   const type = action.type;
//   switch (action.type) {
//     case ApiActionTypes.API_REQUEST_SUCCESS:
//       if (action.requestType === 'delete') {
//         const newState = { ...state };
//         delete newState[action.apiAction.entityKey][action.apiAction.guid];
//         return newState;
//       }
//       return mergeState(state, action.response.entities);
//     default:
//       return state;
//   }
// }

