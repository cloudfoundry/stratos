import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { isServiceInstance } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import {
  TableCellServiceInstanceTagsComponent,
} from '../../../../../../../cloud-foundry/src/shared/components/list/list-types/cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import { IServiceBinding } from '../../../../../../../core/src/core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../core/src/core/current-user-permissions.service';
import {
  DataFunctionDefinition,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IGlobalListAction, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { AppServiceBindingCardComponent } from './app-service-binding-card/app-service-binding-card.component';
import { AppServiceBindingDataSource } from './app-service-binding-data-source';

@Injectable()
export class AppServiceBindingListConfigService extends BaseCfListConfig<APIResource<IServiceBinding>> {
  dataSource: AppServiceBindingDataSource;
  cardComponent = AppServiceBindingCardComponent;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;

  private listActionAdd: IGlobalListAction<APIResource<IServiceBinding>> = {
    action: () => {
      this.store.dispatch(new RouterNav({ path: ['applications', this.appService.cfGuid, this.appService.appGuid, 'bind'] }));
    },
    icon: 'add',
    label: 'Add',
    description: 'Bind Service Instance',
    visible$: this.appService.waitForAppEntity$.pipe(
      switchMap(app => this.currentUserPermissionsService.can(
        CurrentUserPermissions.SERVICE_INSTANCE_CREATE,
        this.appService.cfGuid,
        app.entity.entity.space_guid
      ))
    )
  };

  getColumns = () => {
    return [
      {
        columnId: 'name',
        headerCell: () => 'Service Instances',
        cellDefinition: {
          getValue: (row) => row.entity.service_instance.entity.name
        },
        cellFlex: '2'
      },
      {
        columnId: 'service',
        headerCell: () => 'Service',
        cellDefinition: {
          getValue: (row: APIResource<IServiceBinding>) => {
            const si = isServiceInstance(row.entity.service_instance.entity);
            return si ? si.service.entity.label : 'User Service';
          }
        },
        cellFlex: '1'
      },
      {
        columnId: 'servicePlan',
        headerCell: () => 'Plan',
        cellDefinition: {
          getValue: (row: APIResource<IServiceBinding>) => {
            const si = isServiceInstance(row.entity.service_instance.entity);
            return si ? si.service_plan.entity.name : null;
          }
        },
        cellFlex: '1'
      },
      {
        columnId: 'tags',
        headerCell: () => 'Tags',
        cellComponent: TableCellServiceInstanceTagsComponent,
        cellFlex: '2'
      },
      {
        columnId: 'creation', headerCell: () => 'Binding Date',
        cellDefinition: {
          getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
        },
        sort: {
          type: 'sort',
          orderKey: 'creation',
          field: 'metadata.created_at'
        } as DataFunctionDefinition,
        cellFlex: '2'
      }
    ];
  }


  constructor(
    private store: Store<CFAppState>,
    private appService: ApplicationService,
    private datePipe: DatePipe,
    protected currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super();
    this.dataSource = new AppServiceBindingDataSource(this.store, appService, this);
  }

  getGlobalActions = () => [this.listActionAdd];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getDataSource = () => this.dataSource;
}
