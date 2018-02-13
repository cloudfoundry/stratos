import { Compoimport { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { tap, first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import { CloudFoundryService } from '../cloud-foundry.service';
import { tag } from 'rxjs-spy/operators/tag';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  styleUrls: ['./cloud-foundry.component.scss']
})
export class CloudFoundryComponent {
  constructor(
    private store: Store<AppState>,
    private cfService: CloudFoundryService
  ) {
    cfService.cFEndpoints$.pipe(
      tap(cfEndpoints => {
        const connectedEndpoints = cfEndpoints.filter(
          c => c.connectionStatus === 'connected'
        );
        if (connectedEndpoints.length === 1) {
          this.store.dispatch(
            new RouterNav({ path: ['cloud-foundry', cfEndpoints[0].guid] })
          );
        }
      }),
      first()
    ).subscribe();
  }
}
