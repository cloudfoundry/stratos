import { CommonModule } from '@angular/common';
import { Component, Injector, Input, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription } from 'rxjs';
import { take, filter, map, startWith } from 'rxjs/operators';

import { safeUnsubscribe, LogViewerComponent, StepOnNextFunction, SnackBarService } from '@stratosui/core';
import { RouterNav } from '@stratosui/store';
import { CFAppState } from '@stratosui/cloud-foundry';
import { DeleteDeployAppSection } from '../../../../actions/deploy-applications.actions';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { CfAppsDataSource } from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer } from '../deploy-application-deployer';

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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


  @Input() appGuid!: string;

  // Validation observable
  valid$: Observable<boolean>;

  showOverlay$!: Observable<boolean>;

  error = signal<boolean>(false);
  // Observable for when the deploy modal can be closed
  closeable$: Observable<boolean>;

  public deployer!: DeployApplicationDeployer;

  private deploySub!: Subscription;
  private errorSub!: Subscription;
  private validSub!: Subscription;
  private busySub!: Subscription;

  public busy = false;

  constructor() {
    this.valid$ = observableOf(false);
    this.closeable$ = observableOf(false);
  }

  private initDeployer() {
    this.deploySub = this.deployer.status$.asObservable().pipe(
      filter(status => status.deploying),
    ).subscribe();

    // Observables
    this.errorSub = this.deployer.status$.asObservable().pipe(
      filter((status) => status.error)
    ).subscribe(status => this.snackBarService.show(status.errorMsg, 'Dismiss'));

    const appGuid$ = this.deployer.applicationGuid$.asObservable().pipe(
      filter((appGuid) => appGuid !== null),
      take(1),
    );

    this.valid$ = appGuid$.pipe(
      map(guid => !!guid),
    );

    this.validSub = appGuid$.subscribe(guid => {
      this.appGuid = guid;

      // Update the root app wall list
      cfEntityCatalog.application.api.getMultiple(undefined, CfAppsDataSource.paginationKey, {
        includeRelations: CfAppsDataSource.includeRelations });

      // Pre-fetch the app env vars
      cfEntityCatalog.appEnvVar.api.getMultiple(this.appGuid, this.deployer.cfGuid);
    });

    this.closeable$ = observableCombineLatest(
      this.valid$.pipe(startWith(false)),
      this.deployer.status$.asObservable()).pipe(
        map(([validated, status]) => {
          return validated || status.error;
        })
      );

    this.busySub = this.deployer.status$.asObservable().subscribe(status => this.busy = status.deploying);

    this.showOverlay$ = this.deployer.status$.asObservable().pipe(
      map(status => {
        return !status.deploying || status.deploying && !this.deployer.streamTitle;
      })
    );
  }

  private destroyDeployer() {
    safeUnsubscribe(this.deploySub, this.errorSub, this.validSub, this.busySub);
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
