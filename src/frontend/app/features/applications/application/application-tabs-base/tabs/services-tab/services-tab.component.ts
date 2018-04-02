import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  AppServiceBindingListConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { ApplicationService } from '../../../../application.service';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { IServiceBinding } from '../../../../../../core/cf-api-svc.types';

@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  styleUrls: ['./services-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppServiceBindingListConfigService
    }
  ]
})
export class ServicesTabComponent implements OnInit {

  serviceBindings$: Observable<APIResource<IServiceBinding>[]>;
  constructor(private listConfig: ListConfig<APIResource>, private appService: ApplicationService) {
    this.serviceBindings$ = this.appService.application$.pipe(map(app => app.app.entity.service_bindings));
  }
  ngOnInit() {
  }

}
