import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { LoggerService } from '../../../../../../../../core/src/core/logger.service';
import {
  ListDataSource,
} from '../../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  ListAppEnvVar,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import {
  CfAppVariablesListConfigService,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-list-config.service';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { ApplicationService } from '../../../../application.service';
import { stratosEndpointGuidKey } from '../../../../../../../../store/src/entity-request-pipeline/pipeline.types';

export interface VariableTabAllEnvVarType {
  name: string;
  value: string;
  section?: boolean;
}

@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppVariablesListConfigService,
  }]
})
export class VariablesTabComponent implements OnInit {

  constructor(
    private store: Store<CFAppState>,
    private appService: ApplicationService,
    private listConfig: ListConfig<ListAppEnvVar>,
    private loggerService: LoggerService
  ) {
    this.envVarsDataSource = listConfig.getDataSource();
  }

  envVars$: Observable<{
    names: string[],
    values: {}
  }>;

  envVarsDataSource: ListDataSource<ListAppEnvVar, ListAppEnvVar>;
  allEnvVars$: Observable<VariableTabAllEnvVarType[] | any[]>;

  ngOnInit() {
    this.envVars$ = this.appService.waitForAppEntity$.pipe(map(app => ({
      names: app.entity.entity.environment_json ? Object.keys(app.entity.entity.environment_json) : [],
      values: app.entity.entity.environment_json || {}
    })));
    this.allEnvVars$ = this.appService.appEnvVars.entities$.pipe(
      map(this.mapEnvVars.bind(this))
    );
  }

  isObject(test: any): boolean {
    return typeof test === 'object';
  }

  private mapEnvVars(allEnvVars): VariableTabAllEnvVarType[] {
    if (!allEnvVars || !allEnvVars.length || !allEnvVars[0] || !allEnvVars[0].entity) {
      return [];
    }
    const result = new Array<VariableTabAllEnvVarType>();

    Object.keys(allEnvVars[0].entity).forEach(envVarType => {
      if (envVarType === 'cfGuid' || envVarType === stratosEndpointGuidKey) {
        return;
      }
      const envVars = allEnvVars[0].entity[envVarType];
      result.push({
        section: true,
        name: envVarType.replace('_json', ''),
        value: ''
      });
      Object.keys(envVars).forEach(key => {
        result.push({
          name: key,
          value: key === 'STRATOS_PROJECT' ? this.parseStratosProject(envVars[key]) : envVars[key]
        });
      });
    });
    return result;
  }

  private parseStratosProject(value: string): object | string {
    try {
      return JSON.parse(value);
    } catch (err) {
      this.loggerService.debug('Failed to parse STRATOS_PROJECT env var', err);
    }
    return '';
  }

}
