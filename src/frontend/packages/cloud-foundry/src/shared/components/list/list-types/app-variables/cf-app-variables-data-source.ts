import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { IListConfig, ListDataSource } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { appEnvVarsEntityType, applicationEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppEnvVarsState } from '../../../../../store/types/app-metadata.types';

export interface ListAppEnvVar {
  name: string;
  value: string;
}

export class CfAppVariablesDataSource extends ListDataSource<ListAppEnvVar, APIResource<AppEnvVarsState>> {

  public cfGuid: string;
  public appGuid: string;

  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    listConfig: IListConfig<ListAppEnvVar>,
  ) {
    const getAppEnvVarsAction = cfEntityCatalog.appEnvVar.actions.getMultiple(appService.appGuid, appService.cfGuid);

    super({
      store,
      action: getAppEnvVarsAction,
      schema: cfEntityFactory(appEnvVarsEntityType),
      getRowUniqueId: (resource: APIResource<AppEnvVarsState>) => resource?.metadata?.guid ?? 'unknown',
      getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: createEntityRelationPaginationKey(applicationEntityType, appService.appGuid),
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const env: Record<string, any> = (variables[0]?.entity?.environment_json) ? variables[0].entity.environment_json : {};
        const rows = Object.keys(env).map(name => ({ name, value: env[name] as string }));
        return rows;
      }),
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });

    this.cfGuid = appService.cfGuid;
    this.appGuid = appService.appGuid;
  }

  saveAdd(): void {
    cfEntityCatalog.appEnvVar.api.addNewToApplication(this.appGuid, this.cfGuid, this.transformedEntities, this.addItem);

    super.saveAdd();
  }

  startEdit(row: ListAppEnvVar): void {
    super.startEdit({ ...row });
  }

  saveEdit(): void {
    cfEntityCatalog.appEnvVar.api.editInApplication(this.appGuid, this.cfGuid, this.transformedEntities, this.editRow);

    super.saveEdit();
  }

}
