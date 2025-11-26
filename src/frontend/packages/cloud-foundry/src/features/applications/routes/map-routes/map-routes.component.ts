import { Component, Input, type OnDestroy, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import type { BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ListConfig, ListComponent } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import {
  CfAppMapRoutesListConfigService,
} from '../../../../shared/components/list/list-types/app-route/cf-app-map-routes-list-config.service';
import type { CfAppRoutesDataSource } from '../../../../shared/components/list/list-types/app-route/cf-app-routes-data-source';
import { ApplicationService } from '../../application.service';

@Component({
  selector: 'app-map-routes',
  templateUrl: './map-routes.component.html',
  styleUrls: ['./map-routes.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfAppMapRoutesListConfigService
    }
  ]
})
export class MapRoutesComponent implements OnInit, OnDestroy {
  paginationSubscription: Subscription | undefined;
  subscription!: Subscription;
  @Input() selectedRoute$!: BehaviorSubject<APIResource>;

  constructor(
    private appService: ApplicationService,
    listConfig: ListConfig<APIResource>
  ) {
    this.routesDataSource = listConfig.getDataSource() as CfAppRoutesDataSource;
  }
  routesDataSource: CfAppRoutesDataSource;
  ngOnInit() {
    this.subscription = this.routesDataSource.selectedRows$
      .pipe(
        tap(routes => {
          const selectedRow = Array.from(routes.values());
          if (selectedRow.length) {
            this.selectedRoute$.next(selectedRow[0]);
          }
        })
      )
      .subscribe();

    this.paginationSubscription = this.appService.orgDomains$.subscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.paginationSubscription.unsubscribe();
  }
}
