import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@stratosui/store';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { CFAppState } from '../../../cf-app-state';
import {
  CFEndpointsListConfigService,
} from '../../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ListComponent,
    CfEndpointsMissingComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CFEndpointsListConfigService,
    },
    CloudFoundryService
  ]
})
export class CloudFoundryComponent {
  private store = inject<Store<CFAppState>>(Store);

  connectedEndpoints$: Observable<number>;
  constructor() {
    const cfService = inject(CloudFoundryService);

    this.connectedEndpoints$ = cfService.connectedCFEndpoints$.pipe(
      map(connectedEndpoints => {
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          this.store.dispatch(new RouterNav({
            path: ['cloud-foundry', connectedEndpoints[0].guid]
          }));
        }
        return connectedEndpoints.length;
      }),
      take(1)
    );
  }
}
