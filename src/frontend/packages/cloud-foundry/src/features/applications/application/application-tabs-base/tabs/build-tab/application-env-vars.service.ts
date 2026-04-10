import { Injectable } from '@angular/core';

import { PaginationObservables, APIResource } from '@stratosui/store';
import { OverrideAppDetails } from '../../../../../../store/types/deploy-application.types';
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
  endpointGuid: string;
  branch?: string;
  url?: string;
  commit?: string;
  dockerImage?: string;
  dockerUsername?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationEnvVarsHelper {

  createEnvVarsObs(appGuid: string, cfGuid: string): PaginationObservables<APIResource> {
    return cfEntityCatalog.appEnvVar.store.getPaginationService(appGuid, cfGuid);
  }

  FetchStratosProject(appEnvVars: any): EnvVarStratosProject {
    if (!appEnvVars) {
      return null;
    }
    const stratosProjectString = appEnvVars.environment_json ? appEnvVars.environment_json.STRATOS_PROJECT : null;
    try {
      const res = stratosProjectString ? JSON.parse(stratosProjectString) as EnvVarStratosProject : null;
      return res;
    } catch (_err) {
      // noop
    }
    return null;
  }
}
