import { Component, OnInit } from '@angular/core';
import { ITableColumn } from '../list/list-table/table.types';
import { APIResource } from '../../../store/types/api.types';
import { IServiceBinding, IService } from '../../../core/cf-api-svc.types';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { AppMonitorComponentTypes } from '../app-action-monitor-icon/app-action-monitor-icon.component';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { DeleteServiceBinding } from '../../../store/actions/service-bindings.actions';
import { ActivatedRoute } from '@angular/router';
import { BindingPipe } from '@angular/compiler';
import { ServiceActionHelperService } from '../../data-services/service-action-helper.service';
import { RouterNav } from '../../../store/actions/router.actions';

@Component({
  selector: 'app-detach-service-instance',
  templateUrl: './detach-service-instance.component.html',
  styleUrls: ['./detach-service-instance.component.scss']
})
export class DetachServiceInstanceComponent implements OnInit {

  cfGuid: any;
  selectedBindings: APIResource<IServiceBinding>[];
  deleteStarted: boolean;
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


  redirectToServices = () => this.store.dispatch(new RouterNav({ path: ['/services'] }));

  constructor(
    private store: Store<AppState>,
    private datePipe: DatePipe,
    private serviceActionHelperService: ServiceActionHelperService,
    private activatedRoute: ActivatedRoute
  ) {
    this.cfGuid = activatedRoute.snapshot.params.cfId;
  }

  ngOnInit() {
  }


  getId = (el: APIResource) => el.metadata.guid;
  setSelectedBindings = (selectedBindings: APIResource<IServiceBinding>[]) => {
    this.selectedBindings = selectedBindings;
    this.selectedBindings$.next(selectedBindings);
  }

  public startDelete = () => {

    console.log('Delete Started!!');
    if (this.deleteStarted) {
      /** Should redirect to bindings in the Service Instance detail View */
      return this.redirectToServices();
    }
    this.deleteStarted = true;
    if (this.selectedBindings && this.selectedBindings.length) {
     return this.selectedBindings.forEach(binding => {
        this.serviceActionHelperService.detachServiceBinding([binding], binding.entity.service_instance_guid, this.cfGuid, true);
      });
    }
  }

}
