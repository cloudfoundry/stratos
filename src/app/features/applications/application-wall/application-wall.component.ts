import { DatePipe } from '@angular/common';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs/Rx';

import { ApplicationSchema, GetAllApplications } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { getPaginationObservables } from './../../../store/reducers/pagination.reducer';
import { getAPIResourceEntity } from '../../../store/selectors/api.selectors';
import { CfAppsDataSource } from '../../../shared/data-sources/cf-apps-data-source';
import { EntityInfo, APIResource } from '../../../store/types/api.types';
import { TableCellAppNameComponent } from '../../../shared/components/table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import { CardAppComponent } from '../../../shared/components/cards/custom-cards/card-app/card-app.component';
import { UtilsService } from '../../../core/utils.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { ITableColumn } from '../../../shared/components/table/table.types';


@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  animations: [
    trigger(
      'cardEnter', [
        transition('* => *', [
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ], { optional: true })
        ])
      ]
    )
  ]
})
export class ApplicationWallComponent implements OnInit, OnDestroy {


  constructor(private store: Store<AppState>, private datePipe: DatePipe, private utilsService: UtilsService,
    public endpointsService: EndpointsService) { }

  appsDataSource: CfAppsDataSource;
  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'name', headerCell: () => 'Application Name', cellComponent: TableCellAppNameComponent, cellFlex: '2'
    },
    {
      columnId: 'status', headerCell: () => 'Status', cell: (row: APIResource) => `${row.entity.state}`, cellFlex: '1'
    },
    {
      columnId: 'instances', headerCell: () => 'Instances', cell: (row: APIResource) => `${row.entity.instances}`, cellFlex: '1'
    },
    {
      columnId: 'disk', headerCell: () => 'Disk Quota',
      cell: (row: APIResource) => `${this.utilsService.mbToHumanSize(row.entity.disk_quota)}`, cellFlex: '1'
    },
    {
      columnId: 'memory', headerCell: () => 'Memory',
      cell: (row: APIResource) => `${this.utilsService.mbToHumanSize(row.entity.memory)}`, cellFlex: '1'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cell: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`, sort: true,
      cellFlex: '2'
    },
  ];
  cardComponent = CardAppComponent;

  ngOnInit() {
    this.appsDataSource = new CfAppsDataSource(this.store);
  }

  ngOnDestroy() {
  }

}
