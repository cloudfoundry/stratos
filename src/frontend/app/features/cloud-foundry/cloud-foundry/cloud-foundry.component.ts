import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import { CloudFoundryService } from '../services/cloud-foundry.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  styleUrls: ['./cloud-foundry.component.scss'],
  providers: [CloudFoundryService, CfOrgSpaceDataService, CfUserService]
})
export class CloudFoundryComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  constructor(
    private store: Store<AppState>,
    private cfService: CloudFoundryService
  ) {}

  ngOnInit() {
    const cfRouting$ = this.cfService.cFEndpoints$.pipe(
      tap(cfEndpoints => {
        if (cfEndpoints && cfEndpoints.length === 1) {
          this.store.dispatch(
            new RouterNav({ path: ['cloud-foundry', cfEndpoints[0].guid] })
          );
        } else {
          // Take to wall
        }
      })
    );
    this.subscriptions.push(cfRouting$.subscribe());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
