// import { pathGet } from '../../core/utils.service';
// import { FetchRelationAction } from '../actions/relation.actions';
// import {
//   applicationSchemaKey,
//   entityFactory,
//   organisationSchemaKey,
//   routeSchemaKey,
//   routesInAppKey,
//   routesInSpaceKey,
//   spaceSchemaKey,
// } from './entity-factory';
// import { EntityInlineChild, EntityRelation } from './entity-relations.helpers';

// export const appRouteRelationKey = 'app-route-relation';
// export const spaceRouteRelationKey = 'space-route-relation';
// export const orgSpaceRelationKey = 'org-space-relation';


// export const AppRouteRelation: EntityRelation = {
//   key: appRouteRelationKey,
//   parentEntityKey: applicationSchemaKey,
//   childEntity: entityFactory<EntityInlineChild>(routeSchemaKey),
//   createParentWithChild: (state, parentGuid, response) => {
//     const parentEntity = pathGet(`${applicationSchemaKey}.${parentGuid}`, state);
//     const newParentEntity = {
//       ...parentEntity,
//       entity: {
//         ...parentEntity.entity,
//         routes: response.result
//       }
//     };
//     return newParentEntity;
//   },
//   fetchChildrenAction: (url, app) => {// includeRelations, populateMissing
//     return new FetchRelationAction(
//       app.entity.cfGuid,
//       app.metadata.guid,
//       url,
//       [entityFactory<EntityInlineChild>(routesInAppKey)],
//       routeSchemaKey, // TODO: RC applicationSchemaKey??
//       EntityRelation.createPaginationKey(applicationSchemaKey, app.metadata.guid)
//     );
//     // return new GetAppRoutes(
//     //   app.metadata.guid,
//     //   app.entity.cfGuid,
//     //   EntityRelation.createPaginationKey(applicationSchemaKey, app.metadata.guid),
//     //   app.metadata.guid
//     // );
//   },
// };

// export const SpaceRouteRelation: EntityRelation = {
//   key: spaceRouteRelationKey,
//   parentEntityKey: spaceSchemaKey,
//   childEntity: entityFactory(routeSchemaKey),
//   createParentWithChild: (state, parentGuid, response) => {
//     const parentEntity = pathGet(`${spaceSchemaKey}.${parentGuid}`, state);
//     const newParentEntity = {
//       ...parentEntity,
//       entity: {
//         ...parentEntity.entity,
//         routes: response.result
//       }
//     };
//     return newParentEntity;
//   },
//   fetchChildrenAction: (url, space) => {
//     return new FetchRelationAction(
//       space.entity.cfGuid,
//       space.metadata.guid,
//       url,
//       [entityFactory<EntityInlineChild>(routesInSpaceKey)],
//       routeSchemaKey, // TODO: RC routesInSpaceKey??
//       EntityRelation.createPaginationKey(spaceSchemaKey, space.metadata.guid)
//     );
//     // return new GetSpaceRoutes(
//     //   space.metadata.guid,
//     //   space.entity.cfGuid,
//     //   EntityRelation.createPaginationKey(spaceSchemaKey, space.metadata.guid),
//     //   includeRelations,
//     //   populateMissing);
//   },
// };

// export const OrgSpaceRelation: EntityRelation = {
//   key: orgSpaceRelationKey,
//   parentEntityKey: organisationSchemaKey,
//   childEntity: entityFactory(spaceSchemaKey),
//   createParentWithChild: (state, parentGuid, response) => {
//     const parentEntity = pathGet(`${organisationSchemaKey}.${parentGuid}`, state);
//     const newParentEntity = {
//       ...parentEntity,
//       entity: {
//         ...parentEntity.entity,
//         spaces: response.result
//       }
//     };
//     return newParentEntity;
//   },
//   fetchChildrenAction: (url, organisation) => {
//     return new FetchRelationAction(
//       organisation.entity.cfGuid,
//       organisation.metadata.guid,
//       url,
//       [entityFactory<EntityInlineChild>(spaceSchemaKey)],
//       spaceSchemaKey, // TODO: RC routesInSpaceKey??
//       EntityRelation.createPaginationKey(organisationSchemaKey, organisation.metadata.guid)
//     );
//     // return new GetAllOrganisationSpaces(
//     //   EntityRelation.createPaginationKey(organisationSchemaKey, organisation.metadata.guid),
//     //   organisation.metadata.guid,
//     //   organisation.entity.cfGuid,
//     //   includeRelations,
//     //   populateMissing);
//   },
// };

// export function entityRelationFactory(key: string): EntityRelation {
//   switch (key) {
//     case appRouteRelationKey:
//       return AppRouteRelation;
//     case spaceRouteRelationKey:
//       return SpaceRouteRelation;
//     case orgSpaceRelationKey:
//       return OrgSpaceRelation;
//     default:
//       throw new Error(`Unknown entity schema relation type: ${key}`);
//   }
// }
