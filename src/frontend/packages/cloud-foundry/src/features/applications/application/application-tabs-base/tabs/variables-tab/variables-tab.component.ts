import { CommonModule, AsyncPipe, JsonPipe } from '@angular/common';
import { Component, type OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { CodeBlockComponent } from '../../../../../../../../core/src/shared/components/code-block/code-block.component';
import type {
  ListDataSource,
} from '../../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { UniqueDirective } from '../../../../../../../../core/src/shared/components/unique.directive';
import { stratosEndpointGuidKey } from '../../../../../../../../store/src/entity-request-pipeline/pipeline.types';
import type {
  ListAppEnvVar,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import {
  CfAppVariablesListConfigService,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-list-config.service';
import { ApplicationService } from '../../../../application.service';

export interface VariableTabAllEnvVarType {
  name: string;
  value: string | object;
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
    AsyncPipe,
    JsonPipe,
    FormsModule,
    ListComponent,
    CodeBlockComponent,
    UniqueDirective,
  ]
})
export class VariablesTabComponent implements OnInit {

  constructor(_store: Store,
    private appService: ApplicationService,listConfig: ListConfig<ListAppEnvVar>,
  ) {
    this.envVarsDataSource = listConfig.getDataSource();
  }

  envVars$!: Observable<{
    names: string[],
    values: {}
  }>;

  envVarsDataSource: ListDataSource<ListAppEnvVar, ListAppEnvVar>;
  allEnvVars$!: Observable<VariableTabAllEnvVarType[]>;

  ngOnInit() {
    this.envVars$ = this.appService.waitForAppEntity$.pipe(map(app => ({
      names: app.entity.entity.environment_json ? Object.keys(app.entity.entity.environment_json) : [],
      values: app.entity.entity.environment_json || {}
    })));
    this.allEnvVars$ = this.appService.appEnvVars.entities$.pipe(
      map(this.mapEnvVars.bind(this))
    );
  }

  isObject(test: unknown): boolean {
    return typeof test === 'object';
  }

  private mapEnvVars(allEnvVars: unknown): VariableTabAllEnvVarType[] {
    const allEnvVarsTyped = allEnvVars as Array<{ entity: Record<string, Record<string, unknown>> }>;
    if (!allEnvVarsTyped || !allEnvVarsTyped.length || !allEnvVarsTyped[0] || !allEnvVarsTyped[0].entity) {
      return [];
    }
    const result: VariableTabAllEnvVarType[] = [];

    Object.keys(allEnvVarsTyped[0].entity).forEach(envVarType => {
      if (envVarType === 'cfGuid' || envVarType === stratosEndpointGuidKey) {
        return;
      }
      const envVars = (allEnvVarsTyped[0].entity[envVarType]) ? allEnvVarsTyped[0].entity[envVarType] as Record<string, unknown> : {};
      result.push({
        section: true,
        name: envVarType.replace('_json', ''),
        value: ''
      });
      Object.keys(envVars).forEach(key => {
        result.push({
          name: key,
          value: key === 'STRATOS_PROJECT' ? this.parseStratosProject(envVars[key] as string) : (envVars[key] as string)
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
