import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EnvironmentInjector, OnDestroy, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';

import { safeUnsubscribe, LogViewerComponent, StepOnNextResult, TailwindSnackBarService } from '@stratosui/core';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import type { StApp, StAppsResponse } from '../../../../services/endpoint-data/stratos-types';
import { DeployApplicationDeployer } from '../deploy-application-deployer';
import { AppBusyComponent } from '@stratosui/core';

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col relative',
    style: 'height: 47vh; width: 100%;'
  },
  imports: [
    AppBusyComponent,
    CommonModule,
    LogViewerComponent,
  ]
})
export class DeployApplicationStep3Component implements OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private deployData = inject(CfDeployAppDataService);
  private snackBarService = inject(TailwindSnackBarService);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  // The deployer outlives this step; a view injector would tie its state
  // effects to the view and end them when the view is destroyed
  private injector = inject(EnvironmentInjector);
  private http = inject(HttpClient);


  // The app being redeployed; none on a first deploy
  readonly redeployAppGuid = input<string>();

  // The deployed app: the redeployed one, or the one a first deploy
  // looked up. Each deploy starts again from the input.
  appGuid?: string;

  // The appGuid lookup has reported a deployed app
  readonly valid = signal(false);
  // Locks Previous from entry until the deploy has ended (success or error,
  // a lost connection or missing details included), so the user can then
  // go back and fix inputs.
  readonly disablePrevious = signal(true);
  // A deployed app the lookup did not find, or a lookup that failed: there
  // is no app to go to, but the deploy is over, so the step can be closed
  private readonly appNotFound = signal(false);

  readonly deployer = signal<DeployApplicationDeployer | undefined>(undefined);

  // Every open of a deployer starts a new log stream on it, and entering the
  // step again opens it again, so the stream is taken after each open.
  readonly logStream = signal<Observable<string> | undefined>(undefined);

  readonly closeable = computed(() => {
    const status = this.deployer()?.status$();
    return this.valid() || !!status?.error || this.appNotFound();
  });

  private subscriptions: Subscription[] = [];

  private initDeployer() {
    const status$ = this.deployer()!.status$.asObservable();

    this.subscriptions.push(
      status$.pipe(filter(status => status.error))
        .subscribe(status => this.snackBarService.show(status.errorMsg ?? 'Application deployment failed', 'Dismiss'))
    );

    const appGuid$ = this.deployer()!.applicationGuid$.asObservable().pipe(
      filter((appGuid) => appGuid !== null),
      take(1),
    );

    this.subscriptions.push(
      appGuid$.subscribe(guid => {
        this.valid.set(!!guid);
        this.appGuid = guid;
        // Pre-fetches the app wall + env vars used to live here to warm
        // the legacy ngrx state. AppDetailDataService and
        // CfAppsSignalConfigService both fetch fresh on next mount, so
        // dropping the pre-fetches is functionally a no-op modulo a
        // one-time HTTP saved.
      })
    );

    this.subscriptions.push(
      status$.subscribe(() => {
        // Going back would abandon the deploy, so Previous stays locked
        // until it ends (error or success), not only while it pushes.
        // Every end, a lost connection or missing details included, is
        // reported, so the user isn't trapped on the step.
        this.disablePrevious.set(!this.deployer()!.finished);
      })
    );

    // Fallback for a missing APP_GUID_NOTIFY. After a first-time push the
    // backend resolves the new app's GUID by name and sends it, but that
    // lookup is best-effort (cfapppush/deploy.go), so the event can be
    // absent. The Stratos "Redeploy" button path also ends up as a
    // first-time deploy from the server's perspective because
    // DeployApplicationDeployer.isRedeploy is never assigned from the
    // parent component — the &app=X URL parameter is never set.
    //
    // CF v3 push is update-or-create by name, so looking up by name after
    // push success resolves the correct GUID in both scenarios.
    this.subscriptions.push(
      status$.pipe(
        filter(status => !status.deploying && !status.error),
        filter(() => !!this.deployer()!.appData?.Name && !this.appGuid),
        take(1),
        switchMap(() => this.lookUpAppGuid()),
      ).subscribe({
        next: guid => {
          if (guid) {
            this.deployer()!.applicationGuid$.next(guid);
          } else {
            this.appNotFound.set(true);
            this.showAppNotFound();
          }
        },
        error: () => {
          this.appNotFound.set(true);
          this.showAppLookupFailed();
        },
      })
    );
  }

  private showAppNotFound() {
    this.snackBarService.show(
      `Application ${this.deployer()!.appData?.Name} was deployed but could not be found in the space`, 'Dismiss');
  }

  private showAppLookupFailed() {
    this.snackBarService.show(
      `Application ${this.deployer()!.appData?.Name} was deployed but looking it up in the space failed`, 'Dismiss');
  }

  // Emits undefined when the space has no app of that name
  private lookUpAppGuid(): Observable<string | undefined> {
    const appName = this.deployer()!.appData?.Name;
    const cfGuid = this.deployer()!.cfGuid;
    const spaceGuid = this.deployer()!.spaceGuid;
    // Native handler returns apps for the space; client-side filter
    // for the just-deployed name. Single HTTP call replaces the
    // legacy ngrx pagination that walked the space-apps list.
    return this.http.get<StAppsResponse>(
      `/pp/v1/cf/apps/${cfGuid}?space_guids=${encodeURIComponent(spaceGuid)}`,
    ).pipe(
      map(resp => (resp?.resources ?? []).find((a: StApp) => a.name === appName)?.guid),
      take(1),
    );
  }

  private destroyDeployer() {
    safeUnsubscribe(...this.subscriptions);
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.deployData.resetState();
    this.destroyDeployer();
    if (this.deployer()) {
      // A deploy in flight (before or during the push) keeps running and
      // reports its end
      if (this.deployer()!.inFlight) {
        this.setupCompletionNotification();
      } else {
        this.deployer()!.close();
      }
    }
  }

  private setupCompletionNotification() {
    // status$ replays its current value; wait for the reported close, which
    // every end of a deploy (including a lost connection) produces
    this.deployer()!.status$.asObservable().pipe(
      filter(() => this.deployer()!.finished),
      take(1)
    ).subscribe(status => {
      if (status.error) {
        this.snackBarService.show(status.errorMsg ?? 'Application deployment failed', 'Dismiss');
      } else {
        const ref = this.snackBarService.show('Application deployment complete', 'View', 10000, true);
        // A first-time deploy left mid-way never looked up its app GUID
        ref.onAction().pipe(
          switchMap(() => this.appGuid ? observableOf(this.appGuid) : this.lookUpAppGuid()),
        ).subscribe({
          next: guid => {
            if (guid) {
              this.appGuid = guid;
              this.goToAppSummary();
            } else {
              this.showAppNotFound();
            }
          },
          error: () => this.showAppLookupFailed(),
        });
      }
      this.deployer()!.close();
    });
  }

  onEnter = (fsDeployer: DeployApplicationDeployer) => {
    // Re-entry after Previous: tear down the prior deployer's subscriptions
    // and websocket so its stale status$ cannot replay the earlier error
    // snackbar on top of the fresh attempt.
    this.destroyDeployer();
    if (this.deployer() && this.deployer() !== fsDeployer) {
      this.deployer()!.close();
    }

    // Reset UI state so buttons reflect "deploy not yet started" rather
    // than carrying over the prior attempt's terminal state (e.g. "Go to
    // App Summary" staying active from a previous successful push).
    this.valid.set(false);
    this.disablePrevious.set(true);
    this.appNotFound.set(false);
    // A retry of a first deploy may deploy another app; look it up again
    this.appGuid = this.redeployAppGuid();

    // If we were passed data, then we came from the File System step
    if (fsDeployer) {
      this.deployer.set(fsDeployer);
    } else {
      this.deployer.set(new DeployApplicationDeployer(this.cfOrgSpaceService, this.injector));
    }

    // A file deploy entered again after it ended: its connection is over,
    // so upload the same files again on a new one
    const reupload = !!fsDeployer && fsDeployer.finished;
    if (reupload) {
      fsDeployer.close();
    }

    this.initDeployer();
    // Start deploying
    this.deployer()!.open();
    this.logStream.set(this.deployer()!.messages.asObservable());
    if (reupload) {
      // The server reads the go-ahead only after its ack of the last file
      this.subscriptions.push(
        this.deployer()!.fileTransferStatus$.asObservable().pipe(
          filter(status => !!status && status.filesSent === status.totalFiles),
          take(1),
        ).subscribe(() => this.deployer()!.deploy())
      );
    } else if (fsDeployer) {
      // Ask the existing deployer to continue deploying
      this.deployer()!.deploy();
    }
  };

  async onNext(): Promise<StepOnNextResult> {
    // Delete Deploy App Section
    this.deployData.resetState();
    this.goToAppSummary();
    return { success: true };
  }

  goToAppSummary() {
    // Take user to applications. AppDetailDataService on the destination
    // page fetches app entity + env vars fresh on mount — the legacy
    // pre-fetches that used to live here were warming ngrx state that
    // nothing reads anymore.
    const { cfGuid } = this.deployer()!;
    if (this.appGuid) {
      // When deployed from a CF-scoped wall, tag the app detail with
      // ?breadcrumbs=cf so its "Applications" breadcrumb returns to that wall.
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const cfScoped = typeof returnUrl === 'string' && returnUrl.startsWith('/cloud-foundry/');
      this.router.navigate(
        ['applications', cfGuid, this.appGuid],
        cfScoped ? { queryParams: { breadcrumbs: 'cf' } } : undefined,
      );
    }
  }
}
