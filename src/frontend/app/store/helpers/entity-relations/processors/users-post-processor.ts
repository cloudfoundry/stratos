// import { Store } from '@ngrx/store';

// import { APIResponse } from '../../../actions/request.actions';
// import { AppState } from '../../../app-state';
// import { APIResource } from '../../../types/api.types';
// import { IRequestDataState } from '../../../types/entity.types';
// import { IRequestAction } from '../../../types/request.types';
// import { CfUser, CfUserRoleParams } from '../../../types/user.types';
// import { ValidateEntityResult } from '../entity-relations.types';
// import { cfUserSchemaKey } from '../../entity-factory';


// export function validateCfUserRoles(store: Store<AppState>,
//   action: IRequestAction,
//   apiResponse: APIResponse,
//   allEntities: IRequestDataState): ValidateEntityResult {
//   if (!apiResponse) {
//     // Not interested in general validation, only validation during api request
//     return;
//   }
//   const entities = apiResponse.response.entities;
//   const users: { [guid: string]: APIResource<CfUser> } = entities[cfUserSchemaKey];

//   // As we're validating the apiResponse we can just edit the object
//   Object.values(users).forEach(user => {
//     const missingRoles = [];
//     Object.keys(CfUserRoleParams).forEach(roleParam => {
//       if (!user.entity[roleParam]) {
//         missingRoles.push(roleParam);
//       }
//     });
//     user.entity.missingRoles = missingRoles;
//   });

//   // const updatedUsers = Object.values(users).reduce((previous, current, index, values) => {
//   //   const missingRoles = [];
//   //   if (!current.entity.audited_organizations) {
//   //     missingRoles.push('audited_organizations');
//   //   }
//   //   if (missingRoles.length) {
//   //     previous[current.entity.guid] = {
//   //       entity: {
//   //         missingRoles
//   //       }
//   //     };
//   //   }
//   //   return previous;
//   // }, {});

// }
