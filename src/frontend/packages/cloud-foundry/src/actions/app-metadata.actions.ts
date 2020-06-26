import { HttpRequest } from '@angular/common/http';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { appEnvVarsEntityType, applicationEntityType, appStatsEntityType, appSummaryEntityType } from '../cf-entity-types';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export enum AppMetadataTypes {
  STATS,
  ENV_VARS,
  SUMMARY
}

export class GetAppStatsAction extends CFStartAction implements PaginatedAction, ICFAction {
  options: HttpRequest<any>;
  paginationKey: string;
  constructor(
    public guid: string,
    public endpointGuid: string
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `apps/${guid}/stats`
    );
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
}

export class GetAppEnvVarsAction extends CFStartAction implements PaginatedAction, ICFAction {
  options: HttpRequest<any>;
  paginationKey: string;
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `apps/${guid}/env`,
    );
    this.paginationKey = createEntityRelationPaginationKey(applicationEntityType, guid);
  }
  entity = [cfEntityFactory(appEnvVarsEntityType)];
  entityType = appEnvVarsEntityType;
  actions = [
    '[App Metadata] EnvVars start',
    '[App Metadata] EnvVars success',
    '[App Metadata] EnvVars failed',
  ];
  flattenPagination = false;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}

export class GetAppSummaryAction extends CFStartAction implements ICFAction {
  options: HttpRequest<any>;
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `apps/${guid}/summary`,
    );
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
