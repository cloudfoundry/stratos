import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { serviceBindingEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import {
  ServiceActionHelperService,
} from '../../../../../cloud-foundry/src/shared/data-services/service-action-helper.service';
import {
  AppMonitorComponentTypes,
  ITableColumn,
  PageHeaderComponent,
  StepComponent,
  SteppersComponent,
} from '@stratosui/core';
import { AppActionMonitorComponent } from '../../../../../core/src/shared/components/app-action-monitor/app-action-monitor.component';
import { RouterNav, entityCatalog, APIResource } from '@stratosui/store';
import { IServiceBinding } from '../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../../../cf-types';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';

@Component({
  selector: 'app-detach-service-instance',
  templateUrl: './detach-service-instance.component.html',
  styleUrls: ['./detach-service-instance.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    DetachAppsComponent,
    AppActionMonitorComponent
  ],
  providers: [DatePipe]
})
export class DetachServiceInstanceComponent {
  private store = inject<Store<CFAppState>>(Store);
  private datePipe = inject(DatePipe);
  private serviceActionHelperService = inject(ServiceActionHelperService);


  title$!: Observable<string>;
  cfGuid!: string;
  selectedBindings!: APIResource<IServiceBinding>[];
  deleteStarted!: boolean;
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

  private _selectedBindings = signal<APIResource<IServiceBinding>[]>([]);
  // Convert signal to Observable for component expecting Observable input
  public selectedBindings$ = toObservable(this._selectedBindings);

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

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
    this._selectedBindings.set(selectedBindings);
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
