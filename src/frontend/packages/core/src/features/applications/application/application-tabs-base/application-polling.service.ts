import { Inject, Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { GetAppStatsAction, GetAppSummaryAction } from '../../../../../../store/src/actions/app-metadata.actions';
import { SetPluginDashboardValue } from '../../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../../store/src/selectors/dashboard.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { EntityService } from '../../../../core/entity-service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { ENTITY_SERVICE } from '../../../../shared/entity.tokens';
import { ApplicationService } from '../../application.service';

@Injectable()
export class ApplicationPollingService {

  // This should come from a standard place after entity catalogue change
  private cfPluginType = 'cf';

  private cfApplicationPollEnabled = 'applicationPollEnabled';

  private pollingSub: Subscription;
  private autoRefreshString = 'auto-refresh';

  public isPolling$ = this.entityService.updatingSection$.pipe(map(
    update => update[this.autoRefreshString] && update[this.autoRefreshString].busy
  ));

  public isEnabled$: Observable<boolean>;

  constructor(
    public applicationService: ApplicationService,
    @Inject(ENTITY_SERVICE) private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private ngZone: NgZone,
  ) {
    this.isEnabled$ = this.store.select(selectDashboardState).pipe(
      map(dashboardState => {
        const havePreviousSetting =
          dashboardState.plugin[this.cfPluginType] &&
          dashboardState.plugin[this.cfPluginType][this.cfApplicationPollEnabled] !== null;
        // If there's a previous setting use it, otherwise start with true
        return havePreviousSetting ? dashboardState.plugin[this.cfPluginType][this.cfApplicationPollEnabled] : true;
      })
    );

    // Update initial started/stopped state
    this.isEnabled$.pipe(first()).subscribe(enabled => this.updateEnabled(enabled));
  }

  public updateEnabled(enabled: boolean) {
    if (enabled) {
      this.store.dispatch(new SetPluginDashboardValue(this.cfPluginType, this.cfApplicationPollEnabled, true));
      this.start();
    } else {
      this.store.dispatch(new SetPluginDashboardValue(this.cfPluginType, this.cfApplicationPollEnabled, false));
      this.stop();
    }
  }

  public start() {
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

  public stop() {
    safeUnsubscribe(this.pollingSub);
  }
}
