import { Component, Input, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription,
} from 'rxjs';
import { filter, first, map, startWith } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/cf-types';
import { DeleteDeployAppSection } from '../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { appEnvVarsEntityType, applicationEntityType } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { entityCatalogue } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { CfAppsDataSource } from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer } from '../deploy-application-deployer';

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnDestroy {

  @Input() appGuid: string;

  // Validation observable
  valid$: Observable<boolean>;

  error$ = new BehaviorSubject<boolean>(false);
  // Observable for when the deploy modal can be closed
  closeable$: Observable<boolean>;

  public deployer: DeployApplicationDeployer;

  private deploySub: Subscription;
  private errorSub: Subscription;
  private validSub: Subscription;

  private appEnvVarCatalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, appEnvVarsEntityType);
  private appCatalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, applicationEntityType);

  constructor(
    private store: Store<CFAppState>,
    private snackBar: MatSnackBar,
    public cfOrgSpaceService: CfOrgSpaceDataService
  ) {
    this.valid$ = observableOf(false);
    this.closeable$ = observableOf(false);
  }

  private initDeployer() {
    this.deploySub = this.deployer.status$.pipe(
      filter(status => status.deploying),
    ).subscribe();

    // Observables
    this.errorSub = this.deployer.status$.pipe(
      filter((status) => status.error)
    ).subscribe(status => this.snackBar.open(status.errorMsg, 'Dismiss'));

    const appGuid$ = this.deployer.applicationGuid$.pipe(
      filter((appGuid) => appGuid !== null),
      first(),
    );

    this.valid$ = appGuid$.pipe(
      map(guid => !!guid),
    );

    this.validSub = appGuid$.subscribe(guid => {
      this.appGuid = guid;

      // Update the root app wall list
      this.appCatalogueEntity.actionDispatchManager.dispatchGetAll(
        null,
        CfAppsDataSource.paginationKey,
        CfAppsDataSource.includeRelations,
        true
      );
      // this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
      // Pre-fetch the app env vars
      this.appEnvVarCatalogueEntity.actionDispatchManager.dispatchGet(this.appGuid, this.deployer.cfGuid);
      // this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, this.deployer.cfGuid));
    });

    this.closeable$ = observableCombineLatest(
      this.valid$.pipe(startWith(false)),
      this.deployer.status$).pipe(
        map(([validated, status]) => {
          return validated || status.error;
        })
      );
  }

  private destroyDeployer() {
    safeUnsubscribe(this.deploySub, this.errorSub, this.validSub);
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
    this.deployer.status$.pipe(
      filter(status => !status.deploying),
      first()
    ).subscribe(status => {
      if (status.error) {
        this.snackBar.open(status.errorMsg, 'Dismiss');
      } else {
        const ref = this.snackBar.open('Application deployment complete', 'View', { duration: 5000 });
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
      this.deployer = new DeployApplicationDeployer(this.store, this.cfOrgSpaceService);
    }

    this.initDeployer();

    // Start deploying
    this.deployer.open();
    if (fsDeployer) {
      // Ask the existing deployer to continue deploying
      this.deployer.deploy();
    }
  }

  onNext: StepOnNextFunction = () => {
    // Delete Deploy App Section
    this.store.dispatch(new DeleteDeployAppSection());
    this.goToAppSummary();
    return observableOf({ success: true });
  }

  goToAppSummary() {
    // Take user to applications
    const { cfGuid } = this.deployer;
    if (this.appGuid) {
      this.appEnvVarCatalogueEntity.actionDispatchManager.dispatchGet(this.appGuid, cfGuid);
      // this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, cfGuid));

      // Ensure the application package_state is correct
      this.appCatalogueEntity.actionDispatchManager.dispatchGet(this.appGuid, cfGuid);
      // this.store.dispatch(new GetApplication(this.appGuid, cfGuid));
      this.store.dispatch(new RouterNav({ path: ['applications', cfGuid, this.appGuid] }));
    }
  }
}
