import { CNSISModel, CNSISState } from '../../../store/types/cnsis.types';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { Observable, Subscription } from 'rxjs/Rx';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Component, OnInit } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';

class EndpointDataSource extends DataSource<any> {
  constructor(private store: Store<AppState>) {
    super();
  }

  connect(): Observable<CNSISModel[]> {
    return this.store.select('cnsis')
      .map((cnsis: CNSISState) => cnsis.entities);
  }

  disconnect() { }
}

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss']
})
export class EndpointsPageComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  dataSource: DataSource<any>;

  displayedColumns = [
    'name',
    'connection',
    'type',
    'address'
  ];

  ngOnInit() {
    this.dataSource = new EndpointDataSource(this.store);
  }


  getEndpointTypeString(endpoint) {
    return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
  }

}
