import { Component, HostBinding, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import {
  CfAppVariablesDataSource,
  ListAppEnvVar,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import {
  CfAppVariablesListConfigService,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../../../store/app-state';
import { ApplicationService } from '../../../../application.service';
import { ListDataSource } from '../../../../../../shared/components/list/data-sources-controllers/list-data-source';

export interface VariableTabAllEnvVarType {
  name: string;
  value: string;
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
    private store: Store<AppState>,
    private appService: ApplicationService,
    private listConfig: ListConfig<ListAppEnvVar>
  ) {
    this.envVarsDataSource = listConfig.getDataSource();
  }

  envVars$: Observable<{
    names: String[],
    values: {}
  }>;

  envVarsDataSource: ListDataSource<ListAppEnvVar, ListAppEnvVar>;
  allEnvVars$: Observable<VariableTabAllEnvVarType[] | any[]>;

  ngOnInit() {
    this.envVars$ = this.appService.waitForAppEntity$.map(app => ({
      names: app.entity.entity.environment_json ? Object.keys(app.entity.entity.environment_json) : [],
      values: app.entity.entity.environment_json || {}
    }));
    this.allEnvVars$ = this.appService.appEnvVars.entities$.pipe(
      map(allEnvVars => {
        if (!allEnvVars || !allEnvVars.length || !allEnvVars[0] || !allEnvVars[0].entity) {
          return [];
        }
        const result = new Array<VariableTabAllEnvVarType>();

        Object.keys(allEnvVars[0].entity).forEach(envVarType => {
          if (envVarType === 'cfGuid') {
            return;
          }
          const envVars = allEnvVars[0].entity[envVarType];
          Object.keys(envVars).forEach(key => {
            result.push({
              name: key,
              value: envVars[key]
            });
          });
        });
        return result;
      })
    );
  }

  isObject(test: any): boolean {
    return typeof test === 'object';
  }

}
