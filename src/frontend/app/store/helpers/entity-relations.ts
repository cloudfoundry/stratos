import { pathGet } from '../../core/utils.service';
import { GetAppRoutes } from '../actions/application.actions';
import { GetAllOrganisationSpaces } from '../actions/organisation.actions';
import { GetSpaceRoutes } from '../actions/space.actions';
import {
  applicationSchemaKey,
  entityFactory,
  organisationSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from './entity-factory';
import { EntityInlineChild, EntityRelation } from './entity-relations.helpers';

export const appRouteRelationKey = 'app-route-relation';
export const spaceRouteRelationKey = 'space-route-relation';
export const orgSpaceRelationKey = 'org-space-relation';


export const AppRouteRelation: EntityRelation = {
  key: appRouteRelationKey,
  parentEntityKey: applicationSchemaKey,
  childEntity: entityFactory<EntityInlineChild>(routeSchemaKey),
  createParentWithChild: (state, parentGuid, response) => {
    const parentEntity = pathGet(`${applicationSchemaKey}.${parentGuid}`, state);
    const newParentEntity = {
      ...parentEntity,
      entity: {
        ...parentEntity.entity,
        routes: response.result
      }
    };
    return newParentEntity;
  },
  fetchChildrenAction: (app, includeRelations, populateMissing) => {
    return new GetAppRoutes(
      app.metadata.guid,
      app.entity.cfGuid,
      EntityRelation.createPaginationKey(applicationSchemaKey, app.metadata.guid),
      app.metadata.guid
    );
  },
};

export const SpaceRouteRelation: EntityRelation = {
  key: spaceRouteRelationKey,
  parentEntityKey: spaceSchemaKey,
  childEntity: entityFactory(routeSchemaKey),
  createParentWithChild: (state, parentGuid, response) => {
    const parentEntity = pathGet(`${spaceSchemaKey}.${parentGuid}`, state);
    const newParentEntity = {
      ...parentEntity,
      entity: {
        ...parentEntity.entity,
        routes: response.result
      }
    };
    return newParentEntity;
  },
  fetchChildrenAction: (space, includeRelations, populateMissing) => {
    return new GetSpaceRoutes(
      space.metadata.guid,
      space.entity.cfGuid,
      EntityRelation.createPaginationKey(spaceSchemaKey, space.metadata.guid),
      includeRelations,
      populateMissing);
  },
};

export const OrgSpaceRelation: EntityRelation = {
  key: orgSpaceRelationKey,
  parentEntityKey: organisationSchemaKey,
  childEntity: entityFactory(spaceSchemaKey),
  createParentWithChild: (state, parentGuid, response) => {
    const parentEntity = pathGet(`${organisationSchemaKey}.${parentGuid}`, state);
    const newParentEntity = {
      ...parentEntity,
      entity: {
        ...parentEntity.entity,
        spaces: response.result
      }
    };
    return newParentEntity;
  },
  fetchChildrenAction: (organisation, includeRelations, populateMissing) => {
    return new GetAllOrganisationSpaces(
      EntityRelation.createPaginationKey(organisationSchemaKey, organisation.metadata.guid),
      organisation.metadata.guid,
      organisation.entity.cfGuid,
      includeRelations,
      populateMissing);
  },
};

export function entityRelationFactory(key: string): EntityRelation {
  switch (key) {
    case appRouteRelationKey:
      return AppRouteRelation;
    case spaceRouteRelationKey:
      return SpaceRouteRelation;
    case orgSpaceRelationKey:
      return OrgSpaceRelation;
    default:
      throw new Error(`Unknown entity schema relation type: ${key}`);
  }
}
