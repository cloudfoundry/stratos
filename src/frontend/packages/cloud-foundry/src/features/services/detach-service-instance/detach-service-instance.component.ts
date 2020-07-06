import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, ReplaySubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { serviceBindingEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import {
  ServiceActionHelperService,
} from '../../../../../cloud-foundry/src/shared/data-services/service-action-helper.service';
import {
  AppMonitorComponentTypes,
} from '../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../../../cf-types';

@Component({
  selector: 'app-detach-service-instance',
  templateUrl: './detach-service-instance.component.html',
  styleUrls: ['./detach-service-instance.component.scss']
})
export class DetachServiceInstanceComponent {

  title$: Observable<string>;
  cfGuid: string;
  selectedBindings: APIResource<IServiceBinding>[];
  deleteStarted: boolean;
  public siBindingCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceBindingEntityType);

  public confirmColumns: ITableColumn<APIResource<IServiceBinding>>[] = [
    {
      headerCell: () => 'Name',
      columnId: 'name',
      cellDefinition: {
        getValue: row => row.entity.app.entity.name,
        getLink: row => `/applications/${row.entity.app.metadata.guid}`,
        newTab: true,
      },
    },
    {
      columnId: 'creation',
      headerCell: () => 'Binding Date',
      cellDefinition: {
        getValue: (row: APIResource) => this.datePipe.transform(row.metadata.created_at, 'medium')
      }
    }
  ];

  deletingState = AppMonitorComponentTypes.DELETE;

  public selectedBindings$ = new ReplaySubject<APIResource<IServiceBinding>[]>(1);

  constructor(
    private store: Store<CFAppState>,
    private datePipe: DatePipe,
    private serviceActionHelperService: ServiceActionHelperService,
    activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activatedRoute.snapshot.params.endpointId;
    const serviceInstanceId = activatedRoute.snapshot.params.serviceInstanceId;
    this.title$ = cfEntityCatalog.serviceInstance.store.getEntityService(serviceInstanceId, this.cfGuid).waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => `Unbind apps from '${o.entity.entity.name}'`),
    );
  }

  getId = (el: APIResource) => el.metadata.guid;
  setSelectedBindings = (selectedBindings: APIResource<IServiceBinding>[]) => {
    this.selectedBindings = selectedBindings;
    this.selectedBindings$.next(selectedBindings);
  }

  public startDelete = () => {

    if (this.deleteStarted) {
      return this.store.dispatch(new RouterNav({ path: '/services' }));
    }
    this.deleteStarted = true;
    if (this.selectedBindings && this.selectedBindings.length) {
      this.selectedBindings.forEach(binding => {
        this.serviceActionHelperService.detachServiceBinding([binding], binding.entity.service_instance_guid, this.cfGuid, true);
      });
    }
    return observableOf({ success: true });
  }

}
