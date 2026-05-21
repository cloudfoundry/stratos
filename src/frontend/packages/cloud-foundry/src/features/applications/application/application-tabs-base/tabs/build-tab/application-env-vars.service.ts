import { Injectable } from '@angular/core';

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
  endpointGuid: string;
  branch?: string;
  url?: string;
  commit?: string;
  dockerImage?: string;
  dockerUsername?: string;
}

/**
 * Helper around the STRATOS_PROJECT env var that Stratos itself writes when
 * deploying an app. Pure parser — the data fetch lives on whatever data
 * service the consumer already holds (AppDetailDataService.envVars for the
 * app detail page; a direct HTTP GET in the deploy wizard's redeploy path).
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationEnvVarsHelper {

  FetchStratosProject(environment: Record<string, string> | undefined | null): EnvVarStratosProject | null {
    if (!environment) {
      return null;
    }
    const stratosProjectString = environment.STRATOS_PROJECT;
    if (!stratosProjectString) {
      return null;
    }
    try {
      return JSON.parse(stratosProjectString) as EnvVarStratosProject;
    } catch (_err) {
      return null;
    }
  }
}
