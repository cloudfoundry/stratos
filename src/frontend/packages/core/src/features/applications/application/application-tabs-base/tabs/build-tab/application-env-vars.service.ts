import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { OverrideAppDetails } from '../../../../../../../../store/src/types/deploy-application.types';
import { AppState } from '../../../../../../../../store/src/app-state';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import {
  PaginationObservables,
  getPaginationObservables
} from '../../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { GetAppEnvVarsAction } from '../../../../../../../../store/src/actions/app-metadata.actions';
import { entityFactory, appEnvVarsSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';


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
