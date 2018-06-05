import { Component, OnInit } from '@angular/core';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import { APIResource } from '../../../store/types/api.types';
import { IServiceBinding, IService } from '../../../core/cf-api-svc.types';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { AppMonitorComponentTypes } from '../../../shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { DeleteServiceBinding } from '../../../store/actions/service-bindings.actions';
import { ActivatedRoute } from '@angular/router';
import { BindingPipe } from '@angular/compiler';
import { ServiceActionHelperService } from '../../../shared/data-services/service-action-helper.service';
import { RouterNav } from '../../../store/actions/router.actions';
import {
  serviceBindingSchemaKey,
} from '../../../store/helpers/entity-factory';
@Component({
  selector: 'app-detach-service-instance',
  templateUrl: './detach-service-instance.component.html',
  styleUrls: ['./detach-service-instance.component.scss']
})
export class DetachServiceInstanceComponent {

  cfGuid: string;
  selectedBindings: APIResource<IServiceBinding>[];
  deleteStarted: boolean;
  serviceBindingSchemaKey = serviceBindingSchemaKey;
  public confirmColumns: ITableColumn<APIResource<IServiceBinding>>[] = [
    {
      headerCell: () => 'Name',
      columnId: 'name',
      cellDefinition: {
        getValue: row => row.entity.app.entity.name,
        getLink: row => `/applications/${row.entity.app.metadata.guid}`,
        newTab: true,
      },
      cellFlex: '0 0 200px'
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
    private store: Store<AppState>,
    private datePipe: DatePipe,
    private serviceActionHelperService: ServiceActionHelperService,
    private activatedRoute: ActivatedRoute
  ) {
    this.cfGuid = activatedRoute.snapshot.params.cfId;
  }

  getId = (el: APIResource) => el.metadata.guid;
  setSelectedBindings = (selectedBindings: APIResource<IServiceBinding>[]) => {
    this.selectedBindings = selectedBindings;
    this.selectedBindings$.next(selectedBindings);
  }

  public startDelete = () => {
    this.deleteStarted = true;
    if (this.selectedBindings && this.selectedBindings.length) {
     this.selectedBindings.forEach(binding => {
        this.serviceActionHelperService.detachServiceBinding([binding], binding.entity.service_instance_guid, this.cfGuid, true);
      });
    }
    return Observable.of({success: true});
  }

}
