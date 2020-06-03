import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';
import { Subscription } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import { debounceTime, delay, distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';

import { GetAllApplications } from '../../../../../../../cloud-foundry/src/actions/application.actions';
import {
  applicationEntityType,
  organizationEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { DispatchSequencer, DispatchSequencerAction } from '../../../../../../../core/src/core/dispatch-sequencer';
import {
  distinctPageUntilChanged,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  ListPaginationMultiFilterChange,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { CreatePagination } from '../../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { MultiActionListEntity } from '../../../../../../../store/src/monitors/pagination-monitor';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationParam } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { cfOrgSpaceFilter } from '../../../../../features/cloud-foundry/cf.helpers';
import { CFListDataSource } from '../../../../cf-list-data-source';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';

export class CfAppsDataSource extends CFListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';
  public static includeRelations = [
    createEntityRelationKey(applicationEntityType, spaceEntityType),
    createEntityRelationKey(spaceEntityType, organizationEntityType),
    createEntityRelationKey(applicationEntityType, routeEntityType),
  ];
  private subs: Subscription[];
  public action: GetAllApplications;

  constructor(
    store: Store<AppState>,
    listConfig?: IListConfig<APIResource>,
    transformEntities?: any[],
    paginationKey = CfAppsDataSource.paginationKey,
    seedPaginationKey = CfAppsDataSource.paginationKey,
    cfGuid?: string
  ) {
    const syncNeeded = paginationKey !== seedPaginationKey;
    const action = cfEntityCatalog.application.actions.getMultiple(cfGuid, CfAppsDataSource.paginationKey, {
      includeRelations: CfAppsDataSource.includeRelations,
    });

    const dispatchSequencer = new DispatchSequencer(store);

    if (syncNeeded) {
      // We do this here to ensure we sync up with main endpoint table data.
      store.dispatch(new CreatePagination(
        action,
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
      schema: cfEntityFactory(applicationEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities,
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
          if (app instanceof MultiActionListEntity) {
            app = app.entity;
          }
          const appState = app.entity.state;
          const appGuid = app.metadata.guid;
          const cfGuid = app.entity.cfGuid;
          if (appState === 'STARTED') {
            actions.push({
              id: appGuid,
              action: cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid)
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
    return createCfOrSpaceMultipleFilterFn(this.store as Store<CFAppState>, this.action, this.setQParam)
      (changes, params);
  }

}
