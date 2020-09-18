import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
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
    listConfig: IListConfig<ListAppEnvVar>,
  ) {
    const getAppEnvVarsAction = cfEntityCatalog.appEnvVar.actions.getMultiple(appService.appGuid, appService.cfGuid);

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
    cfEntityCatalog.appEnvVar.api.addNewToApplication(this.appGuid, this.cfGuid, this.transformedEntities, this.addItem);

    super.saveAdd();
  }

  startEdit(row: ListAppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    cfEntityCatalog.appEnvVar.api.editInApplication(this.appGuid, this.cfGuid, this.transformedEntities, this.editRow);

    super.saveEdit();
  }

}
