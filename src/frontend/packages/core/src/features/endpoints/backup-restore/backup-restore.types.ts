import { EndpointModel } from '../../../../../store/src/types/endpoint.types';

export enum BackupEndpointTypes {
  ENDPOINT = 'endpoint',
  CONNECT = 'connect',
}

export enum BackupEndpointConnectionTypes {
  NONE = 'NONE',
  CURRENT = 'CURRENT',
  ALL = 'ALL'
}

export interface BackupEndpointsConfig<T> {
  [endpointId: string]: T;
}

export interface BaseEndpointConfig {
  [BackupEndpointTypes.ENDPOINT]: boolean;
  [BackupEndpointTypes.CONNECT]: BackupEndpointConnectionTypes;
}

export interface BackupEndpointConfigUI extends BaseEndpointConfig {
  entity: EndpointModel;
}
