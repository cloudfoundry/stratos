import { RequestOptions } from '@angular/http';

import { appEnvVarsSchemaKey, appStatsSchemaKey, appSummarySchemaKey, entityFactory } from '../helpers/entity-factory';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction, RequestEntityLocation } from '../types/request.types';
import { getPaginationKey } from './pagination.actions';

export enum AppMetadataTypes {
  STATS,
  ENV_VARS,
  SUMMARY
}

export class GetAppStatsAction extends CFStartAction implements PaginatedAction, ICFAction {
  options: RequestOptions;
  paginationKey: string;
  constructor(
    public guid: string,
    public endpointGuid: string
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/stats`,
      method: 'get'
    });
    this.paginationKey = getPaginationKey(this.entityKey, endpointGuid, guid);
  }
  entity = [entityFactory(appStatsSchemaKey)];
  entityKey = appStatsSchemaKey;
  actions = [
    '[App Metadata] Stats start',
    '[App Metadata] Stats success',
    '[App Metadata] Stats failed',
  ];
  flattenPagination: false;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'index',
  };
  entityLocation = RequestEntityLocation.ARRAY;
}

export class GetAppEnvVarsAction extends CFStartAction implements PaginatedAction, ICFAction {
  options: RequestOptions;
  paginationKey: string;
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/env`,
      method: 'get'
    });
    this.paginationKey = getPaginationKey(this.entityKey, endpointGuid, guid);
  }
  entity = [entityFactory(appEnvVarsSchemaKey)];
  entityKey = appEnvVarsSchemaKey;
  actions = [
    '[App Metadata] EnvVars start',
    '[App Metadata] EnvVars success',
    '[App Metadata] EnvVars failed',
  ];
  flattenPagination: false;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}

export class GetAppSummaryAction extends CFStartAction implements ICFAction {
  options: RequestOptions;
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) {
    super();
    this.options = new RequestOptions({
      url: `apps/${guid}/summary`,
      method: 'get'
    });
  }
  entity = [entityFactory(appSummarySchemaKey)];
  entityKey = appSummarySchemaKey;
  paginationKey: string;
  actions = [
    '[App Metadata] Summary start',
    '[App Metadata] Summary success',
    '[App Metadata] Summary failed',
  ];
}
