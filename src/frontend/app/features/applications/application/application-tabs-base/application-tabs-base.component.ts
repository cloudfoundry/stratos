import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { take, tap, map, startWith, pairwise } from 'rxjs/operators';
import { Subscription } from 'rxjs/Rx';

import { EntityService } from '../../../../core/entity-service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { GetAppStatsAction, GetAppSummaryAction } from '../../../../store/actions/app-metadata.actions';
import { DeleteApplication } from '../../../../store/actions/application.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { APIResource } from '../../../../store/types/api.types';
import { interval } from 'rxjs/observable/interval';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';

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

// App delete will have a richer delete experience
const appDeleteConfirmation = new ConfirmationDialogConfig(
  'Delete Application',
  'Are you sure you want to delete this Application?',
  'Delete',
  true
);

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss']
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService
  ) { }

  public async: any;

  isFetching$: Observable<boolean>;
  application;
  applicationActions$: Observable<string[]>;
  addedGitHubTab = false;
  summaryDataChanging$: Observable<boolean>;
  appSub$: Subscription;
  entityServiceAppRefresh$: Subscription;
  autoRefreshString = 'auto-refresh';

  autoRefreshing$ = this.entityService.updatingSection$.map(
    update => update[this.autoRefreshString] || { busy: false }
  );

  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'instances', label: 'Instances' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' }
  ];

  stopApplication() {
    this.confirmDialog.open(appStopConfirmation, () => {
      const stoppedString = 'STOPPED';
      this.applicationService.updateApplication({ state: stoppedString }, []);
      this.pollEntityService('stopping', stoppedString).subscribe();
    });
  }

  pollEntityService(state, stateString) {
    return this.entityService
      .poll(1000, state)
      .takeWhile(({ resource, updatingSection }) => {
        return resource.entity.state !== stateString;
      });
  }

  startApplication() {
    this.confirmDialog.open(appStartConfirmation, () => {
      const startedString = 'STARTED';
      this.applicationService.updateApplication({ state: startedString }, []);
      this.pollEntityService('starting', startedString)
        .delay(1)
        .subscribe();
    });
  }

  deleteApplication() {
    this.confirmDialog.open(appDeleteConfirmation, () => {
      this.store.dispatch(
        new DeleteApplication(
          this.applicationService.appGuid,
          this.applicationService.cfGuid
        )
      );
    });
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    // TODO: RC
    // Auto refresh
    // this.entityServiceAppRefresh$ = this.entityService
    //   .poll(10000, this.autoRefreshString)
    //   .do(({ resource }) => {
    //     this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
    //     if (resource && resource.entity && resource.entity.state === 'STARTED') {
    //       this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
    //     }
    //   })
    //   .subscribe();

    this.appSub$ = this.applicationService.app$.subscribe(app => {
      if (
        app.entityRequestInfo.deleting.deleted ||
        app.entityRequestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.isFetching$ =
      Observable.combineLatest(
        this.applicationService.isFetchingApp$,
        this.applicationService.isUpdatingApp$.pipe(
          startWith(true),
          pairwise(),
          map((oldVal, newVal) => {
            return oldVal && !newVal;
          }),
          map(val => !val)
        )
      ).pipe(
        map(([isFetching, isUpdating]) => {
          return isFetching || isUpdating;
        })
      );


    const initialFetch$ = Observable.combineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
    )
      .map(([isFetchingApp, isFetchingEnvVars, isFetchingStats]) => {
        return isFetchingApp || isFetchingEnvVars || isFetchingStats;
      });

    this.summaryDataChanging$ = Observable.combineLatest(
      initialFetch$,
      this.applicationService.isUpdatingApp$,
      this.autoRefreshing$
    ).map(([isFetchingApp, isUpdating, autoRefresh]) => {
      if (autoRefresh.busy) {
        return false;
      }
      return !!(isFetchingApp || isUpdating);
    });

    this.applicationService.applicationStratProject$
      .pipe(take(1))
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
          stratProject.deploySource.type === 'github'
        ) {
          this.tabLinks.push({ link: 'github', label: 'GitHub' });
        }
      });
  }

  ngOnDestroy() {
    this.appSub$.unsubscribe();
    // this.entityServiceAppRefresh$.unsubscribe();
  }
}
