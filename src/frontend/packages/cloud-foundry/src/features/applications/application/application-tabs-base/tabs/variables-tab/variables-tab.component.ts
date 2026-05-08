import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
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

  /**
   * Validation error for the Name input — populated by validateAndSave()
   * when the user clicks the ✓ button with an invalid Name. Empty string
   * = no error to display. Cleared on every keystroke so the user sees
   * the error disappear as they correct the input.
   *
   * Validation runs on submit, not reactively per-keystroke, to keep the
   * L5 row pixel-stable: error sits in the row's top padding via absolute
   * positioning and only renders after the user attempts to save.
   */
  readonly nameError: WritableSignal<string> = signal('');

  /** CF env var names follow shell-variable convention: must start with a
   *  letter or underscore, and contain only letters, digits, and
   *  underscores. */
  private static readonly NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

  /** Validate the Add Variable form and either save or surface an error
   *  in the absolute-positioned slot above the Name input. */
  validateAndSave(): void {
    const name = (this.envVarsDataSource.addItem?.name ?? '').trim();
    if (!name) {
      this.nameError.set('Name is required');
      return;
    }
    if (!VariablesTabComponent.NAME_PATTERN.test(name)) {
      this.nameError.set('Use letters, digits, and underscores only; must start with a letter or underscore');
      return;
    }
    if (this.envVarNames().includes(name)) {
      this.nameError.set(`'${name}' is already in use`);
      return;
    }
    this.nameError.set('');
    this.envVarsDataSource.saveAdd();
  }

  /** Clear any pending validation error so it doesn't linger as the user
   *  edits. Bound to the Name input's (input) event. */
  clearNameError(): void {
    if (this.nameError()) {
      this.nameError.set('');
    }
  }

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
