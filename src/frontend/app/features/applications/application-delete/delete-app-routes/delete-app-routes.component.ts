import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../store/types/api.types';
import { IRoute } from '../../../../core/cf-api.types';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { CfAppRoutesListConfigService } from '../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { AppDeleteRoutesListConfigService } from './app-delete-routes-list-config.service';

@Component({
  selector: 'app-delete-app-routes',
  templateUrl: './delete-app-routes.component.html',
  styleUrls: ['./delete-app-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppDeleteRoutesListConfigService
    }
  ]
})
export class DeleteAppRoutesComponent implements OnInit {

  @Input('routes')
  public routes: APIResource<IRoute>[];


  constructor() { }

  ngOnInit() {
  }

}
