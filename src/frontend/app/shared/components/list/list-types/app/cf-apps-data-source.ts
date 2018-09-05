import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import { debounceTime, distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';

import { DispatchSequencer, DispatchSequencerAction } from '../../../../../core/dispatch-sequencer';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAppStatsAction } from '../../../../../store/actions/app-metadata.actions';
import { GetAllApplications } from '../../../../../store/actions/application.actions';
import { CreatePagination, SetParams } from '../../../../../store/actions/pagination.actions';
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
import { PaginationEntityState, PaginationParam, QParam } from '../../../../../store/types/pagination.types';
import { distinctPageUntilChanged, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ListPaginationMultiFilterChange } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';

export function createGetAllAppAction(paginationKey): GetAllApplications {
  return new GetAllApplications(paginationKey, [
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
  private statsSub: Subscription;
  private subs: Subscription[];
  public action: GetAllApplications;

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

    this.action = action;

    const statsSub = this.page$.pipe(
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
          const dispatching = false;
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
      tag('stat-obs')).subscribe();


    this.subs = [statsSub];
  }

  public setMultiFilter(changes: ListPaginationMultiFilterChange[], params: PaginationParam) {
    if (!changes.length) {
      return;
    }

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
    }, params.q || []);

    params.q = qChanges;
    this.store.dispatch(new SetParams(this.entityKey, this.paginationKey, params, false, true));

  }

}
