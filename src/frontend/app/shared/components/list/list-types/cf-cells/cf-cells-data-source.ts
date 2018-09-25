// import { Store } from '@ngrx/store';

// import { IFeatureFlag } from '../../../../../core/cf-api.types';
// import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
// import { AppState } from '../../../../../store/app-state';
// import { entityFactory, featureFlagSchemaKey } from '../../../../../store/helpers/entity-factory';
// import { APIResource } from '../../../../../store/types/api.types';
// import { ListDataSource } from '../../data-sources-controllers/list-data-source';
// import { IListConfig } from '../../list.component.types';
// import { createCfFeatureFlagFetchAction } from './cf-feature-flags-data-source.helpers';

// export class CfFeatureFlagsDataSource extends ListDataSource<APIResource<IFeatureFlag>> {
//   constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource<IFeatureFlag>>) {
//     const action = createCfFeatureFlagFetchAction(cfGuid);
//     super({
//       store,
//       action,
//       schema: entityFactory(featureFlagSchemaKey),
//       getRowUniqueId: getRowMetadata,
//       paginationKey: action.paginationKey,
//       isLocal: true,
//       transformEntities: [{ type: 'filter', field: 'entity.name' }],
//       listConfig
//     });
//   }
// }
