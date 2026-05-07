import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ViewChild, computed, inject, Signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { CodeBlockComponent } from '../../../../../../../../core/src/shared/components/code-block/code-block.component';
import {
  ListDataSource,
} from '../../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  ListSubNavAddAction,
  ListSubNavComponent,
} from '../../../../../../../../core/src/shared/components/list-sub-nav/list-sub-nav.component';
import { UniqueDirective } from '../../../../../../../../core/src/shared/components/unique.directive';
import { stratosEndpointGuidKey } from '../../../../../../../../store/src/entity-request-pipeline/pipeline.types';
import {
  ListAppEnvVar,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import {
  CfAppVariablesListConfigService,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-list-config.service';
import { ApplicationService } from '../../../../application.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';

export interface VariableTabAllEnvVarType {
  name: string;
  value: string;
  section?: boolean;
}

@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: ListConfig,
    useClass: CfAppVariablesListConfigService,
  }],
  imports: [
    CommonModule,
    FormsModule,
    ListComponent,
    ListSubNavComponent,
    CodeBlockComponent,
    UniqueDirective,
  ]
})
export class VariablesTabComponent implements OnInit {
  private store = inject<Store<CFAppState>>(Store);
  private appService = inject(ApplicationService);
  private data = inject(AppDetailDataService);
  private listConfig = inject<ListConfig<ListAppEnvVar>>(ListConfig);

  /** Reference to the inline add form (template ref var #addForm). Used by
   *  the L5 sub-nav's add action to reset the form before opening it. */
  @ViewChild('addForm') addForm?: NgForm;

  constructor() {
    const listConfig = this.listConfig;

    this.envVarsDataSource = listConfig.getDataSource();
  }

  /** Signal: names of user-defined environment variables from the app entity. */
  readonly envVarNames: Signal<string[]> = computed(() => {
    const envJson = this.data.app()?.entity?.environment_json;
    return envJson ? Object.keys(envJson) : [];
  });

  /** Reactive count for the L5 sub-nav (mirrors envVarNames length). */
  readonly totalVariables: Signal<number> = computed(() => this.envVarNames().length);

  /**
   * L5 add action — opens the inline add-row form managed by the legacy
   * `<app-list>`. Same dispatch the in-toolbar `+` used to do; the legacy
   * button is suppressed via `[suppressAddButton]="true"`.
   */
  readonly addVariableAction: ListSubNavAddAction = {
    label: 'Add Variable',
    icon: 'add',
    invoke: () => {
      this.addForm?.reset();
      this.envVarsDataSource.startAdd();
    },
  };

  envVarsDataSource: ListDataSource<ListAppEnvVar, ListAppEnvVar>;
  allEnvVars$!: Observable<VariableTabAllEnvVarType[] | any[]>;

  ngOnInit() {
    // appEnvVars is the paginator-backed ngrx path for all env var sections —
    // kept on the legacy path intentionally (Task 5 decision).
    this.allEnvVars$ = this.appService.appEnvVars.entities$.pipe(
      map(this.mapEnvVars.bind(this))
    );
  }

  isObject(test: any): boolean {
    return typeof test === 'object';
  }

  private mapEnvVars(allEnvVars: any): VariableTabAllEnvVarType[] {
    if (!allEnvVars || !allEnvVars.length || !allEnvVars[0] || !allEnvVars[0].entity) {
      return [];
    }
    const result = new Array<VariableTabAllEnvVarType>();

    Object.keys(allEnvVars[0].entity).forEach(envVarType => {
      if (envVarType === 'cfGuid' || envVarType === stratosEndpointGuidKey) {
        return;
      }
      const envVars = (allEnvVars[0].entity[envVarType]) ? allEnvVars[0].entity[envVarType] : {};
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
      console.warn('Failed to parse STRATOS_PROJECT env var', err);
    }
    return '';
  }

}
