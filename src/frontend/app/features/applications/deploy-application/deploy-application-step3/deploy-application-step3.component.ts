import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { QueueingSubject } from 'queueing-subject/lib';
import websocketConnect from 'rxjs-websockets';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { interval } from 'rxjs/observable/interval';
import { catchError, filter, map, mergeMap, share, switchMap, takeWhile, tap, first } from 'rxjs/operators';
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
import { organizationSchemaKey, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { selectDeployAppState } from '../../../../store/selectors/deploy-application.selector';
import { AppData, DeployApplicationSource, SocketEventTypes } from '../../../../store/types/deploy-application.types';
import { createGetApplicationAction } from '../../application.service';

// Interval to check for new application
const APP_CHECK_INTERVAL = 3000;

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnDestroy {

  @Input('isRedeploy') isRedeploy: string;
  connectSub: Subscription;
  streamTitle = 'Preparing...';
  messages: Observable<string>;
  appData: AppData;
  proxyAPIVersion = environment.proxyAPIVersion;
  appGuid: string;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;

  // Validation poller
  validSub: Subscription;
  valid$ = new BehaviorSubject<boolean>(false);

  error$ = new BehaviorSubject<boolean>(false);
  // Observable for when the deploy modal can be closed
  closeable$: Observable<boolean>;

  // Are we deploying?
  deploying = false;

  constructor(
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    private http: HttpClient,
  ) {
    this.closeable$ = Observable.combineLatest(
      this.valid$,
      this.error$).pipe(
        map(([validated, errored]) => {
          return validated || errored;
        })
      );
  }

  ngOnDestroy() {
    this.store.dispatch(new DeleteDeployAppSection());
    // Unsubscribe from the websocket stream
    if (this.connectSub) {
      this.connectSub.unsubscribe();
    }
    if (this.validSub) {
      this.validSub.unsubscribe();
    }
  }

  onEnter = () => {
    if (this.isRedeploy) {
      this.appGuid = this.isRedeploy;
    }
    this.store.select(selectDeployAppState).pipe(
      filter(appDetail => !!appDetail.cloudFoundryDetails
        && !!appDetail.applicationSource
        && !!appDetail.applicationSource.projectName),
      mergeMap(appDetails => {
        const orgSubscription = this.store.select(selectEntity(organizationSchemaKey, appDetails.cloudFoundryDetails.org));
        const spaceSubscription = this.store.select(selectEntity(spaceSchemaKey, appDetails.cloudFoundryDetails.space));
        return Observable.of(appDetails).combineLatest(orgSubscription, spaceSubscription);
      }),
      first(),
      tap(([appDetail, org, space]) => {
        this.cfGuid = appDetail.cloudFoundryDetails.cloudFoundry;
        this.orgGuid = appDetail.cloudFoundryDetails.org;
        this.spaceGuid = appDetail.cloudFoundryDetails.space;
        const host = window.location.host;
        const streamUrl = (
          `wss://${host}/pp/${this.proxyAPIVersion}/${this.cfGuid}/${this.orgGuid}/${this.spaceGuid}/deploy` +
          `?org=${org.entity.name}&space=${space.entity.name}`
        );

        const inputStream = new QueueingSubject<string>();
        this.messages = websocketConnect(streamUrl, inputStream)
          .messages.pipe(
            catchError(e => {
              return [];
            }),
            share(),
            map(message => {
              const json = JSON.parse(message);
              return json;
            }),
            filter(l => !!l),
            tap((log) => {
              // Deal with control messages
              if (log.type !== SocketEventTypes.DATA) {
                this.processWebSocketMessage(log);
              }
            }),
            filter((log) => log.type === SocketEventTypes.DATA),
            map((log) => log.message)
          );
        inputStream.next(this.sendProjectInfo(appDetail.applicationSource));
      })
    ).subscribe();
  }

  sendProjectInfo = (appSource: DeployApplicationSource) => {
    if (appSource.type.id === 'git') {
      if (appSource.type.subType === 'github') {
        return this.sendGitHubSourceMetadata(appSource);
      }
      if (appSource.type.subType === 'giturl') {
        return this.sendGitUrlSourceMetadata(appSource);
      }
    }
    return '';
  }

  sendGitHubSourceMetadata = (appSource: DeployApplicationSource) => {
    const github = {
      project: appSource.projectName,
      branch: appSource.branch.name,
      type: appSource.type.subType,
      commit: appSource.commit
    };

    const msg = {
      message: JSON.stringify(github),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_GITHUB
    };
    return JSON.stringify(msg);
  }

  sendGitUrlSourceMetadata = (appSource: DeployApplicationSource) => {
    const gitUrl = {
      url: appSource.projectName,
      branch: appSource.branch.name,
      type: appSource.type.subType
    };

    const msg = {
      message: JSON.stringify(gitUrl),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_GITURL
    };
    return JSON.stringify(msg);
  }

  processWebSocketMessage = (log) => {
    switch (log.type) {
      case SocketEventTypes.MANIFEST:
        this.streamTitle = 'Starting deployment...';
        // This info is will be used to retrieve the app Id
        this.appData = JSON.parse(log.message).Applications[0];
        break;
      case SocketEventTypes.EVENT_PUSH_STARTED:
        this.streamTitle = 'Deploying...';
        this.deploying = true;
        // Set this up here to avoid any fun with redeploy case and the deploying flag
        this.validSub = this.createValidationPoller().pipe(
          takeWhile(valid => !valid)
        ).subscribe(null, null, () => {
          this.valid$.next(true);
        });
        break;
      case SocketEventTypes.EVENT_PUSH_COMPLETED:
        // Done
        this.streamTitle = 'Deployed';
        this.deploying = false;
        break;
      case SocketEventTypes.CLOSE_SUCCESS:
        this.close(log, null, null);
        break;
      case SocketEventTypes.CLOSE_INVALID_MANIFEST:
        this.close(log, 'Deploy Failed - Invalid manifest!',
          'Failed to deploy app! Please make sure that a valid manifest.yaml was provided!');
        break;
      case SocketEventTypes.CLOSE_NO_MANIFEST:
        this.close(log, 'Deploy Failed - No manifest present!',
          'Failed to deploy app! Please make sure that a valid manifest.yaml is present!');
        break;
      case SocketEventTypes.CLOSE_FAILED_CLONE:
        this.close(log, 'Deploy Failed - Failed to clone repository!',
          'Failed to deploy app! Please make sure the repository is public!');
        break;
      case SocketEventTypes.CLOSE_FAILED_NO_BRANCH:
        this.close(log, 'Deploy Failed - Failed to located branch!',
          'Failed to deploy app! Please make sure that branch exists!');
        break;
      case SocketEventTypes.CLOSE_FAILURE:
      case SocketEventTypes.CLOSE_PUSH_ERROR:
      case SocketEventTypes.CLOSE_NO_SESSION:
      case SocketEventTypes.CLOSE_NO_CNSI:
      case SocketEventTypes.CLOSE_NO_CNSI_USERTOKEN:
        this.close(log, 'Deploy Failed!',
          'Failed to deploy app!');
        break;
      case SocketEventTypes.SOURCE_REQUIRED:
      case SocketEventTypes.EVENT_CLONED:
      case SocketEventTypes.EVENT_FETCHED_MANIFEST:
      case SocketEventTypes.MANIFEST:
        break;
      default:
      // noop
    }
  }

  close(log, title, error) {
    this.error$.next(true);

    if (title) {
      this.streamTitle = title;
    }

    if (error) {
      error = `${error}\nReason: ${log.message}`;
      this.snackBar.open(error, 'Dismiss');
    }
    this.deploying = false;
  }

  onNext: StepOnNextFunction = () => {
    this.deploying = false;
    // Delete Deploy App Section
    this.store.dispatch(new DeleteDeployAppSection());
    // Take user to applications
    this.store.dispatch(new RouterNav({ path: ['applications', this.cfGuid, this.appGuid] }));
    return Observable.of({ success: true });
  }


  private createValidationPoller(): Observable<boolean> {
    return this.isRedeploy ? this.handleRedeployValidation() : this.handleDeployValidation();
  }

  private handleRedeployValidation(): Observable<boolean> {
    return interval(500).pipe(
      map(() => {
        if (this.deploying) {
          return false;
        } else {
          this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
          this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, this.cfGuid));
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
      filter(() => this.deploying),
      switchMap(() => {
        const headers = new HttpHeaders({ 'x-cap-cnsi-list': this.cfGuid });
        return this.http.get(`/pp/${this.proxyAPIVersion}/proxy/v2/apps?q=space_guid:${this.spaceGuid}&q=name:${this.appData.Name}`,
          { headers: headers })
          .pipe(
            map(info => {
              if (info && info[this.cfGuid]) {
                const apps = info[this.cfGuid];
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
