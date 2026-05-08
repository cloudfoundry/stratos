import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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

  /** Data source supplied by the legacy ListConfig. Initialized via field
   *  initializer (not the constructor) so subsequent field initializers
   *  that depend on it (e.g. `totalVariables`) can reference it directly. */
  envVarsDataSource: ListDataSource<ListAppEnvVar, ListAppEnvVar> = this.listConfig.getDataSource();
  allEnvVars$!: Observable<VariableTabAllEnvVarType[] | any[]>;

  /** Pass-through of the data source's adding signal for the L5 sub-nav,
   *  which swaps the +Add Variable button for the inline form when true. */
  readonly isAdding: Signal<boolean> = this.envVarsDataSource.isAdding;

  /** Signal: names of user-defined environment variables from the app entity. */
  readonly envVarNames: Signal<string[]> = computed(() => {
    const envJson = this.data.app()?.entity?.environment_json;
    return envJson ? Object.keys(envJson) : [];
  });

  /** Reactive count for the L5 sub-nav. Mirrors what the legacy paginated
   *  list shows in its "X of Y" pager — sourced from the data source's
   *  pagination state, which is the authoritative count of user-defined
   *  env vars after filtering. envVarNames() (used by the input's
   *  [appUnique] validator) reads from the app entity's
   *  environment_json — that field isn't always populated by the legacy
   *  app() adapter, so it can't be used for the count. */
  readonly totalVariables: Signal<number> = toSignal(
    this.envVarsDataSource.pagination$.pipe(
      map(p => p?.totalResults ?? 0),
      startWith(0),
    ),
    { initialValue: 0 },
  );

  /**
   * L5 add action — opens the inline add-row form managed by the legacy
   * `<app-list>`. Trusts the data source's startAdd() to reset state
   * (it calls getEmptyType() to clear addItem). The form's NgModel
   * controls re-bind to the empty addItem when the form re-attaches, so
   * an explicit form.reset() isn't needed and avoids interacting with
   * a previously-disposed NgForm reference.
   */
  readonly addVariableAction: ListSubNavAddAction = {
    label: 'Add Variable',
    icon: 'add',
    invoke: () => this.envVarsDataSource.startAdd(),
  };

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
