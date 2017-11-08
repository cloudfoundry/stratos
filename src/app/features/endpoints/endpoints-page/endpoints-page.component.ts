import { CNSISModel, CNSISState } from '../../../store/types/cnsis.types';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { Observable, Subscription } from 'rxjs/Rx';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Component, OnInit } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { ITableColumn } from '../../../shared/components/table/table.component';
import { TableHeaderSelectComponent } from '../../../shared/components/table/table-header-select/table-header-select.component';
import { TableCellSelectComponent } from '../../../shared/components/table/table-cell-select/table-cell-select.component';
import { TableCellEditComponent } from '../../../shared/components/table/table-cell-edit/table-cell-edit.component';
import { EndpointsDataSource } from '../../../shared/data-sources/endpoints-data-source';

function getEndpointTypeString(endpoint: CNSISModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

function getEndpointUrlString(endpoint: CNSISModel): string {
  const { api_endpoint } = endpoint;
  let url = api_endpoint.Host;
  if (api_endpoint.Scheme) {
    url = api_endpoint.Scheme + url;
  }
  if (api_endpoint.)
    return url;
}

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
})
export class EndpointsPageComponent implements OnInit {

  dataSource: EndpointsDataSource;

  columns: Array<ITableColumn<CNSISModel>> = [
    {
      columnId: 'select', headerCellComponent: TableHeaderSelectComponent, cellComponent: TableCellSelectComponent,
      class: 'table-column-select', cellFlex: '1'
    },
    {
      columnId: 'name', headerCell: () => 'Name', cell: (row: CNSISModel) => `${row.name}`, sort: true, cellFlex: '2'
    },
    {
      columnId: 'connection', headerCell: () => 'Connection', cell: (row: CNSISModel) => `missing..`, sort: true, cellFlex: '1'
    },
    {
      columnId: 'type', headerCell: () => 'Type', cell: getEndpointTypeString, sort: true, cellFlex: '2'
    },
    {
      columnId: 'address', headerCell: () => 'Address', cell: (row: CNSISModel) => `${}`, sort: true, cellFlex: '5'
    },
    {
      columnId: 'edit', headerCell: () => '', cellComponent: TableCellEditComponent, class: 'table-column-edit', cellFlex: '1'
    },
  ];

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.dataSource = new EndpointsDataSource(this.store);
  }




}
