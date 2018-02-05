import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import {
  CfAppEvnVarsDataSource,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import {
  CfAppVariablesListConfigService,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../../../store/app-state';
import { ApplicationService } from '../../../../application.service';

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
    private listConfig: ListConfig
  ) {
    this.envVarsDataSource = listConfig.getDataSource() as CfAppEvnVarsDataSource;
  }

  envVars$: Observable<{
    names: String[],
    values: {}
  }>;
  envVarsDataSource: CfAppEvnVarsDataSource;

  ngOnInit() {
    this.envVars$ = this.appService.waitForAppEntity$.map(app => ({
      names: app.entity.entity.environment_json ? Object.keys(app.entity.entity.environment_json) : [],
      values: app.entity.entity.environment_json || {}
    }));
  }

}
