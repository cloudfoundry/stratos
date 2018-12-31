import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { GetAppEnvVarsAction } from '../../../../../../store/actions/app-metadata.actions';
import { AppState } from '../../../../../../store/app-state';
import { appEnvVarsSchemaKey, entityFactory } from '../../../../../../store/helpers/entity-factory';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/types/api.types';
import { OverrideAppDetails } from '../../../../../../store/types/deploy-application.types';

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
}

@Injectable()
export class ApplicationEnvVarsHelper {

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }

  createEnvVarsObs(appGuid: string, cfGuid: string): PaginationObservables<APIResource> {
    const action = new GetAppEnvVarsAction(appGuid, cfGuid);
    return getPaginationObservables<APIResource>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appEnvVarsSchemaKey)
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
