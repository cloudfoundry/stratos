// import { AppMetadataTypes } from '../actions/app-metadata.actions';
// import { mergeState } from './../helpers/reducer.helper';
// import { AppMetadata } from '../types/app-metadata.types';

// export function appMetadataReducer(state: AppMetadata = {}, action) {
//   switch (action.type) {
//     case AppMetadataTypes.APP_METADATA_SUCCESS:
//       return setAppMetadataState(state, action.metadata, action.appMetadataAction);
//     default:
//       return state;
//   }
// }

// function setAppMetadataState(state, metadata, { metadataType, guid }): AppMetadata {
//   const newState = {
//     [guid]: {
//       [metadataType]: metadata
//     }
//   };
//   return mergeState(state, newState);
// }

