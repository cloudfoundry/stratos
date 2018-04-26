import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { interval } from 'rxjs/observable/interval';
import { catchError, filter, map, switchMap, takeWhile } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { environment } from '../../../../../environments/environment';
import {
  CfAppsDataSource,
  createGetAllAppAction,
} from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { GetAppEnvVarsAction } from '../../../../store/actions/app-metadata.actions';
import { DeleteDeployAppSection } from '../../../../store/actions/deploy-applications.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { DeployApplicationDeployer } from '../deploy-application-deployer';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';

// Interval to check for new application
const APP_CHECK_INTERVAL = 3000;

const proxyAPIVersion = environment.proxyAPIVersion;

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnDestroy {

  @Input('isRedeploy') isRedeploy: string;
  appGuid: string;

  // Validation poller
  validSub: Subscription;
  valid$ = new BehaviorSubject<boolean>(false);

  // Observable for when the deploy modal can be closed
  closeable$: Observable<boolean>;

  private deployer: DeployApplicationDeployer;

  private deploySub: Subscription;
  private errorSub: Subscription;

  private fsData: FileScannerInfo;

  constructor(
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    private http: HttpClient,
  ) {
    this.deployer = new DeployApplicationDeployer(store, cfOrgSpaceService, http);
    this.initDeployer();
  }

  private initDeployer() {
    // Observables
    this.errorSub = this.deployer.status$.pipe(
      filter((status) => status.error)
    ).subscribe(status => this.snackBar.open(status.errorMsg, 'Dismiss'));

    this.closeable$ = Observable.combineLatest(
      this.valid$,
      this.deployer.status$).pipe(
        map(([validated, status]) => {
          return validated || status.error;
        })
      );
    this.deploySub = this.deployer.status$.pipe(
      filter(status => status.deploying),
    ).subscribe(deploying => {
      // Deploying
        // Set this up here to avoid any fun with redeploy case and the deploying flag
        this.validSub = this.createValidationPoller().pipe(
          takeWhile(valid => !valid)
        ).subscribe(null, null, () => {
          this.valid$.next(true);
        });
    });
  }

  private destroyDeployer() {
    this.deploySub.unsubscribe();
    this.errorSub.unsubscribe();
  }

  ngOnDestroy() {
    this.store.dispatch(new DeleteDeployAppSection());
    this.destroyDeployer();
    this.deployer.close();
  }

  onEnter = (fsDeployer: DeployApplicationDeployer) => {
    // If we were passed data, then we came from the File System step
    if (this.isRedeploy) {
      this.appGuid = this.isRedeploy;
    }

    if (fsDeployer) {
      // Kill off the deployer we created in out constructor and use the one supplied to us
      this.destroyDeployer();
      this.deployer = fsDeployer;
      this.initDeployer();
    }

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
    // Take user to applications
    const { cfGuid } = this.deployer;
    this.store.dispatch(new RouterNav({ path: ['applications', cfGuid, this.appGuid] }));
    return Observable.of({ success: true });
  }

  private createValidationPoller(): Observable<boolean> {
    return this.isRedeploy ? this.handleRedeployValidation() : this.handleDeployValidation();
  }

  private handleRedeployValidation(): Observable<boolean> {
    return interval(500).pipe(
      map(() => {
        if (this.deployer.deploying) {
          return false;
        } else {
          const { cfGuid } = this.deployer;
          this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
          this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, cfGuid));
          return true;
        }
      }),
    );
  }

  /**
   * Create a poller that will be used to periodically check for the new application.
   */
  private handleDeployValidation(): Observable<boolean> {
    return interval(APP_CHECK_INTERVAL).pipe(
      takeWhile(() => !this.appGuid),
      filter(() => this.deployer.deploying),
      switchMap(() => {
        const { cfGuid, orgGuid, spaceGuid, appData } = this.deployer;
        const headers = new HttpHeaders({ 'x-cap-cnsi-list': cfGuid });
        return this.http.get(`/pp/${proxyAPIVersion}/proxy/v2/apps?q=space_guid:${spaceGuid}&q=name:${appData.Name}`,
          { headers: headers })
          .pipe(
            map(info => {
              if (info && info[cfGuid]) {
                const apps = info[cfGuid];
                if (apps.total_results === 1) {
                  this.appGuid = apps.resources[0].metadata.guid;
                  // New app - so refresh the application wall data
                  this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
                  return true;
                }
              }
              return false;
            }),
            catchError(err => [
              // ignore
            ])
          );
      })
    );
  }
}
