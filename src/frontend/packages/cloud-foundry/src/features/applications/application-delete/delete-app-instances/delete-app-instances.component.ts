import { Component, EventEmitter, OnDestroy, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ListComponent } from '../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../cf-api-svc.types';
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
