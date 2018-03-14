import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState, IRequestEntityTypeState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListConfig, ListViewTypes, IListMultiFilterConfig } from '../../list.component.types';
import { CfServiceCardComponent } from './cf-service-card/cf-service-card.component';
import { CfServicesDataSource } from './cf-services-data-source';
import { EndpointsService } from '../../../../../core/endpoints.service';
import { CfOrgSpaceItem } from '../../../../data-services/cf-org-space-service.service';
import { tap } from 'rxjs/operators';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { endpointsRegisteredEntitiesSelector } from '../../../../../store/selectors/endpoint.selectors';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CfServicesListConfigService implements IListConfig<APIResource> {
  cf: CfOrgSpaceItem;
  isLocal?: boolean;
  viewType = ListViewTypes.CARD_ONLY;
  enableTextFilter = false;
  tableFixedRowHeight?: boolean;
  dataSource: CfServicesDataSource;
  pageSizeOptions = [9, 45, 90];
  cardComponent = CfServiceCardComponent;
  defaultView = 'cards' as ListView;
  multiFilterConfigs: IListMultiFilterConfig[] = [];
  getColumns = () => [];

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private endpointsService: EndpointsService
  ) {
    this.dataSource = new CfServicesDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
    this.cf = {
      list$: this.store
        .select(endpointsRegisteredEntitiesSelector)
        .first()
        .map(endpoints => Object.values(endpoints)),
      loading$: Observable.of(false),
      select: new BehaviorSubject(undefined)
    };

    this.multiFilterConfigs = [
      this.createConfig('cf', 'Cloud Foundry', this.cf),
    ];

  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => this.multiFilterConfigs;
  getDataSource = () => this.dataSource;

  private createConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
    return {
      key: key,
      label: label,
      ...cfOrgSpaceItem,
      list$: cfOrgSpaceItem.list$.map((entities: any[]) => {
        return entities.map(entity => ({
          label: entity.name,
          item: entity,
          value: entity.guid
        }));
      }),
    };
  }
}
