import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, race, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfirmationDialogConfig, ConfirmationDialogService } from '@stratosui/core';
import { ResetPagination } from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { ApplicationService } from '../../features/applications/application.service';
import { CloudFoundryEndpointService } from '../../features/cf/services/cloud-foundry-endpoint.service';
import { CfAppsSignalConfigService } from '../components/list/list-types/app/cf-apps-signal-config.service';

/**
 * AppApplicationActionsService
 *
 * Houses the lifecycle action methods (start/stop/restart/restage) and the
 * delete-redirect for an application detail page. Extracted from
 * BuildTabComponent so the action bar can be hosted at the application-tabs-base
 * level and appear on every detail tab.
 *
 * Component-scoped (NOT providedIn:'root'): ApplicationService is component-
 * scoped at ApplicationBaseComponent (depends on CF_GUID / APP_GUID tokens
 * that only exist in that component's injector). A root-scoped service
 * cannot inject ApplicationService — Angular would try to instantiate it
 * in the root injector, where CF_GUID has no provider, and throw NG0201.
 * Provide on the action bar component instead.
 *
 * Each confirmation dialog is built dynamically from the live observables
 * (app, endpoint, org, space) so the operator can see exactly which
 * application is about to be acted on. The static "Are you sure you want
 * to stop this Application?" message was a foot-gun on multi-CF
 * deployments where the same app name exists in multiple spaces or under
 * multiple CF endpoints sharing a domain.
 */
@Injectable()
export class AppApplicationActionsService {
  private applicationService = inject(ApplicationService);
  private cfEndpointService = inject(CloudFoundryEndpointService);
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

  // Resolves an observable's first emitted value within a 1s budget; falls
  // back to a default so the dialog never hangs if upstream data hasn't
  // arrived yet (e.g. user clicked Stop within the first second of page
  // load before appOrg$/endpoint$ have replayed).
  private async firstWithFallback<T>(obs$: any, fallback: T): Promise<T> {
    const timeout$ = timer(1000).pipe(map(() => fallback as T));
    return firstValueFrom(race(obs$ as any, timeout$)) as Promise<T>;
  }

  // Reads app/endpoint/org/space names from the live observables. Each is
  // gated by a 1s fallback so a slow-replaying observable (endpoint$ in
  // particular: it waits for the endpoint entity to load) doesn't strand
  // the dialog and leave the user staring at a non-responsive button.
  private async buildDialog(
    title: string,
    verb: string,
    confirmLabel: string,
  ): Promise<ConfirmationDialogConfig> {
    const [appEntity, orgRes, spaceRes, endpointInfo] = await Promise.all([
      this.firstWithFallback<any>(this.applicationService.application$, null),
      this.firstWithFallback<any>(this.applicationService.appOrg$, null),
      this.firstWithFallback<any>(this.applicationService.appSpace$, null),
      this.firstWithFallback<any>(this.cfEndpointService.endpoint$, null),
    ]);
    const appName = appEntity?.app?.entity?.name ?? this.applicationService.appGuid;
    const orgName = orgRes?.entity?.name ?? '?';
    const spaceName = spaceRes?.entity?.name ?? '?';
    const cfName = endpointInfo?.entity?.name ?? this.applicationService.cfGuid;
    const message =
      `${verb} "${appName}" on Cloud Foundry "${cfName}" — org "${orgName}" / space "${spaceName}"?`;
    return new ConfirmationDialogConfig(`${title}: ${appName}`, message, confirmLabel);
  }

  async restart() {
    const cfg = await this.buildDialog('Restart', 'Are you sure you want to restart', 'Restart');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(() => this.apps.restartApp(
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
      ));
    });
  }

  async stop() {
    const cfg = await this.buildDialog('Stop', 'Are you sure you want to stop', 'Stop');
    this.confirmDialog.open(cfg, () => {
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

  async start() {
    const cfg = await this.buildDialog('Start', 'Are you sure you want to start', 'Start');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(
        () => this.apps.startApp(this.applicationService.cfGuid, this.applicationService.appGuid),
      );
    });
  }

  async restage() {
    const cfg = await this.buildDialog('Restage', 'Are you sure you want to restage', 'Restage');
    this.confirmDialog.open(cfg, () => {
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
