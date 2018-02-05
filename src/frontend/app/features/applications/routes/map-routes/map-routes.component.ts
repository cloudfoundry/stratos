import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListConfig } from '../../../../shared/components/list/list.component';
import { CfAppRoutesDataSource } from '../../../../shared/data-sources/cf-app-routes-data-source';
import { CfAppMapRoutesListConfigService } from '../../../../shared/list-configs/cf-app-map-routes-list-config.service';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';

@Component({
  selector: 'app-map-routes',
  templateUrl: './map-routes.component.html',
  styleUrls: ['./map-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfAppMapRoutesListConfigService
    }
  ]
})
export class MapRoutesComponent implements OnInit {
  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private listConfig: ListConfig
  ) {
    this.routesDataSource = listConfig.getDataSource() as CfAppRoutesDataSource;
  }
  routesDataSource: CfAppRoutesDataSource;

  ngOnInit() {}
}
