import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';
import type { Subscription } from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import { debounceTime, delay, distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';

import type { GetAllApplications } from '../../../../../../../cloud-foundry/src/actions/application.actions';
import type { IApp } from '../../../../../../../cloud-foundry/src/cf-api.types';
import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  organizationEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  DispatchSequencer,
  type DispatchSequencerAction,
  type DataFunction,
  type DataFunctionDefinition,
  distinctPageUntilChanged,
  type ListPaginationMultiFilterChange,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import { CreatePagination } from '../../../../../../../store/src/actions/pagination.actions';
import { MultiActionListEntity } from '../../../../../../../store/src/monitors/pagination-monitor';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { PaginationParam } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { cfOrgSpaceFilter } from '../../../../../features/cf/cf.helpers';
import { CFListDataSource } from '../../../../cf-list-data-source';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';

export class CfAppsDataSource extends CFListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';
  public static includeRelations = [
    createEntityRelationKey(applicationEntityType, spaceEntityType),
    createEntityRelationKey(spaceEntityType, organizationEntityType),
    createEntityRelationKey(applicationEntityType, routeEntityType),
  ];
  private subs: Subscription[];
  public declare action: GetAllApplications;

  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig?: IListConfig<APIResource>,
    transformEntities?: (DataFunction<APIResource> | DataFunctionDefinition)[],
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
      destroy: () => {
        for (const sub of this.subs) {
          sub.unsubscribe();
        }
      }
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
        const actions: DispatchSequencerAction[] = [];
        page.forEach(app => {
          let appResource: APIResource<IApp>;
          if (app instanceof MultiActionListEntity) {
            appResource = app.entity as APIResource<IApp>;
          } else {
            appResource = app as APIResource<IApp>;
          }
          const appEntity = appResource.entity as IApp;
          if (appEntity.state === 'STARTED') {
            actions.push({
              id: appResource.metadata.guid,
              action: cfEntityCatalog.appStats.actions.getMultiple(appResource.metadata.guid, appEntity.cfGuid)
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
