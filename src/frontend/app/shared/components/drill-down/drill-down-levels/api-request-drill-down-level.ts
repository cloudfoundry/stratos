import { APIResource } from './../../../../store/types/api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginatedAction } from '../../../../store/types/pagination.types';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';
import { DrillDownLevel } from '../drill-down.component';
import { SetPage } from '../../../../store/actions/pagination.actions';
import { PageEvent } from '@angular/material';

type getApiDrillDownAction<T> = (parent?: T, allAncestors?: any[]) => PaginatedAction;
interface IApiRequestDrillDownLevelConfig<T = any> {
  getAction: getApiDrillDownAction<T>;
  title?: string;
  entityNameParam: string;
  getViewLink: (entity?: T, allAncestors?: any[]) => string;
}
export class ApiRequestDrillDownLevel implements DrillDownLevel<APIResource, APIResource> {
  private getAction: getApiDrillDownAction<APIResource>;
  private entityNameParam: string;
  public title: string;
  public getViewLink: (entity: APIResource, allAncestors?: any[]) => string;

  public getItemName = (entity: APIResource) => entity.entity[this.entityNameParam];

  public request = (parent?, allAncestors?) => {
    const action = this.getAction(parent, allAncestors);
    const { paginationKey, entityKey } = action;
    const schema = entityFactory(entityKey);
    const monitor = new PaginationMonitor(this.store, paginationKey, schema);
    const page = (pageEvent: PageEvent) => this.store.dispatch(new SetPage(
      entityKey, paginationKey, pageEvent.pageIndex + 1
    ));
    return {
      data$: this.getPagination(this.store, action, monitor).entities$,
      state$: monitor.currentPageRequestState$,
      pagination: {
        state$: monitor.pagination$,
        page
      }
    };
  }

  private getPagination(store: Store<AppState>, action: PaginatedAction, paginationMonitor: PaginationMonitor) {
    return getPaginationObservables({
      store,
      action,
      paginationMonitor
    });
  }

  constructor(private store: Store<AppState>, config: IApiRequestDrillDownLevelConfig) {
    const { getAction, title } = config;
    this.title = title;
    this.getAction = getAction;
    this.entityNameParam = config.entityNameParam;
    this.getViewLink = config.getViewLink;
  }

}
