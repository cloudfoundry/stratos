import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../store/types/api.types';
import { AppDeleteServiceInstancesListConfigService } from './app-delete-instances-routes-list-config.service';

@Component({
  selector: 'app-delete-app-instances',
  templateUrl: './delete-app-instances.component.html',
  styleUrls: ['./delete-app-instances.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppDeleteServiceInstancesListConfigService
    }
  ]
})
export class DeleteAppServiceInstancesComponent implements OnDestroy {

  @Output()
  public selected = new EventEmitter<APIResource<IServiceInstance>[]>();

  private selectedSub: Subscription;

  constructor(private config: ListConfig<APIResource>) {
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
