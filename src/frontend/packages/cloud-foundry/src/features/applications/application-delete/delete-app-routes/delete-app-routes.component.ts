import { Component, EventEmitter, OnDestroy, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { Subscription } from 'rxjs';

import { ListComponent } from '../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../cf-api-svc.types';
import { AppDeleteRoutesListConfigService } from './app-delete-routes-list-config.service';

@Component({
  selector: 'app-delete-app-routes',
  templateUrl: './delete-app-routes.component.html',
  styleUrls: ['./delete-app-routes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListComponent
],
  providers: [
    {
      provide: ListConfig,
      useClass: AppDeleteRoutesListConfigService
    },
  ]
})
export class DeleteAppRoutesComponent implements OnDestroy {
  private config = inject(ListConfig<APIResource>);

  @Output()
  public selected = new EventEmitter<APIResource<IServiceBinding>[]>();

  private selectedSub: Subscription;

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
