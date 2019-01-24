import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import { debounceTime, delay, distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';

import { DispatchSequencer, DispatchSequencerAction } from '../../../../../core/dispatch-sequencer';
import { cfOrgSpaceFilter, getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAppStatsAction } from '../../../../../store/actions/app-metadata.actions';
import { GetAllApplications } from '../../../../../store/actions/application.actions';
import { CreatePagination } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  organizationSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationParam } from '../../../../../store/types/pagination.types';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';
import { distinctPageUntilChanged, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ListPaginationMultiFilterChange } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';

export function createGetAllAppAction(paginationKey): GetAllApplications {
  return new GetAllApplications(paginationKey, null, [
    createEntityRelationKey(applicationSchemaKey, spaceSchemaKey),
    createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
    createEntityRelationKey(applicationSchemaKey, routeSchemaKey),
  ]);
}

export class CfAppsDataSource extends ListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';
  private subs: Subscription[];
  public action: GetAllApplications;


  constructor(
    store: Store<AppState>,
    listConfig?: IListConfig<APIResource>,
    transformEntities?: any[],
    paginationKey = CfAppsDataSource.paginationKey,
    seedPaginationKey = CfAppsDataSource.paginationKey,
    startingCfGuid?: string
  ) {
    const syncNeeded = paginationKey !== seedPaginationKey;
    const action = createGetAllAppAction(paginationKey);
    action.endpointGuid = startingCfGuid;

    const dispatchSequencer = new DispatchSequencer(store);

    if (syncNeeded) {
      // We do this here to ensure we sync up with main endpoint table data.
      store.dispatch(new CreatePagination(
        action.entityKey,
        paginationKey,
        seedPaginationKey
      ));
    }

    if (!transformEntities) {
      transformEntities = [{ type: 'filter', field: 'entity.name' }, cfOrgSpaceFilter];
    }

    super({
      store,
      action,
      schema: entityFactory(applicationSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: transformEntities,
      listConfig,
      destroy: () => this.subs.forEach(sub => sub.unsubscribe())
    });

    this.action = action;

    const statsSub = this.page$.pipe(
      // The page observable will fire often, here we're only interested in updating the stats on actual page changes
      distinctUntilChanged(distinctPageUntilChanged(this)),
      // Ensure we keep pagination smooth
      debounceTime(250),
      // Allow maxedResults time to settle - see #3359
      delay(100),
      withLatestFrom(this.maxedResults$),
      map(([page, maxedResults]) => {
        if (!page || maxedResults) {
          return [];
        }
        const actions = new Array<DispatchSequencerAction>();
        page.forEach(app => {
          const appState = app.entity.state;
          const appGuid = app.metadata.guid;
          const cfGuid = app.entity.cfGuid;
          if (appState === 'STARTED') {
            actions.push({
              id: appGuid,
              action: new GetAppStatsAction(appGuid, cfGuid)
            });
          }
        });
        return actions;
      }),
      dispatchSequencer.sequence.bind(dispatchSequencer),
      tag('stat-obs')
    ).subscribe();

    this.subs = [statsSub];
  }

  public setMultiFilter(changes: ListPaginationMultiFilterChange[], params: PaginationParam) {
    return createCfOrSpaceMultipleFilterFn(this.store, this.action, this.setQParam)
      (changes, params);
  }

}
