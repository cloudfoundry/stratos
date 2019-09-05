import { RequestOptions } from '@angular/http';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction, RequestEntityLocation } from '../../../store/src/types/request.types';
import {
  appEnvVarsEntityType,
  applicationEntityType,
  appStatsEntityType,
  appSummaryEntityType,
  cfEntityFactory,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';

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
    this.paginationKey = createEntityRelationPaginationKey(applicationEntityType, guid);
  }
  entity = [cfEntityFactory(appStatsEntityType)];
  entityType = appStatsEntityType;
  actions = [
    '[App Metadata] Stats start',
    '[App Metadata] Stats success',
    '[App Metadata] Stats failed',
  ];
  flattenPagination = false;
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
    this.paginationKey = createEntityRelationPaginationKey(applicationEntityType, guid);
  }
  entity = [cfEntityFactory(appEnvVarsEntityType)];
  entityType = appEnvVarsEntityType;
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
  entity = [cfEntityFactory(appSummaryEntityType)];
  entityType = appSummaryEntityType;
  paginationKey: string;
  actions = [
    '[App Metadata] Summary start',
    '[App Metadata] Summary success',
    '[App Metadata] Summary failed',
  ];
}
