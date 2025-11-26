import { Component, EventEmitter, type OnDestroy, Output, inject, } from '@angular/core';
import type { Subscription } from 'rxjs';

import { ListComponent, ListConfig } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IServiceInstance } from '../../../../cf-api-svc.types';
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
  ],
  standalone: true,
  imports: [
    ListComponent
  ]
})
export class DeleteAppServiceInstancesComponent implements OnDestroy {

  @Output()
  public selected = new EventEmitter<APIResource<IServiceInstance>[]>();

  private selectedSub: Subscription;

  private config = inject(ListConfig<APIResource>);

  constructor() {
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
