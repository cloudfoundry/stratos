import {
  GetApplication,
  DeleteApplication,
  CreateNewApplication,
  UpdateExistingApplication,
  UpdateApplication,
  RestageApplication,
  GetAllApplications
} from '../actions/application.actions';
import { IApp } from '../../../core/src/core/cf-api.types';
import { AppMetadataTypes } from '../actions/app-metadata.actions';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';
import { AssignRouteToApplication } from '../actions/application-service-routes.actions';
import { GetAllAppsInSpace } from '../actions/space.actions';

export interface ApplicationActionBuilders extends CFOrchestratedActionBuilders {
  restage: (guid: string, endpointGuid: string) => RestageApplication;
  assignRoute: (endpointGuid: string, routeGuid: string, applicationGuid: string) => AssignRouteToApplication;
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
    flattenPagination?: boolean
  ) => GetAllAppsInSpace;
}

export const applicationActionBuilder = {
  get: (
    guid,
    endpointGuid,
    includeRelations = [],
    populateMissing = true
  ) => new GetApplication(guid, endpointGuid, includeRelations, populateMissing),
  remove: (guid: string, endpointGuid: string) => new DeleteApplication(guid, endpointGuid),
  create: (id: string, endpointGuid: string, application: IApp) => new CreateNewApplication(id, endpointGuid, application),
  update: (
    guid: string,
    endpointGuid: string,
    updatedApplication: UpdateApplication,
    existingApplication?: IApp,
    updateEntities?: AppMetadataTypes[]
  ) => new UpdateExistingApplication(guid, endpointGuid, updatedApplication, existingApplication, updateEntities),
  getAll: (
    endpointGuid: string,
    paginationKey: string,
    includeRelations = [],
    populateMissing = false
  ) => new GetAllApplications(paginationKey, endpointGuid, includeRelations, populateMissing),
  restage: (guid: string, endpointGuid: string) => new RestageApplication(guid, endpointGuid),
  assignRoute: (endpointGuid: string, routeGuid: string, applicationGuid: string) => new AssignRouteToApplication(
    endpointGuid,
    routeGuid,
    applicationGuid
  ),
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
    flattenPagination?: boolean
  ) => new GetAllAppsInSpace(
    endpointGuid,
    spaceGuid,
    paginationKey,
    includeRelations,
    populateMissing,
    flattenPagination
  )
} as ApplicationActionBuilders;


