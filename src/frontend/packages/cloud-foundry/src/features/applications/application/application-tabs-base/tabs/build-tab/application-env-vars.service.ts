import { Injectable } from '@angular/core';

import { OverrideAppDetails } from '../../../../../../../../cloud-foundry/src/store/types/deploy-application.types';
import {
  PaginationObservables,
} from '../../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';


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

  createEnvVarsObs(appGuid: string, cfGuid: string): PaginationObservables<APIResource> {
    return cfEntityCatalog.appEnvVar.store.getPaginationService(appGuid, cfGuid);
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
