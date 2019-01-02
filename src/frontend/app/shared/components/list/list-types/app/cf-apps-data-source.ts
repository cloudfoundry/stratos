import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import { debounceTime, distinctUntilChanged, map, withLatestFrom, filter, switchMap } from 'rxjs/operators';

import { DispatchSequencer, DispatchSequencerAction } from '../../../../../core/dispatch-sequencer';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAppStatsAction } from '../../../../../store/actions/app-metadata.actions';
import { GetAllApplications } from '../../../../../store/actions/application.actions';
import { CreatePagination, ResetPagination, SetParams } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  organizationSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { spreadPaginationParams } from '../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectPaginationState } from '../../../../../store/selectors/pagination.selectors';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationEntityState, PaginationParam, QParam } from '../../../../../store/types/pagination.types';
import { distinctPageUntilChanged, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ListPaginationMultiFilterChange } from '../../data-sources-controllers/list-data-source-types';
import { valueOrCommonFalsy } from '../../data-sources-controllers/list-pagination-controller';
import { IListConfig } from '../../list.component.types';

export function createGetAllAppAction(paginationKey): GetAllApplications {
  return new GetAllApplications(paginationKey, null, [
    createEntityRelationKey(applicationSchemaKey, spaceSchemaKey),
    createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
    createEntityRelationKey(applicationSchemaKey, routeSchemaKey),
  ]);
}

export const cfOrgSpaceFilter = (entities: APIResource[], paginationState: PaginationEntityState) => {
  // Filter by cf/org/space
  const cfGuid = paginationState.clientPagination.filter.items['cf'];
  const orgGuid = paginationState.clientPagination.filter.items['org'];
  const spaceGuid = paginationState.clientPagination.filter.items['space'];
  return entities.filter(e => {
    const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
    const validOrg = !(orgGuid && orgGuid !== e.entity.space.entity.organization_guid);
    const validSpace = !(spaceGuid && spaceGuid !== e.entity.space_guid);
    return validCF && validOrg && validSpace;
  });
};

export class CfAppsDataSource extends ListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';
  private subs: Subscription[];
  public action: GetAllApplications;
  public initialised$: Observable<boolean>;


  constructor(
    store: Store<AppState>,
    listConfig?: IListConfig<APIResource>,
    transformEntities?: any[],
    paginationKey = CfAppsDataSource.paginationKey,
    seedPaginationKey = CfAppsDataSource.paginationKey,
  ) {
    const syncNeeded = paginationKey !== seedPaginationKey;
    const action = createGetAllAppAction(paginationKey);

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

    // Reapply the cf guid to the action. Normally this is done via reapplying the selection to the filter... however this is too slow
    // for maxedResult world
    this.initialised$ = store.select(selectPaginationState(action.entityKey, action.paginationKey)).pipe(
      map(pagination => {
        if (pagination && pagination.clientPagination) {
          action.endpointGuid = pagination.clientPagination.filter.items.cf;
        }
        return true;
      })
    );

    this.action = action;

    const statsSub = this.maxedResults$.pipe(
      filter(maxedResults => !maxedResults),
      switchMap(() => this.page$),
      // The page observable will fire often, here we're only interested in updating the stats on actual page changes
      distinctUntilChanged(distinctPageUntilChanged(this)),
      withLatestFrom(this.pagination$),
      // Ensure we keep pagination smooth
      debounceTime(250),
      map(([page, pagination]) => {
        if (!page) {
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
    if (!changes.length) {
      return;
    }

    const startingCfGuid = valueOrCommonFalsy(this.action.endpointGuid);
    const startingOrgGuid = valueOrCommonFalsy(params.q.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const startingSpaceGuid = valueOrCommonFalsy(params.q.find((q: QParam) => q.key === 'space_guid'), {}).value;

    const qChanges = changes.reduce((qs: QParam[], change) => {
      switch (change.key) {
        case 'cf':
          this.action.endpointGuid = change.value;
          this.setQParam(new QParam('organization_guid', '', ' IN '), qs);
          this.setQParam(new QParam('space_guid', '', ' IN '), qs);
          break;
        case 'org':
          this.setQParam(new QParam('organization_guid', change.value, ' IN '), qs);
          break;
        case 'space':
          this.setQParam(new QParam('space_guid', change.value, ' IN '), qs);
          break;
      }
      return qs;
    }, spreadPaginationParams(params).q || []);

    const cfGuidChanged = startingCfGuid !== valueOrCommonFalsy(this.action.endpointGuid);
    const orgChanged = startingOrgGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const spaceChanged = startingSpaceGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'space_guid'), {}).value;

    // Changes of org or space will reset pagination and start a new request. Changes of only cf requires a punt
    if (cfGuidChanged && !orgChanged && !spaceChanged) {
      this.store.dispatch(new ResetPagination(this.entityKey, this.paginationKey));
    } else if (orgChanged || spaceChanged) {
      params.q = qChanges;
      this.store.dispatch(new SetParams(this.entityKey, this.paginationKey, params, false, true));
    }
  }

}
