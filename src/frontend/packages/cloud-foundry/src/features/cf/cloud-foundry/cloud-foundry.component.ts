import { CommonModule, AsyncPipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { PageHeaderComponent, ListComponent, ListConfig } from '@stratosui/core';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import type { CFAppState } from '../../../cf-app-state';
import {
  CFEndpointsListConfigService,
} from '../../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  styleUrls: ['./cloud-foundry.component.scss'],
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
  connectedEndpoints$: Observable<number>;
  constructor(
    private store: Store,
    cfService: CloudFoundryService
  ) {
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
      first()
    );
  }
}
