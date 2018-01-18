import { CfAppRoutesListConfigService } from '../../../shared/list-configs/cf-app-routes-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component';
import { ApplicationService } from '../application.service';
import { CfAppRoutesDataSource } from '../../../shared/data-sources/cf-app-routes-data-source';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppRoutesListConfigService,
  }]
})
export class RoutesComponent implements OnInit {

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private listConfig: ListConfig
  ) {
    this.routesDataSource = listConfig.getDataSource() as CfAppRoutesDataSource;
  }

  cardComponent = null;
  routesDataSource: CfAppRoutesDataSource;

  ngOnInit() {
   }
}
