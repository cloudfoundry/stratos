import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { APIResource } from '../../../../store/types/api.types';
import { IRoute } from '../../../../core/cf-api.types';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { CfAppRoutesListConfigService } from '../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { AppDeleteRoutesListConfigService } from './app-delete-routes-list-config.service';
import { Subscription } from 'rxjs/Subscription';
import { IServiceBinding } from '../../../../core/cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../cloud-foundry/services/cloud-foundry-space.service';
import {
  AppServiceBindingListConfigService
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';

@Component({
  selector: 'app-delete-app-routes',
  templateUrl: './delete-app-routes.component.html',
  styleUrls: ['./delete-app-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppDeleteRoutesListConfigService
    },
  ]
})
export class DeleteAppRoutesComponent implements OnDestroy {

  @Output('selected')
  public selected = new EventEmitter<APIResource<IServiceBinding>[]>();

  private selectedSub: Subscription;

  constructor(private config: ListConfig<APIResource>) {
    const dataSource = this.config.getDataSource();

    this.selectedSub = this.config.getDataSource().selectedRows$.subscribe(
      (selected) => {
        this.selected.emit(Array.from(selected.values()));
      }
    );
  }

  ngOnDestroy() {
    this.selectedSub.unsubscribe();
  }

}
