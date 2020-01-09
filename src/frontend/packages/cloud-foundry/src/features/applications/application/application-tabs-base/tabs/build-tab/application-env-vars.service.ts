import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { appEnvVarsEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { OverrideAppDetails } from '../../../../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../../store/src/types/pagination.types';


export interface EnvVarStratosProject {
  deploySource: EnvVarStratosProjectSource;
  deployOverrides: OverrideAppDetails;
}

export interface EnvVarStratosProjectSource {
  type: string;
  timestamp: number;
  project?: string;
  scm?: string;
  branch?: string;
  url?: string;
  commit?: string;
  dockerImage?: string;
  dockerUsername?: string;
}

@Injectable()
export class ApplicationEnvVarsHelper {

  constructor(
    private store: Store<CFAppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) { }

  createEnvVarsObs(appGuid: string, cfGuid: string): PaginationObservables<APIResource> {
    const catalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appEnvVarsEntityType);
    const actionBuilder = catalogEntity.actionOrchestrator.getActionBuilder('get');
    const action = actionBuilder(appGuid, cfGuid) as PaginatedAction;
    return getPaginationObservables<APIResource>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        catalogEntity.getSchema()
      )
    }, true);
  }

  FetchStratosProject(appEnvVars): EnvVarStratosProject {
    if (!appEnvVars) {
      return null;
    }
    const stratosProjectString = appEnvVars.environment_json ? appEnvVars.environment_json.STRATOS_PROJECT : null;
    try {
      const res = stratosProjectString ? JSON.parse(stratosProjectString) as EnvVarStratosProject : null;
      return res;
    } catch (err) {
      // noop
    }
    return null;
  }
}
