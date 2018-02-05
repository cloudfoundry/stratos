import { Injectable } from '@angular/core';

export interface EnvVarStratosProject {
  deploySource: EnvVarStratosProjectSource;
}

export interface EnvVarStratosProjectSource {
  type: string;
  timestamp: number;
  project?: string;
  branch?: string;
  url?: string;
  commit?: string;
}

@Injectable()
export class ApplicationEnvVarsService {

  constructor() { }

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
