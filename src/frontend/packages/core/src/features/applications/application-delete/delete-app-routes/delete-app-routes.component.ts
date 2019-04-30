import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { AppDeleteRoutesListConfigService } from './app-delete-routes-list-config.service';
import { Subscription } from 'rxjs';

import { IServiceBinding } from '../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/src/types/api.types';

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

  @Output()
  public selected = new EventEmitter<APIResource<IServiceBinding>[]>();

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
