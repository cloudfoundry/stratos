import { ListDataSource } from "../../data-sources-controllers/list-data-source";
import { APIResource } from "../../../../../store/types/api.types";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../store/app-state";
import { IListConfig } from "../../list.component.types";
import { getPaginationKey } from "../../../../../store/actions/pagination.actions";
import { FetchAllBuildpacks, BuildpackSchema } from "../../../../../store/actions/buildpack.action";

export class CfBuildpacksDataSource extends ListDataSource<APIResource> {
    constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
      const paginationKey = getPaginationKey('buidlpacks', cfGuid);
      const action = new FetchAllBuildpacks(cfGuid, paginationKey);
      super({
        store,
        action,
        schema: BuildpackSchema,
        getRowUniqueId: (entity: APIResource) => {
          return entity.metadata ? entity.metadata.guid : null;
        },
        paginationKey,
        isLocal: true,
        transformEntities: [],
        listConfig
      });
    }
  }
  