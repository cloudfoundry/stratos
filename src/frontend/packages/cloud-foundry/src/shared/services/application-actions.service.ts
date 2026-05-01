import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { ConfirmationDialogConfig, ConfirmationDialogService } from '@stratosui/core';
import { ResetPagination } from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { ApplicationService } from '../../features/applications/application.service';
import { CfAppsSignalConfigService } from '../components/list/list-types/app/cf-apps-signal-config.service';

// Confirmation dialogs
const appStopConfirmation = new ConfirmationDialogConfig(
  'Stop Application',
  'Are you sure you want to stop this Application?',
  'Stop'
);
const appStartConfirmation = new ConfirmationDialogConfig(
  'Start Application',
  'Are you sure you want to start this Application?',
  'Start'
);
const appRestartConfirmation = new ConfirmationDialogConfig(
  'Restart Application',
  'Are you sure you want to restart this Application?',
  'Restart'
);
const appRestageConfirmation = new ConfirmationDialogConfig(
  'Restage Application',
  'Are you sure you want to restage this Application?',
  'Restage'
);

/**
 * AppApplicationActionsService
 *
 * Houses the lifecycle action methods (start/stop/restart/restage) and the
 * delete-redirect for an application detail page. Extracted from
 * BuildTabComponent so the action bar can be hosted at the application-tabs-base
 * level and appear on every detail tab.
 */
@Injectable({ providedIn: 'root' })
export class AppApplicationActionsService {
  private applicationService = inject(ApplicationService);
  private confirmDialog = inject(ConfirmationDialogService);
  private store = inject<Store<CFAppState>>(Store);
  private router = inject(Router);
  private apps = inject(CfAppsSignalConfigService);

  // Lifecycle actions (start/stop/restart/restage) flow through the
  // Stratos async-job contract via CfAppsSignalConfigService: writeWithJob
  // hits POST /pp/v1/cf/apps/{cnsi}/{app}/actions/{action} and awaits the
  // CF-side job to terminal state. On resolve we refetch the app entity
  // and stats so the summary reflects the new state.
  private runLifecycleAction(action: () => Promise<void>, onAfter?: () => void): void {
    const { cfGuid, appGuid } = this.applicationService;
    void action()
      .then(() => {
        cfEntityCatalog.application.api.get(appGuid, cfGuid, {});
        this.dispatchAppStats();
        onAfter?.();
      })
      .catch((err: unknown) => {
        console.warn('Lifecycle action failed:', err);
        this.dispatchAppStats();
      });
  }

  private dispatchAppStats = () => {
    const { cfGuid, appGuid } = this.applicationService;
    cfEntityCatalog.appStats.api.getMultiple(appGuid, cfGuid);
  };

  restart() {
    this.confirmDialog.open(appRestartConfirmation, () => {
      this.runLifecycleAction(() => this.apps.restartApp(
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
      ));
    });
  }

  stop() {
    this.confirmDialog.open(appStopConfirmation, () => {
      this.runLifecycleAction(
        () => this.apps.stopApp(this.applicationService.cfGuid, this.applicationService.appGuid),
        () => {
          // On app reaching STOPPED, clear the stats pagination section
          // so a re-start comes up with fresh instance rows.
          const { cfGuid, appGuid } = this.applicationService;
          const getAppStatsAction = cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid);
          this.store.dispatch(new ResetPagination(getAppStatsAction, getAppStatsAction.paginationKey));
        },
      );
    });
  }

  start() {
    this.confirmDialog.open(appStartConfirmation, () => {
      this.runLifecycleAction(
        () => this.apps.startApp(this.applicationService.cfGuid, this.applicationService.appGuid),
      );
    });
  }

  restage() {
    this.confirmDialog.open(appRestageConfirmation, () => {
      this.runLifecycleAction(
        () => this.apps.restageApp(this.applicationService.cfGuid, this.applicationService.appGuid),
      );
    });
  }

  redirectToDelete() {
    const { cfGuid, appGuid } = this.applicationService;
    this.router.navigate(['/applications', cfGuid, appGuid, 'delete']);
  }
}
