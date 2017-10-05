import { Injectable } from '@angular/core';

export interface ApplicationEnvVars {
  staging_env_json?: any;
  running_env_json?: any;
  environment_json?: {
    STRATOS_PROJECT?: any;
  };
  system_env_json?: any;
  credentials?: any;
  syslog_drain_url?: any;
  volume_mounts?: any;
  label?: string;
  provider?: string;
  plan?: string;
  name?: string;
  tags?: string[];
}

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
    // const envVars: ApplicationEnvVars = JSON.parse(appEnvVars);
    const stratosProjectString = appEnvVars.environment_json ? appEnvVars.environment_json.STRATOS_PROJECT : null;
    const res = stratosProjectString ? JSON.parse(stratosProjectString) as EnvVarStratosProject : null;
    return res;
  }
}
