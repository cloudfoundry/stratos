import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { AppMetadataTypes } from '../actions/app-metadata.actions';
import { AssignRouteToApplication } from '../actions/application-service-routes.actions';
import {
  CreateNewApplication,
  DeleteApplication,
  GetAllApplications,
  GetApplication,
  RestageApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../actions/application.actions';
import { GetAllAppsInSpace } from '../actions/space.actions';
import { IApp } from '../cf-api.types';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ApplicationActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetApplication;
  remove: (guid: string, endpointGuid: string) => DeleteApplication;
  create: (id: string, endpointGuid: string, application: IApp) => CreateNewApplication;
  update: (
    guid: string,
    endpointGuid: string,
    updatedApplication: UpdateApplication,
    existingApplication?: IApp,
    updateEntities?: AppMetadataTypes[]
  ) => UpdateExistingApplication;
  getMultiple: (
    endpointGuid: string,
    paginationKey?: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAllApplications;
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

export const applicationActionBuilder: ApplicationActionBuilders = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
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
  getMultiple: (
    endpointGuid: string,
    paginationKey?: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllApplications(paginationKey, endpointGuid, includeRelations, populateMissing),
  restage: (guid: string, endpointGuid: string) => new RestageApplication(guid, endpointGuid),
  assignRoute: (endpointGuid: string, routeGuid: string, applicationGuid: string) => new AssignRouteToApplication(
    applicationGuid,
    routeGuid,
    endpointGuid
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
};


