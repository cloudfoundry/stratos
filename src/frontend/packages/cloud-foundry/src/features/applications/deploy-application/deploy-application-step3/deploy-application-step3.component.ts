import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Injector, Input, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';

import { safeUnsubscribe, LogViewerComponent, StepOnNextFunction, SnackBarService } from '@stratosui/core';
import { RouterNav } from '@stratosui/store';
import { CFAppState } from '@stratosui/cloud-foundry';
import { DeleteDeployAppSection } from '../../../../actions/deploy-applications.actions';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { spaceEntityType } from '../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../entity-relations/entity-relations.types';
import { CfAppsDataSource } from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer } from '../deploy-application-deployer';

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
    CommonModule,
    LogViewerComponent,
  ]
})
export class DeployApplicationStep3Component implements OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  private snackBarService = inject(SnackBarService);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private injector = inject(Injector);
  private cdr = inject(ChangeDetectorRef);


  @Input() appGuid!: string;

  // Stable BehaviorSubjects back the public Observable fields. The field
  // references (valid$/closeable$/showOverlay$) are created once and never
  // reassigned — only the values pushed through the subjects change.
  // Reassigning these fields after the parent template's async pipe has
  // already subscribed would leave the pipe stranded on a completed
  // observableOf(false), which under OnPush + zoneless change detection
  // is never re-evaluated.
  private validSubject = new BehaviorSubject<boolean>(false);
  private closeableSubject = new BehaviorSubject<boolean>(false);
  private showOverlaySubject = new BehaviorSubject<boolean>(false);
  // Locks Previous while a deploy is actively in flight. Flips back to
  // false on terminal states (success or error) so the user can go back
  // and fix inputs when the deploy fails.
  private disablePreviousSubject = new BehaviorSubject<boolean>(true);

  readonly valid$: Observable<boolean> = this.validSubject.asObservable();
  readonly closeable$: Observable<boolean> = this.closeableSubject.asObservable();
  readonly showOverlay$: Observable<boolean> = this.showOverlaySubject.asObservable();
  readonly disablePrevious$: Observable<boolean> = this.disablePreviousSubject.asObservable();

  error = signal<boolean>(false);

  public deployer!: DeployApplicationDeployer;

  private subscriptions: Subscription[] = [];

  public busy = false;

  private initDeployer() {
    const status$ = this.deployer.status$.asObservable();

    // The template reads plain fields (deployer.streamTitle, deployer.deploying)
    // which are mutated directly by the deployer's websocket handlers, not
    // through observables. Under OnPush + zoneless CD, those mutations don't
    // trigger a re-render on their own. Subscribe to status$ (which IS emitted
    // via the signal wrapper every time updateStatus() is called) and force a
    // view check so the title bar and spinner reflect the current state.
    this.subscriptions.push(
      status$.subscribe(() => this.cdr.markForCheck())
    );

    this.subscriptions.push(
      status$.pipe(filter(status => status.deploying)).subscribe()
    );

    this.subscriptions.push(
      status$.pipe(filter(status => status.error))
        .subscribe(status => this.snackBarService.show(status.errorMsg, 'Dismiss'))
    );

    const appGuid$ = this.deployer.applicationGuid$.asObservable().pipe(
      filter((appGuid) => appGuid !== null),
      take(1),
    );

    this.subscriptions.push(
      appGuid$.subscribe(guid => {
        this.validSubject.next(!!guid);
        this.appGuid = guid;

        // Update the root app wall list
        cfEntityCatalog.application.api.getMultiple(undefined, CfAppsDataSource.paginationKey, {
          includeRelations: CfAppsDataSource.includeRelations });

        // Pre-fetch the app env vars
        cfEntityCatalog.appEnvVar.api.getMultiple(this.appGuid, this.deployer.cfGuid);
      })
    );

    this.subscriptions.push(
      observableCombineLatest(this.validSubject, status$).pipe(
        map(([validated, status]) => validated || status.error)
      ).subscribe(v => this.closeableSubject.next(v))
    );

    this.subscriptions.push(
      status$.subscribe(status => {
        this.busy = status.deploying;
        // Mirror busy state to disablePrevious so that when a deploy ends
        // (error or success) the Previous button unlocks and the user
        // isn't trapped on the step.
        this.disablePreviousSubject.next(status.deploying);
      })
    );

    this.subscriptions.push(
      status$.pipe(
        map(status => !status.deploying || status.deploying && !this.deployer.streamTitle)
      ).subscribe(v => this.showOverlaySubject.next(v))
    );

    // Resolve the app GUID without depending on APP_GUID_NOTIFY. That
    // backend event (cfapppush/deploy.go:205-208) is useless either way:
    // absent on first-time deploy (the cfV2Actor wrapper in push_actor.go
    // that used to send it was dropped when CF CLI internals were migrated
    // from v2action to v7action and no v7 equivalent was written) and
    // redundant on redeploy (it just echoes the value the client passed in
    // the URL). Even the Stratos "Redeploy" button path currently ends up
    // as a first-time deploy from the server's perspective because
    // DeployApplicationDeployer.isRedeploy is never assigned from the
    // parent component — the &app=X URL parameter is never set.
    //
    // CF v3 push is update-or-create by name, so looking up by name after
    // push success resolves the correct GUID in both scenarios.
    this.subscriptions.push(
      status$.pipe(
        filter(status => !status.deploying && !status.error),
        filter(() => !!this.deployer.appData?.Name && !this.appGuid),
        take(1),
        switchMap(() => {
          const appName = this.deployer.appData.Name;
          const cfGuid = this.deployer.cfGuid;
          const spaceGuid = this.deployer.spaceGuid;
          const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
          return cfEntityCatalog.application.store.getAllInSpace
            .getPaginationService(spaceGuid, cfGuid, paginationKey)
            .entities$.pipe(
              filter(apps => Array.isArray(apps) && apps.length > 0),
              map(apps => apps.find(a => a.entity?.name === appName)),
              filter(app => !!app),
              map(app => app.metadata.guid),
              take(1),
            );
        }),
      ).subscribe(guid => {
        this.deployer.applicationGuid$.next(guid);
      })
    );
  }

  private destroyDeployer() {
    safeUnsubscribe(...this.subscriptions);
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.store.dispatch(new DeleteDeployAppSection());
    this.destroyDeployer();
    if (this.deployer) {
      if (!this.deployer.deploying) {
        this.deployer.close();
      } else {
        this.setupCompletionNotification();
      }
    }
  }

  private setupCompletionNotification() {
    this.deployer.status$.asObservable().pipe(
      filter(status => !status.deploying),
      take(1)
    ).subscribe(status => {
      if (status.error) {
        this.snackBarService.show(status.errorMsg, 'Dismiss');
      } else {
        const ref = this.snackBarService.show('Application deployment complete', 'View', 10000, true);
        ref.onAction().subscribe(() => { this.goToAppSummary(); });
      }
      this.deployer.close();
    });
  }

  onEnter = (fsDeployer: DeployApplicationDeployer) => {
    // If we were passed data, then we came from the File System step
    if (fsDeployer) {
      this.deployer = fsDeployer;
    } else {
      this.deployer = new DeployApplicationDeployer(this.store, this.cfOrgSpaceService, this.injector);
    }

    this.initDeployer();
    // Start deploying
    this.deployer.open();
    if (fsDeployer) {
      // Ask the existing deployer to continue deploying
      this.deployer.deploy();
    }
    this.busy = true;
    // Under OnPush + zoneless CD, assigning this.deployer to a plain field
    // does not trigger a view update. Force one so the template (which
    // reads deployer.streamTitle and renders the log-viewer under an @if
    // deployer check) actually picks up the new reference.
    this.cdr.markForCheck();
  };

  onNext: StepOnNextFunction = () => {
    // Delete Deploy App Section
    this.store.dispatch(new DeleteDeployAppSection());
    this.goToAppSummary();
    return observableOf({ success: true });
  };

  goToAppSummary() {
    // Take user to applications
    const { cfGuid } = this.deployer;
    if (this.appGuid) {
      cfEntityCatalog.appEnvVar.api.getMultiple(this.appGuid, this.deployer.cfGuid);

      // Ensure the application package_state is correct
      cfEntityCatalog.application.api.get(
        this.appGuid,
        cfGuid,
        { includeRelations: [], populateMissing: false }
      );
      // this.store.dispatch(new GetApplication(this.appGuid, cfGuid));
      this.store.dispatch(new RouterNav({ path: ['applications', cfGuid, this.appGuid] }));
    }
  }
}
