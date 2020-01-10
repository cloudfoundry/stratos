import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { appEnvVarsEntityType, applicationEntityType } from '../../../../../cf-entity-types';
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
    listConfig: IListConfig<ListAppEnvVar>
  ) {
    const appEnvVarsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appEnvVarsEntityType);
    const actionBuilder = appEnvVarsEntity.actionOrchestrator.getActionBuilder('get');
    const getAppEnvVarsAction = actionBuilder(appService.appGuid, appService.cfGuid) as PaginatedAction;
    super({
      store,
      action: getAppEnvVarsAction,
      schema: cfEntityFactory(appEnvVarsEntityType),
      getRowUniqueId: object => object.name,
      getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: createEntityRelationPaginationKey(applicationEntityType, appService.appGuid),
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const env = variables[0].entity.environment_json;
        const rows = Object.keys(env).map(name => ({ name, value: env[name] }));
        return rows;
      }),
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });

    this.cfGuid = appService.cfGuid;
    this.appGuid = appService.appGuid;
  }

  saveAdd() {
    const appEnvVarsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appEnvVarsEntityType);
    const actionBuilder = appEnvVarsEntity.actionOrchestrator.getActionBuilder('addNewToApplication');
    const appVariablesAddAction = actionBuilder(this.appGuid, this.cfGuid, this.transformedEntities, this.addItem);

    this.store.dispatch(appVariablesAddAction);
    super.saveAdd();
  }

  startEdit(row: ListAppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    const appEnvVarsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appEnvVarsEntityType);
    const actionBuilder = appEnvVarsEntity.actionOrchestrator.getActionBuilder('editInApplication');
    const appVariablesEditAction = actionBuilder(this.appGuid, this.cfGuid, this.transformedEntities, this.editRow);

    this.store.dispatch(appVariablesEditAction);
    super.saveEdit();
  }

}
