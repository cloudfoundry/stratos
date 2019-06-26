import { Inject, Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { GetAppStatsAction, GetAppSummaryAction } from '../../../../../../store/src/actions/app-metadata.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { EntityService } from '../../../../core/entity-service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { ENTITY_SERVICE } from '../../../../shared/entity.tokens';
import { ApplicationService } from '../../application.service';

@Injectable()
export class ApplicationPollingService {

  private pollingSub: Subscription;
  private autoRefreshString = 'auto-refresh';

  public isPolling$ = this.entityService.updatingSection$.pipe(map(
    update => update[this.autoRefreshString] && update[this.autoRefreshString].busy
  ));

  constructor(
    public applicationService: ApplicationService,
    @Inject(ENTITY_SERVICE) private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private ngZone: NgZone,
  ) {

  }

  start() {
    if (this.pollingSub && !this.pollingSub.closed) {
      return;
    }

    const { cfGuid, appGuid } = this.applicationService;
    // Auto refresh
    this.ngZone.runOutsideAngular(() => {
      this.pollingSub = this.entityService
        .poll(10000, this.autoRefreshString).pipe(
          tap(({ resource }) => {
            this.ngZone.run(() => {
              this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
              if (resource && resource.entity && resource.entity.state === 'STARTED') {
                this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
              }
            });
          }))
        .subscribe();
    });
  }

  stop() {
    safeUnsubscribe(this.pollingSub);
  }
}
