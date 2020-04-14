import { HttpErrorResponse } from '@angular/common/http';

import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { isHttpErrorResponse } from '../../../jetstream.helpers';

// TODO: RC move to types

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

export class BackupRestoreEndpointService {

  createError(err: any): string {
    // TODO: RC tidy. move generic
    const httpResponse: HttpErrorResponse = isHttpErrorResponse(err);
    if (httpResponse) {
      if (httpResponse.error) {
        if (typeof (httpResponse.error) === 'string') {
          return httpResponse.error + ` (${httpResponse.status})`;
        }
        return httpResponse.error.error + ` (${httpResponse.status})`;
      }
      return JSON.stringify(httpResponse.error) + ` (${httpResponse.status})`;
    }
    return err.message;
  }
}
